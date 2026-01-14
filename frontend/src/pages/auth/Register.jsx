import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

// ✅ same background image as Login
import bgImage from "../../assets/bg/login-bg.jpg";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  // ✅ helpers
  const safeJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const normEmail = (e) => String(e || "").trim().toLowerCase();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = normEmail(email);

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill all fields.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name: cleanName,
        email: cleanEmail,
        password,
      });

      const token = res?.data?.access_token;
      if (!token) {
        setError("Registration failed: token not received.");
        return;
      }

      localStorage.setItem("access_token", token);
      localStorage.setItem("role", "user");
      localStorage.setItem("currentUserEmail", cleanEmail);

      // ✅ store user in localStorage for AdminDashboard
      const users = safeJSON("users", []);
      const safeUsers = Array.isArray(users) ? users : [];

      const exists = safeUsers.some((u) => normEmail(u?.email) === cleanEmail);

      const newUser = {
        name: cleanName,
        email: cleanEmail,
        role: "user",
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = exists
        ? safeUsers.map((u) =>
            normEmail(u?.email) === cleanEmail ? { ...u, ...newUser } : u
          )
        : [newUser, ...safeUsers];

      localStorage.setItem("users", JSON.stringify(updatedUsers));
      window.dispatchEvent(new Event("users_updated"));

      navigate("/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Registration failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ================= BACKGROUND (same as Login) ================= */
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* smooth dark overlay */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        {/* ✅ 20% smaller card: max-w-md -> max-w-sm, p-8 -> p-6 */}
        <div className="relative w-full max-w-sm rounded-3xl bg-white/55 backdrop-blur-2xl shadow-2xl ring-1 ring-white/30 p-6">
          {/* 🔙 Back to Home (inside card) */}
          <button
            onClick={() => navigate("/")}
            className="absolute left-4 top-4 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow hover:bg-white transition"
          >
            ← Home
          </button>

          {/* Header */}
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-extrabold text-indigo-950">
              Create Account ✨
            </h1>
            <p className="mt-2 text-xs text-slate-800">
              Start tracking goals & building your portfolio
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-800">
                Full name
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Email address
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
              <p className="mt-1 text-[11px] text-slate-700">
                Use at least 4 characters.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-800">
                Confirm password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
              />
            </div>

            <button
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>

            <div className="flex justify-center gap-1 text-sm text-slate-800">
              <span>Already have an account?</span>
              <Link to="/login" className="font-semibold text-indigo-700 hover:underline">
                Login
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-5 text-center text-[11px] text-slate-800">
            Secure access • Personalized wealth dashboard
          </div>
        </div>
      </div>
    </div>
  );
}
