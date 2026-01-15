import { api } from "./client";

export async function registerUser(payload) {
    // payload: { name, email, password }
    const res = await api.post("/api/auth/register", payload);
    return res.data; // { access_token, token_type }
}

export async function loginUser(payload) {
    // payload: { email, password }
    const res = await api.post("/api/auth/login", payload);
    return res.data;
}
