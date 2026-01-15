import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ADMIN_EMAIL = "admin@gmail.com";
  const ADMIN_PASSWORD = "admin123";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = password || "";

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);

    if (cleanEmail !== ADMIN_EMAIL || cleanPassword !== ADMIN_PASSWORD) {
      setError("Admin login failed. Wrong credentials.");
      setLoading(false);
      return;
    }

    // ✅ FIX: use the same key AdminRoute/AdminDashboard expects
    localStorage.setItem("access_token", "admin-token");
    localStorage.setItem("role", "admin");

    setLoading(false);
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-white/5 p-6 backdrop-blur">
          <button
            onClick={() => navigate("/")}
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/20 transition"
          >
            ← Back to Home
          </button>

          <h1 className="text-2xl font-bold text-red-200">Admin Login</h1>
          <p className="mt-1 text-sm text-white/70">
            Only authorized admins can access the admin dashboard.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-white/80">Admin Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-white/25"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                type="email"
              />
            </div>

            <div>
              <label className="text-sm text-white/80">Password</label>
              <input
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-white/25"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500/90 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login as Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
