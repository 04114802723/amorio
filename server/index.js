const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://amorio.vercel.app", "https://amorio-*.vercel.app", /\.vercel\.app$/],
    methods: ["GET", "POST"],
  },
  // Tuned for high concurrency.
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Redis setup for horizontal scaling (optional - falls back to memory if no Redis).
const REDIS_URL = process.env.REDIS_URL;
if (REDIS_URL) {
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("Redis adapter connected for horizontal scaling");
    })
    .catch((err) => {
      console.log("Redis not available, using memory adapter:", err.message);
    });
}

const VIBE_ORDER = ["chill", "deep", "funny", "chaotic"];
const WAITING_QUEUE = {
  chill: [],
  deep: [],
  funny: [],
  chaotic: [],
};

// socketId -> { socketId, userId, vibe, joinedAt }
const waitingEntries = new Map();

// socketId -> { userId, vibe }
const userSockets = new Map();

// roomId -> { users: [{ socketId, userId }], vibe, crossVibe, startedAt, mode, roomCode? }
const activeCalls = new Map();

// roomCode -> { participants: [{ socketId, userId, joinedAt }], createdAt }
const callLinkRooms = new Map();

// socketId -> timeout
const crossVibeTimeouts = new Map();

// Match priority order for cross-vibe fallback.
const CROSS_VIBE_TIMEOUT = 10000;

function sanitizeVibe(vibe) {
  return VIBE_ORDER.includes(vibe) ? vibe : "chill";
}

function generateRoomId(prefix = "room") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function clearCrossVibeTimeout(socketId) {
  const timeout = crossVibeTimeouts.get(socketId);
  if (timeout) {
    clearTimeout(timeout);
    crossVibeTimeouts.delete(socketId);
  }
}

function enqueueWaiting(entry) {
  waitingEntries.set(entry.socketId, entry);
  WAITING_QUEUE[entry.vibe].push(entry.socketId);
}

function dequeueNextWaiting(vibe, excludeSocketId) {
  const queue = WAITING_QUEUE[vibe];
  while (queue.length > 0) {
    const candidateSocketId = queue.shift();
    if (candidateSocketId === excludeSocketId) {
      continue;
    }

    const candidate = waitingEntries.get(candidateSocketId);
    if (candidate) {
      waitingEntries.delete(candidateSocketId);
      return candidate;
    }
  }
  return null;
}

function removeWaitingEntry(socketId) {
  waitingEntries.delete(socketId);
  clearCrossVibeTimeout(socketId);
}

function findCrossVibePartner(selectedVibe, excludeSocketId) {
  for (const vibe of VIBE_ORDER) {
    if (vibe === selectedVibe) {
      continue;
    }
    const partner = dequeueNextWaiting(vibe, excludeSocketId);
    if (partner) {
      return { partner, vibe };
    }
  }
  return null;
}

function getUserId(socketId) {
  return userSockets.get(socketId)?.userId;
}

function emitMatched(socketA, socketB, roomId, options) {
  const userA = getUserId(socketA.id);
  const userB = getUserId(socketB.id);
  const isAInitiator = options.initiatorSocketId === socketA.id;

  socketA.emit("matched", {
    roomId,
    isInitiator: isAInitiator,
    partnerUserId: userB,
    crossVibe: options.crossVibe,
  });

  socketB.emit("matched", {
    roomId,
    isInitiator: !isAInitiator,
    partnerUserId: userA,
    crossVibe: options.crossVibe,
  });
}

function matchUsers(socketA, socketB, vibe, options = {}) {
  const roomId = options.roomId || generateRoomId(options.mode === "friend-link" ? "link" : "room");
  const crossVibe = Boolean(options.crossVibe);
  const initiatorSocketId = options.initiatorSocketId || socketA.id;

  removeWaitingEntry(socketA.id);
  removeWaitingEntry(socketB.id);

  socketA.join(roomId);
  socketB.join(roomId);

  activeCalls.set(roomId, {
    users: [
      { socketId: socketA.id, userId: getUserId(socketA.id) },
      { socketId: socketB.id, userId: getUserId(socketB.id) },
    ],
    vibe,
    crossVibe,
    startedAt: Date.now(),
    mode: options.mode || "random",
    roomCode: options.roomCode,
    friendshipConfirmed: false,
    friendRequests: new Set(),
  });

  emitMatched(socketA, socketB, roomId, {
    initiatorSocketId,
    crossVibe,
  });

  console.log(
    `Matched ${socketA.id} with ${socketB.id} in ${roomId}${crossVibe ? " (cross-vibe)" : ""}`
  );

  return roomId;
}

