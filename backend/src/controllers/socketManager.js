import { Server } from "socket.io";

let connections = {};   // roomId -> [socketId, ...]
let messages    = {};   // roomId -> [{id, sender, senderName, message, senderSocketId, timestamp}]
let timeOnline  = {};   // socketId -> Date
let socketToRoom = {};  // socketId -> roomId
let socketNames  = {};  // socketId -> displayName

export const connectToSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log(`${socket.id} connected`);

        // ── JOIN ROOM ──────────────────────────────────────────────
        // payload: { roomId, name }
        socket.on("join-call", (payload) => {

            // Support both old string format and new object format
            const roomId      = typeof payload === "string" ? payload : payload.roomId;
            const displayName = typeof payload === "string" ? "Guest"  : (payload.name || "Guest");

            if (!connections[roomId]) connections[roomId] = [];

            connections[roomId].push(socket.id);
            socketToRoom[socket.id] = roomId;
            socketNames[socket.id]  = displayName;
            timeOnline[socket.id]   = new Date();

            // Build participant list with names for the joining user
            const participantList = connections[roomId].map(sid => ({
                socketId: sid,
                name: socketNames[sid] || "Guest"
            }));

            // Notify EVERYONE in the room (including the joiner) of the new participant list
            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit(
                    "user-joined",
                    socket.id,
                    connections[roomId],      // keep backward-compat array
                    participantList           // new: full list with names
                );
            });

            // Replay chat history only to the newly joined socket
            if (messages[roomId]) {
                messages[roomId].forEach((msg) => {
                    io.to(socket.id).emit(
                        "chat-message",
                        msg.id,
                        msg.message,
                        msg.sender,
                        msg.senderName,
                        msg.senderSocketId
                    );
                });
            }

        });

        // ── SIGNAL ────────────────────────────────────────────────
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ── CHAT MESSAGE ──────────────────────────────────────────
        socket.on("chat-message", (message, sender) => {

            const roomId = socketToRoom[socket.id];
            if (!roomId) return;

            if (!messages[roomId]) messages[roomId] = [];

            // Generate a unique message ID to prevent client-side duplication
            const msgId = `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const senderName = socketNames[socket.id] || sender || "Guest";

            messages[roomId].push({
                id:             msgId,
                sender,
                senderName,
                message,
                senderSocketId: socket.id,
                timestamp:      Date.now()
            });

            console.log(`[chat] ${senderName}: ${message}`);

            // Broadcast to ALL participants INCLUDING the sender
            // The client uses the msgId to deduplicate the optimistic copy
            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit(
                    "chat-message",
                    msgId,
                    message,
                    sender,
                    senderName,
                    socket.id       // senderSocketId — so client knows if it's their own
                );
            });

        });

        // ── VIDEO STATE ───────────────────────────────────────────
        socket.on("video-state", (enabled) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;
            // Broadcast to everyone else in the room
            connections[roomId].forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("video-state", socket.id, enabled);
                }
            });
        });

        // ── AUDIO STATE ───────────────────────────────────────────
        socket.on("audio-state", (enabled) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;
            connections[roomId].forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("audio-state", socket.id, enabled);
                }
            });
        });

        // ── REACTION ──────────────────────────────────────────────
        socket.on("reaction", (emoji, senderSocketId) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;
            // Broadcast to everyone else so they see the reaction on the sender's tile
            connections[roomId].forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("reaction", emoji, socket.id);
                }
            });
        });

        // ── DISCONNECT ────────────────────────────────────────────
        socket.on("disconnect", () => {

            const roomId = socketToRoom[socket.id];
            if (!roomId) return;

            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit("user-left", socket.id);
            });

            connections[roomId] = connections[roomId].filter(id => id !== socket.id);

            if (connections[roomId].length === 0) {
                delete connections[roomId];
                delete messages[roomId];
            }

            delete socketToRoom[socket.id];
            delete socketNames[socket.id];
            delete timeOnline[socket.id];

            console.log(`${socket.id} disconnected`);
        });

    });

    return io;
};
