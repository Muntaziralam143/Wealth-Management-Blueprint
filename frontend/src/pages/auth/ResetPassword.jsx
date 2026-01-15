import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const tokenFromUrl = useMemo(() => params.get("token") || "", [params]);

    const [token, setToken] = useState(tokenFromUrl);
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        setToken(tokenFromUrl);
    }, [tokenFromUrl]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");

        if (!token.trim()) {
            setErr("Missing token. Paste token or open reset link again.");
            return;
        }
        if (newPassword.length < 8) {
            setErr("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirm) {
            setErr("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("http://127.0.0.1:8000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, new_password: newPassword }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErr(data?.detail || "Reset failed.");
                return;
            }

            setMsg(data?.message || "Password reset successful!");
            setTimeout(() => navigate("/login"), 900);
        } catch (e2) {
            setErr("Server not reachable. Is backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#eef0ff] via-[#f6edff] to-white flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-black/5 p-6">
                <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Paste the token from your email (or backend terminal in dev), set a new password.
                </p>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Reset Token</label>
                        <textarea
                            className="mt-1 w-full min-h-[90px] rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Paste token here..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">New Password</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            type="password"
                            autoComplete="new-password"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Keep it under 72 characters (bcrypt limitation).
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Confirm new password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            type="password"
                            autoComplete="new-password"
                        />
                    </div>

                    {err && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {err}
                        </div>
                    )}
                    {msg && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                            {msg} Redirecting to login…
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
                    >
                        {loading ? "Resetting..." : "Reset password"}
                    </button>

                    <div className="text-center text-sm text-slate-600">
                        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