function removeSocketFromCallLinkRoom(roomCode, socketId) {
  if (!roomCode) {
    return;
  }

  const state = callLinkRooms.get(roomCode);
  if (!state) {
    return;
  }

  state.participants = state.participants.filter((participant) => participant.socketId !== socketId);
  if (state.participants.length === 0) {
    callLinkRooms.delete(roomCode);
  }
}

function teardownCall(roomId, leavingSocketId) {
  const call = activeCalls.get(roomId);
  if (!call) {
    return;
  }

  activeCalls.delete(roomId);

  const remainingUsers = call.users.filter((user) => user.socketId !== leavingSocketId);
  remainingUsers.forEach((remainingUser) => {
    const remainingSocket = io.sockets.sockets.get(remainingUser.socketId);
    if (remainingSocket) {
      remainingSocket.emit("partner-left");
    }
  });

  if (call.mode === "friend-link") {
    removeSocketFromCallLinkRoom(call.roomCode, leavingSocketId);

    if (remainingUsers.length === 1 && call.roomCode) {
      const state = callLinkRooms.get(call.roomCode);
      if (state) {
        const stillInRoom = state.participants.some(
          (participant) => participant.socketId === remainingUsers[0].socketId
        );
        if (stillInRoom) {
          const remainingSocket = io.sockets.sockets.get(remainingUsers[0].socketId);
          if (remainingSocket) {
            remainingSocket.emit("waiting-room", {
              message: "Waiting for your friend to rejoin this call link...",
            });
          }
        }
      }
    }
  }
}

function handleSocketLeaveActiveCalls(socketId) {
  for (const [roomId, call] of activeCalls.entries()) {
    if (call.users.some((user) => user.socketId === socketId)) {
      teardownCall(roomId, socketId);
      break;
    }
  }
}

function removeSocketFromAllCallLinkRooms(socketId) {
  for (const [roomCode, state] of callLinkRooms.entries()) {
    state.participants = state.participants.filter((participant) => participant.socketId !== socketId);
    if (state.participants.length === 0) {
      callLinkRooms.delete(roomCode);
    }
  }
}

