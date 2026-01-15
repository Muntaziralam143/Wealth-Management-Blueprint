import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/auth/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminLogin from "../pages/auth/AdminLogin";

import DashboardHome from "../pages/dashboard/DashboardHome";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import GoalDetails from "../pages/goals/GoalDetails";

import UserRoute from "./UserRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
    return (
        <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* USER PROTECTED */}
            <Route element={<UserRoute />}>
                <Route path="/dashboard" element={<DashboardHome />} />
            </Route>

            {/* ADMIN PROTECTED */}
            <Route element={<AdminRoute />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin/user/:email/goals" element={<GoalDetails />} />
            </Route>

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
