import axios from "axios";
import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api/v1/users"
});

// Attach JWT Bearer token to every request automatically
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Decode JWT payload (no verification — just reading public claims)
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

function cleanName(val) {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === 'unknown' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
        return null;
    }
    return trimmed;
}

export const AuthProvider = ({ children }) => {
    // Try to restore user profile from localStorage or existing token on mount
    const existingToken = localStorage.getItem("token");
    const existingDecoded = existingToken ? decodeToken(existingToken) : null;
    let savedUser = null;
    try {
        savedUser = JSON.parse(localStorage.getItem("user") || "null");
    } catch {}

    const resolvedUsername = cleanName(savedUser?.username) || cleanName(existingDecoded?.username) || null;
    const resolvedName = cleanName(savedUser?.name) || cleanName(existingDecoded?.name) || resolvedUsername || null;

    const [userData, setUserData] = useState({
        username: resolvedUsername,
        name: resolvedName,
        _id: savedUser?._id || existingDecoded?._id || null,
    });

    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", { name, username, password });
            if (request.status === 201) {
                return request.data.data?.message || "User registered successfully";
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", { username, password });
            if (request.status === 200) {
                const token = request.data.data?.token;
                const userObj = request.data.data?.user;
                localStorage.setItem("token", token);
                const decoded = decodeToken(token);
                const uName = cleanName(userObj?.username) || cleanName(decoded?.username) || cleanName(username);
                const fullName = cleanName(userObj?.name) || cleanName(decoded?.name) || uName;
                const resolvedUser = {
                    username: uName,
                    name: fullName,
                    _id: userObj?._id || decoded?._id || null,
                };
                localStorage.setItem("user", JSON.stringify(resolvedUser));
                setUserData(resolvedUser);
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async () => {
        try {
            const request = await client.get("/get_all_activity");
            return request.data.data || [];
        } catch (err) {
            throw err;
        }
    };

    const addToUserHistory = async (meetingCode) => {
        try {
            const request = await client.post("/add_to_activity", {
                meeting_code: meetingCode
            });
            return request;
        } catch (e) {
            throw e;
        }
    };

    const data = {
        userData, setUserData,
        addToUserHistory, getHistoryOfUser,
        handleRegister, handleLogin
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
