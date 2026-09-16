import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { Meeting } from "../models/meeting.model.js";
import jwt from "jsonwebtoken";

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        const token = jwt.sign(
            { _id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({ success: true, data: { token } });
    } catch (e) {
        next(e);
    }
};

const register = async (req, res, next) => {
    try {
        const { name, username, password } = req.body;

        if (!name || name.trim().length < 2 || name.trim().length > 50) {
            return res.status(400).json({ success: false, message: "Name must be between 2 and 50 characters" });
        }
        if (!username || !/^[a-zA-Z0-9]{3,30}$/.test(username)) {
            return res.status(400).json({ success: false, message: "Username must be 3–30 alphanumeric characters" });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await new User({ name: name.trim(), username, password: hashedPassword }).save();

        return res.status(201).json({ success: true, data: { message: "User registered successfully" } });
    } catch (e) {
        next(e);
    }
};

const getUserHistory = async (req, res, next) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user.username })
            .sort({ date: -1 });
        return res.status(200).json({ success: true, data: meetings });
    } catch (e) {
        next(e);
    }
};

const addToHistory = async (req, res, next) => {
    try {
        const { meeting_code } = req.body;

        if (!meeting_code) {
            return res.status(400).json({ success: false, message: "Meeting code is required" });
        }

        await new Meeting({ user_id: req.user.username, meetingCode: meeting_code }).save();
        return res.status(201).json({ success: true, data: { message: "Added to history" } });
    } catch (e) {
        next(e);
    }
};

export { login, register, getUserHistory, addToHistory };
