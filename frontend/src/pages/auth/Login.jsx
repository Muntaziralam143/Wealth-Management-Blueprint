import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

// ✅ background image
import bgImage from "../../assets/bg/login-bg.jpg";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: cleanEmail,
        password,
      });

      const token = res?.data?.access_token;
      if (!token) {
        setError("Login failed: token not received.");
        return;
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("role", "user");
      localStorage.setItem("currentUserEmail", cleanEmail);

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Login failed. Check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ================= BACKGROUND ================= */
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* smooth overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        {/* ================= LOGIN CARD ================= */}
        <div className="relative w-full max-w-md rounded-3xl bg-white/60 backdrop-blur-2xl shadow-2xl ring-1 ring-white/30 p-8">
          
          {/* 🔙 Back to Home (INSIDE CARD) */}
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow hover:bg-white transition"
          >
            ← Home
          </button>

          {/* Header */}
          <div className="mt-6 text-center">
            <h1 className="text-3xl font-extrabold text-indigo-950">
              Welcome Back 👋
            </h1>
            <p className="mt-2 text-sm text-slate-800">
              Login to manage your goals & wealth
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-800">
                Email address
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-800">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-700 hover:underline"
                >
                  Forgot?
                </Link>
              </div>

              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>

            <button
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="flex justify-center gap-1 text-sm text-slate-700">
              <span>New here?</span>
              <Link
                to="/register"
                className="font-semibold text-indigo-700 hover:underline"
              >
                Create account
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-700">
            Secure access • Personalized wealth dashboard
          </div>
        </div>
      </div>
    </div>
  );
}
