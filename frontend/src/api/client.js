import axios from "axios";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
    baseURL: API_BASE_URL, // no trailing slash needed
    timeout: 15000,
});

// Attach token automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Optional: handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            // token invalid/expired
            localStorage.removeItem("access_token");
        }
        return Promise.reject(err);
    }
);
