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
  // Optimize for high concurrency
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Redis setup for horizontal scaling (optional - falls back to memory if no Redis)
const REDIS_URL = process.env.REDIS_URL;
if (REDIS_URL) {
  const pubClient = createClient({ url: REDIS_URL });
  const subClient = pubClient.duplicate();
  
  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log("✅ Redis adapter connected for horizontal scaling");
    })
    .catch((err) => {
      console.log("⚠️ Redis not available, using memory adapter:", err.message);
    });
}

// Store waiting users by vibe (in-memory, use Redis in production for multi-instance)
const waitingUsers = {
  chill: [],
  deep: [],
  funny: [],
  chaotic: [],
};

// Vibe priority order for cross-vibe matching
const VIBE_ORDER = ["chill", "deep", "funny", "chaotic"];

// Cross-vibe matching timeout (ms)
const CROSS_VIBE_TIMEOUT = 10000; // 10 seconds

// Store active calls
const activeCalls = new Map();

// Store user socket mappings with their user IDs
const userSockets = new Map();

// Store pending cross-vibe timeouts
const crossVibeTimeouts = new Map();

// Find a partner in any vibe queue (cross-vibe matching)
function findPartnerInAnyVibe(excludeVibe) {
  for (const vibe of VIBE_ORDER) {
    if (vibe !== excludeVibe && waitingUsers[vibe].length > 0) {
      return { partner: waitingUsers[vibe].shift(), vibe };
    }
  }
  return null;
}