function getWaitingStats() {
  const stats = {
    chill: 0,
    deep: 0,
    funny: 0,
    chaotic: 0,
    total: 0,
  };

  for (const entry of waitingEntries.values()) {
    if (stats[entry.vibe] !== undefined) {
      stats[entry.vibe] += 1;
      stats.total += 1;
    }
  }

  return stats;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "| Total:", io.engine.clientsCount);

  // User joins random matching queue with selected vibe.
  socket.on("join-queue", ({ vibe, userId }) => {
    if (!userId) {
      socket.emit("queue-error", {
        message: "You must be logged in before entering random matching.",
      });
      return;
    }

    const selectedVibe = sanitizeVibe(vibe);
    console.log(`User ${socket.id} (${userId}) joining ${selectedVibe} queue`);

    userSockets.set(socket.id, { vibe: selectedVibe, userId });

    removeWaitingEntry(socket.id);

    const sameVibePartner = dequeueNextWaiting(selectedVibe, socket.id);
    if (sameVibePartner) {
      const partnerSocket = io.sockets.sockets.get(sameVibePartner.socketId);
      if (partnerSocket) {
        matchUsers(socket, partnerSocket, selectedVibe, {
          mode: "random",
          crossVibe: false,
          initiatorSocketId: socket.id,
        });
        return;
      }
    }

    enqueueWaiting({
      socketId: socket.id,
      userId,
      vibe: selectedVibe,
      joinedAt: Date.now(),
    });
    socket.emit("waiting", {
      mode: "random",
    });
    console.log(`User ${socket.id} waiting in ${selectedVibe} queue`);

    const timeout = setTimeout(() => {
      const stillWaiting = waitingEntries.get(socket.id);
      if (stillWaiting) {
        const crossVibeMatch = findCrossVibePartner(selectedVibe, socket.id);
        if (crossVibeMatch && crossVibeMatch.partner) {
          const partnerSocket = io.sockets.sockets.get(crossVibeMatch.partner.socketId);
          if (partnerSocket) {
            matchUsers(socket, partnerSocket, crossVibeMatch.vibe, {
              mode: "random",
              crossVibe: true,
              initiatorSocketId: socket.id,
            });

            socket.emit("cross-vibe-match", {
              originalVibe: selectedVibe,
              matchedVibe: crossVibeMatch.vibe,
            });

            partnerSocket.emit("cross-vibe-match", {
              originalVibe: crossVibeMatch.vibe,
              matchedVibe: selectedVibe,
            });
          }
        } else {
          socket.emit("still-waiting", { message: "Looking for anyone to match with..." });
        }
      }

      crossVibeTimeouts.delete(socket.id);
    }, CROSS_VIBE_TIMEOUT);

    crossVibeTimeouts.set(socket.id, timeout);
  });

  // User joins a specific friend call link room.
  socket.on("join-room-call", ({ roomCode, userId }) => {
    if (!roomCode || !userId) {
      socket.emit("room-error", {
        message: "Invalid call room or unauthorized user.",
      });
      return;
    }

    userSockets.set(socket.id, {
      userId,
      vibe: userSockets.get(socket.id)?.vibe || "chill",
    });

    const existingState = callLinkRooms.get(roomCode) || {
      participants: [],
      createdAt: Date.now(),
    };

    const alreadyJoined = existingState.participants.some(
      (participant) => participant.socketId === socket.id
    );
    if (alreadyJoined) {
      return;
    }

    const sameUserAlreadyInRoom = existingState.participants.some(
      (participant) => participant.userId === userId
    );
    if (sameUserAlreadyInRoom) {
      socket.emit("room-error", {
        message: "You already joined this call in another tab/device.",
      });
      return;
    }

    if (existingState.participants.length >= 2) {
      socket.emit("room-error", {
        message: "This call link is full.",
      });
      return;
    }

    const roomId = `link_${roomCode}`;
    socket.join(roomId);

    existingState.participants.push({
      socketId: socket.id,
      userId,
      joinedAt: Date.now(),
    });

    callLinkRooms.set(roomCode, existingState);

    if (existingState.participants.length === 1) {
      socket.emit("waiting-room", {
        mode: "friend-link",
        message: "Waiting for your friend to open the call link...",
      });
      return;
    }

    const participants = [...existingState.participants].sort((a, b) => a.joinedAt - b.joinedAt);
    const firstSocket = io.sockets.sockets.get(participants[0].socketId);
    const secondSocket = io.sockets.sockets.get(participants[1].socketId);

    if (!firstSocket || !secondSocket) {
      socket.emit("room-error", {
        message: "Could not connect room participants. Please retry.",
      });
      return;
    }

    matchUsers(firstSocket, secondSocket, "chill", {
      mode: "friend-link",
      roomId,
      roomCode,
      crossVibe: false,
      initiatorSocketId: participants[0].socketId,
    });
  });

  // WebRTC signaling: forward offer.
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  // WebRTC signaling: forward answer.
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  // WebRTC signaling: forward ICE candidate.
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("skip", ({ roomId }) => {
    if (!roomId) {
      return;
    }
    teardownCall(roomId, socket.id);
    console.log(`User ${socket.id} skipped room ${roomId}`);
  });

  socket.on("leave-call", ({ roomId }) => {
    if (!roomId) {
      return;
    }
    teardownCall(roomId, socket.id);
  });

  // Friend request during call.
  socket.on("friend-request", ({ roomId, userId }) => {
    const call = activeCalls.get(roomId);
    if (call) {
      call.friendRequests.add(userId);

      socket.to(roomId).emit("friend-request-received", { 
        from: socket.id,
        fromUserId: userId 
      });
    }
  });

  // Confirm friendship when one user requests and the other accepts.
  socket.on("friend-accept", ({ roomId, userId }) => {
    const call = activeCalls.get(roomId);
    if (!call || call.friendshipConfirmed || !userId) {
      return;
    }

    socket.to(roomId).emit("friend-accepted", { userId });

    const accepter = call.users.find((entry) => entry.userId === userId);
    const otherUser = call.users.find((entry) => entry.userId !== userId);
    if (!accepter || !otherUser) {
      return;
    }

    const requestedByOther = call.friendRequests.has(otherUser.userId);
    if (!requestedByOther) {
      return;
    }

    call.friendshipConfirmed = true;
    io.to(roomId).emit("friendship-confirmed", {
      user1Id: accepter.userId,
      user2Id: otherUser.userId,
    });
  });

  // Reaction messages.
  socket.on("reaction", ({ roomId, emoji }) => {
    socket.to(roomId).emit("reaction", { emoji });
  });

  // Handle disconnect.
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id, "| Total:", io.engine.clientsCount);

    removeWaitingEntry(socket.id);
    handleSocketLeaveActiveCalls(socket.id);
    removeSocketFromAllCallLinkRooms(socket.id);

    userSockets.delete(socket.id);
  });
});

// Health check endpoint with stats.
app.get("/", (req, res) => {
  const waiting = getWaitingStats();
  const stats = {
    status: "AMORIO Signaling Server Running",
    connections: io.engine.clientsCount,
    waiting,
    activeCalls: activeCalls.size,
    redis: !!REDIS_URL,
  };
  res.json(stats);
});

// Stats endpoint for monitoring.
app.get("/stats", (req, res) => {
  const waiting = getWaitingStats();
  res.json({
    connections: io.engine.clientsCount,
    waiting: waiting.total,
    activeCalls: activeCalls.size,
    uptime: process.uptime(),
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`AMORIO Signaling Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Redis: ${REDIS_URL ? "Enabled" : "Disabled (single instance mode)"}`);
});
