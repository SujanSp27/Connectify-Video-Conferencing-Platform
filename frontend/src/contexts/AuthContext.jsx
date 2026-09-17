import axios from "axios";
import { createContext, useContext, useState } from "react";
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

export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);

    // Try to restore username from existing token on mount
    const existingToken = localStorage.getItem("token");
    const existingDecoded = existingToken ? decodeToken(existingToken) : null;

    const [userData, setUserData] = useState({
        ...authContext,
        username: existingDecoded?.username || null,
        name: existingDecoded?.name || null,
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
                setUserData(prev => ({
                    ...prev,
                    username: userObj?.username || decoded?.username || username,
                    name: userObj?.name || decoded?.name || null
                }));
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
