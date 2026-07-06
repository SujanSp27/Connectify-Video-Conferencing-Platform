import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let socketToRoom = {};

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

        // JOIN ROOM
        socket.on("join-call", (roomId) => {

            if (!connections[roomId]) {
                connections[roomId] = [];
            }

            connections[roomId].push(socket.id);

            // Store which room this socket belongs to
            socketToRoom[socket.id] = roomId;

            timeOnline[socket.id] = new Date();

            // Notify everyone in the room
            connections[roomId].forEach((socketId) => {
                io.to(socketId).emit(
                    "user-joined",
                    socket.id,
                    connections[roomId]
                );
            });

            // Send previous messages to newly joined user
            if (messages[roomId]) {

                messages[roomId].forEach((msg) => {

                    io.to(socket.id).emit(
                        "chat-message",
                        msg.message,
                        msg.sender,
                        msg.senderSocketId
                    );

                });

            }

        });

       
        // SIGNAL
      

        socket.on("signal", (toId, message) => {

            io.to(toId).emit(
                "signal",
                socket.id,
                message
            );

        });

        // CHAT MESSAGE

        socket.on("chat-message", (message, sender) => {

            const roomId = socketToRoom[socket.id];

            if (!roomId) return;

            if (!messages[roomId]) {
                messages[roomId] = [];
            }

            messages[roomId].push({

                sender,
                message,
                senderSocketId: socket.id,
                timestamp: Date.now()

            });

            console.log(`${sender}: ${message}`);

            connections[roomId].forEach((socketId) => {

                io.to(socketId).emit(
                    "chat-message",
                    message,
                    sender,
                    socket.id
                );

            });

        });

        // DISCONNECT

        socket.on("disconnect", () => {

            const roomId = socketToRoom[socket.id];

            if (!roomId) return;

            connections[roomId].forEach((socketId) => {

                io.to(socketId).emit(
                    "user-left",
                    socket.id
                );

            });

            connections[roomId] = connections[roomId].filter(
                (id) => id !== socket.id
            );

            if (connections[roomId].length === 0) {
                delete connections[roomId];
                delete messages[roomId];
            }

            delete socketToRoom[socket.id];
            delete timeOnline[socket.id];

            console.log(`${socket.id} disconnected`);

        });

    });

    return io;

};