// Match two users
function matchUsers(socket, partner, vibe, crossVibe = false) {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Join both to the room
  socket.join(roomId);
  partner.socket.join(roomId);
  
  // Store active call with user IDs for friendship
  activeCalls.set(roomId, {
    users: [
      { socketId: socket.id, oderId: userSockets.get(socket.id)?.userId },
      { socketId: partner.socket.id, oderId: partner.userId }
    ],
    vibe,
    crossVibe,
    startedAt: Date.now(),
  });
  
  // Notify both users they're matched
  socket.emit("matched", { 
    roomId, 
    isInitiator: true,
    partnerUserId: partner.userId,
    crossVibe
  });
  partner.socket.emit("matched", { 
    roomId, 
    isInitiator: false,
    partnerUserId: userSockets.get(socket.id)?.userId,
    crossVibe
  });
  
  console.log(`Matched ${socket.id} with ${partner.socket.id} in room ${roomId}${crossVibe ? ' (cross-vibe)' : ''}`);
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "| Total:", io.engine.clientsCount);

  // User joins queue with selected vibe
  socket.on("join-queue", ({ vibe, userId }) => {
    const selectedVibe = vibe || "chill";
    console.log(`User ${socket.id} (${userId}) joining ${selectedVibe} queue`);

    userSockets.set(socket.id, { vibe: selectedVibe, userId });

    // Check if someone is waiting in this vibe
    if (waitingUsers[selectedVibe] && waitingUsers[selectedVibe].length > 0) {
      const partner = waitingUsers[selectedVibe].shift();
      matchUsers(socket, partner, selectedVibe);
    } else {
      // Add to waiting queue
      if (!waitingUsers[selectedVibe]) waitingUsers[selectedVibe] = [];
      waitingUsers[selectedVibe].push({ socket, userId });
      socket.emit("waiting");
      console.log(`User ${socket.id} waiting in ${selectedVibe} queue (${waitingUsers[selectedVibe].length} waiting)`);
      
      // Set cross-vibe timeout
      const timeout = setTimeout(() => {
        // Check if still waiting
        const stillWaiting = waitingUsers[selectedVibe].find(u => u.socket.id === socket.id);
        if (stillWaiting) {
          // Remove from current queue
          waitingUsers[selectedVibe] = waitingUsers[selectedVibe].filter(u => u.socket.id !== socket.id);
          
          // Try to find partner in any other vibe
          const crossVibeMatch = findPartnerInAnyVibe(selectedVibe);
          if (crossVibeMatch) {
            matchUsers(socket, crossVibeMatch.partner, crossVibeMatch.vibe, true);
            socket.emit("cross-vibe-match", { originalVibe: selectedVibe, matchedVibe: crossVibeMatch.vibe });
          } else {
            // No match found, put back in queue
            waitingUsers[selectedVibe].push({ socket, userId });
            socket.emit("still-waiting", { message: "Looking for anyone to match with..." });
          }
        }
        crossVibeTimeouts.delete(socket.id);
      }, CROSS_VIBE_TIMEOUT);
      
      crossVibeTimeouts.set(socket.id, timeout);
    }
  });

  // WebRTC signaling - forward offer
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  // WebRTC signaling - forward answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  // WebRTC signaling - forward ICE candidate
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // User skips current call
  socket.on("skip", ({ roomId }) => {
    socket.to(roomId).emit("partner-left");
    socket.leave(roomId);
    activeCalls.delete(roomId);
    console.log(`User ${socket.id} skipped from room ${roomId}`);
  });

  // Friend request during call - includes both user IDs
  socket.on("friend-request", ({ roomId, userId }) => {
    const call = activeCalls.get(roomId);
    if (call) {
      // Store that this user sent a friend request
      if (!call.friendRequests) call.friendRequests = new Set();
      call.friendRequests.add(userId);
      
      socket.to(roomId).emit("friend-request-received", { 
        from: socket.id,
        fromUserId: userId 
      });
    }
  });

  // Accept friend request - confirm friendship with both user IDs
  socket.on("friend-accept", ({ roomId, oderId }) => {
    const call = activeCalls.get(roomId);
    if (call) {
      // Get both user IDs
      const user1 = call.users.find(u => u.socketId === socket.id);
      const user2 = call.users.find(u => u.socketId !== socket.id);
      
      socket.to(roomId).emit("friend-accepted", { userId: userId });
      io.to(roomId).emit("friendship-confirmed", {
        user1Id: user1?.userId,
        user2Id: user2?.userId
      });
    }
  });

  // Reaction bomb
  socket.on("reaction", ({ roomId, emoji }) => {
    socket.to(roomId).emit("reaction", { emoji });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id, "| Total:", io.engine.clientsCount);

    // Clear cross-vibe timeout
    const timeout = crossVibeTimeouts.get(socket.id);
    if (timeout) {
      clearTimeout(timeout);
      crossVibeTimeouts.delete(socket.id);
    }

    // Remove from waiting queues
    Object.keys(waitingUsers).forEach((vibe) => {
      waitingUsers[vibe] = waitingUsers[vibe].filter(
        (user) => user.socket.id !== socket.id
      );
    });

    // Notify partner if in active call
    activeCalls.forEach((call, roomId) => {
      const isInCall = call.users.some(u => u.socketId === socket.id);
      if (isInCall) {
        socket.to(roomId).emit("partner-left");
        activeCalls.delete(roomId);
      }
    });

    userSockets.delete(socket.id);
  });
});

// Health check endpoint with stats
app.get("/", (req, res) => {
  const stats = {
    status: "AMORIO Signaling Server Running",
    connections: io.engine.clientsCount,
    waiting: {
      chill: waitingUsers.chill.length,
      deep: waitingUsers.deep.length,
      funny: waitingUsers.funny.length,
      chaotic: waitingUsers.chaotic.length,
      total: Object.values(waitingUsers).reduce((a, b) => a + b.length, 0)
    },
    activeCalls: activeCalls.size,
    redis: !!REDIS_URL
  };
  res.json(stats);
});

// Stats endpoint for monitoring
app.get("/stats", (req, res) => {
  res.json({
    connections: io.engine.clientsCount,
    waiting: Object.values(waitingUsers).reduce((a, b) => a + b.length, 0),
    activeCalls: activeCalls.size,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 AMORIO Signaling Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔌 Redis: ${REDIS_URL ? 'Enabled' : 'Disabled (single instance mode)'}`);
});
