// routes/UserRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function UserRoute() {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "user") return <Navigate to="/admin-dashboard" replace />;

  return <Outlet />;
}
