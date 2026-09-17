import { Server } from "socket.io";

let connections = {};   // roomId -> [socketId, ...]
let messages    = {};   // roomId -> [{id, sender, senderName, message, senderSocketId, timestamp}]
let timeOnline  = {};   // socketId -> Date
let socketToRoom = {};  // socketId -> roomId
let socketNames  = {};  // socketId -> displayName
let mediaStates  = {};  // socketId -> { videoEnabled: boolean, audioEnabled: boolean }

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
        // payload: { roomId, name, videoEnabled, audioEnabled }
        socket.on("join-call", (payload) => {

            const roomId       = typeof payload === "string" ? payload : payload.roomId;
            const displayName  = typeof payload === "string" ? "Guest"  : (payload.name || "Guest");
            const videoEnabled = typeof payload === "object" && payload.videoEnabled !== undefined ? payload.videoEnabled : true;
            const audioEnabled = typeof payload === "object" && payload.audioEnabled !== undefined ? payload.audioEnabled : true;

            if (!connections[roomId]) connections[roomId] = [];

            if (!connections[roomId].includes(socket.id)) {
                connections[roomId].push(socket.id);
            }
            socketToRoom[socket.id] = roomId;
            socketNames[socket.id]  = displayName;
            mediaStates[socket.id]  = { videoEnabled, audioEnabled };
            timeOnline[socket.id]   = new Date();

            // Build participant list with names and media states
            const participantList = connections[roomId].map(sid => ({
                socketId: sid,
                name: socketNames[sid] || "Guest",
                videoEnabled: mediaStates[sid]?.videoEnabled !== false,
                audioEnabled: mediaStates[sid]?.audioEnabled !== false
            }));

            // Notify EVERYONE in the room (including the joiner) of the new participant list
            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit(
                    "user-joined",
                    socket.id,
                    connections[roomId],
                    participantList
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
                        msg.senderSocketId,
                        msg.timestamp
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
            const timestamp = Date.now();

            const msgObj = {
                id:             msgId,
                sender:         senderName,
                senderName,
                message,
                senderSocketId: socket.id,
                timestamp
            };

            messages[roomId].push(msgObj);

            // Keep message buffer limited to last 100 per room
            if (messages[roomId].length > 100) {
                messages[roomId].shift();
            }

            console.log(`[chat] [${roomId}] ${senderName}: ${message}`);

            // Broadcast to ALL participants INCLUDING the sender
            connections[roomId]?.forEach((socketId) => {
                io.to(socketId).emit(
                    "chat-message",
                    msgId,
                    message,
                    senderName,
                    senderName,
                    socket.id,
                    timestamp
                );
            });

        });

        // ── VIDEO STATE ───────────────────────────────────────────
        socket.on("video-state", (enabled) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;

            if (!mediaStates[socket.id]) {
                mediaStates[socket.id] = { videoEnabled: enabled, audioEnabled: true };
            } else {
                mediaStates[socket.id].videoEnabled = enabled;
            }

            // Broadcast to everyone else in the room
            connections[roomId]?.forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("video-state", socket.id, enabled);
                }
            });
        });

        // ── AUDIO STATE ───────────────────────────────────────────
        socket.on("audio-state", (enabled) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;

            if (!mediaStates[socket.id]) {
                mediaStates[socket.id] = { videoEnabled: true, audioEnabled: enabled };
            } else {
                mediaStates[socket.id].audioEnabled = enabled;
            }

            connections[roomId]?.forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("audio-state", socket.id, enabled);
                }
            });
        });

        // ── REACTION ──────────────────────────────────────────────
        socket.on("reaction", (emoji) => {
            const roomId = socketToRoom[socket.id];
            if (!roomId) return;
            // Broadcast to everyone else so they see the reaction on the sender's tile
            connections[roomId]?.forEach((socketId) => {
                if (socketId !== socket.id) {
                    io.to(socketId).emit("reaction", emoji, socket.id);
                }
            });
        });

        // ── DISCONNECT ────────────────────────────────────────────
        socket.on("disconnect", () => {

            const roomId = socketToRoom[socket.id];
            if (!roomId) return;

            connections[roomId] = (connections[roomId] || []).filter(id => id !== socket.id);

            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit("user-left", socket.id);
            });

            if (connections[roomId].length === 0) {
                delete connections[roomId];
                delete messages[roomId];
            }

            delete socketToRoom[socket.id];
            delete socketNames[socket.id];
            delete mediaStates[socket.id];
            delete timeOnline[socket.id];

            console.log(`${socket.id} disconnected`);
        });

    });

    return io;
};
