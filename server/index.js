const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
     origin: ["http://localhost:3000", "https://amorio.vercel.app", "https://amorio-*.vercel.app", /\.vercel\.app$/],
    methods: ["GET", "POST"],
  },
});

// Store waiting users by vibe
const waitingUsers = {
  chill: [],
  deep: [],
  funny: [],
  chaotic: [],
};

// Store active calls
const activeCalls = new Map();

// Store user socket mappings
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins queue with selected vibe
  socket.on("join-queue", ({ vibe, userId }) => {
    const selectedVibe = vibe || "chill";
    console.log(`User ${socket.id} joining ${selectedVibe} queue`);

    userSockets.set(socket.id, { vibe: selectedVibe, oderId: userId });

    // Check if someone is waiting in this vibe
    if (waitingUsers[selectedVibe] && waitingUsers[selectedVibe].length > 0) {
      const partner = waitingUsers[selectedVibe].shift();

      // Create a room for these two users
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Join both to the room
      socket.join(roomId);
      partner.socket.join(roomId);

      // Store active call
      activeCalls.set(roomId, {
        users: [socket.id, partner.socket.id],
        vibe: selectedVibe,
        startedAt: Date.now(),
      });

      // Notify both users they're matched
      socket.emit("matched", { roomId, isInitiator: true });
      partner.socket.emit("matched", { roomId, isInitiator: false });

      console.log(`Matched ${socket.id} with ${partner.socket.id} in room ${roomId}`);
    } else {
      // Add to waiting queue
      if (!waitingUsers[selectedVibe]) waitingUsers[selectedVibe] = [];
      waitingUsers[selectedVibe].push({ socket, userId });
      socket.emit("waiting");
      console.log(`User ${socket.id} waiting in ${selectedVibe} queue`);
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

  // Friend request during call
  socket.on("friend-request", ({ roomId }) => {
    socket.to(roomId).emit("friend-request-received", { from: socket.id });
  });

  // Accept friend request
  socket.on("friend-accept", ({ roomId }) => {
    socket.to(roomId).emit("friend-accepted");
    io.to(roomId).emit("friendship-confirmed");
  });

  // Reaction bomb
  socket.on("reaction", ({ roomId, emoji }) => {
    socket.to(roomId).emit("reaction", { emoji });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from waiting queues
    Object.keys(waitingUsers).forEach((vibe) => {
      waitingUsers[vibe] = waitingUsers[vibe].filter(
        (user) => user.socket.id !== socket.id
      );
    });

    // Notify partner if in active call
    activeCalls.forEach((call, roomId) => {
      if (call.users.includes(socket.id)) {
        socket.to(roomId).emit("partner-left");
        activeCalls.delete(roomId);
      }
    });

    userSockets.delete(socket.id);
  });
});

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "AMORIO Signaling Server Running", connections: io.engine.clientsCount });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 AMORIO Signaling Server running on port ${PORT}`);
});
