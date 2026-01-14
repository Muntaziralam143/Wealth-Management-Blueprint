import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setErr("");

        if (!email.trim()) {
            setErr("Please enter your email.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch("http://127.0.0.1:8000/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setErr(data?.detail || "Something went wrong.");
                return;
            }

            // backend returns generic message (good for security)
            setMsg(data?.message || "If the email exists, a reset link will be sent.");
        } catch (e2) {
            setErr("Server not reachable. Is backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-[#eef0ff] via-[#f6edff] to-white flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-black/5 p-6">
                <h1 className="text-2xl font-bold text-slate-900">Forgot password</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Enter your email and we’ll send you a reset link.
                </p>

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            autoComplete="email"
                        />
                    </div>

                    {err && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {err}
                        </div>
                    )}
                    {msg && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                            {msg}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>

                    <div className="text-center text-sm text-slate-600">
                        Remembered?{" "}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                            Back to login
                        </Link>
                    </div>
                </form>

                <div className="mt-4 text-xs text-slate-500">
                    Tip (dev): your backend prints the reset token in the terminal. Copy it into the reset page.
                </div>
            </div>
        </div>
    );
}
