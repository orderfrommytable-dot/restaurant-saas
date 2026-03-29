const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http"); 
const { Server } = require("socket.io"); // Bring in Socket.io

dotenv.config();

const app = express();

// 1. Create the HTTP server and wrap Express inside it
const httpServer = http.createServer(app);

// 2. Set up Socket.io with CORS (so your React frontend can talk to it)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your React app's URL
    methods: ["GET", "POST", "PUT"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const indexRoutes = require("./src/routes/index.routes");
app.use("/", indexRoutes);

// 3. Listen for WebSocket connections
io.on("connection", (socket) => {
  console.log("🟢 A user connected to the Live Kitchen:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// MAKE IO GLOBALLY AVAILABLE
app.set("io", io); 

const PORT = process.env.PORT || 5000;

// 4. IMPORTANT: Start httpServer instead of app
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});