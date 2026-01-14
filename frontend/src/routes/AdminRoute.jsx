import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  // ✅ use the same keys your app uses everywhere else
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/admin-login" replace />;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
