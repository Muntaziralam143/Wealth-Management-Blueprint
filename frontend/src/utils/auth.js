// src/utils/auth.js

export const getToken = () => localStorage.getItem("access_token");

export const setToken = (token) => localStorage.setItem("access_token", token);

export const clearToken = () => localStorage.removeItem("access_token");

export const getRole = () => localStorage.getItem("role") || "user";

export const setRole = (role) => localStorage.setItem("role", role);

export const clearRole = () => localStorage.removeItem("role");
