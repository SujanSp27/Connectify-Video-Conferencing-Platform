import "dotenv/config";
import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";
import { connectToSocket } from "./controllers/socketManager.js";
import mongoose from "mongoose";

import userRoutes from "./routes/users.routes.js";
import cors from "cors";
const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "An internal error occurred" });
});

const start = async () => {
    app.set("mongo_user")
    const connectionDb = await mongoose.connect(process.env.MONGODB_URI)

    console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`\n❌ Port ${app.get("port")} is already in use. Please terminate any other node process or specify PORT=<number> in your .env file.\n`);
        } else {
            console.error("Server error:", err);
        }
        process.exit(1);
    });

    server.listen(app.get("port"), () => {
        console.log(`LISTENING ON PORT ${app.get("port")}`);
    });



}



start();