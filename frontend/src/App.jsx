import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/auth/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/auth/AdminLogin";

import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import DashboardHome from "./pages/dashboard/DashboardHome";
import AdminDashboard from "./pages/dashboard/AdminDashboard";

import GoalDetails from "./pages/goals/GoalDetails";

import UserRoute from "./routes/UserRoute";
import AdminRoute from "./routes/AdminRoute";

// ✅ ONLY add this import (make sure file exists)
import Portfolio from "./pages/portfolio/Portfolio";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Password reset routes (public) */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* User protected routes */}
      <Route element={<UserRoute />}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Route>

      {/* Admin protected routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/user/:email/goals" element={<GoalDetails />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
