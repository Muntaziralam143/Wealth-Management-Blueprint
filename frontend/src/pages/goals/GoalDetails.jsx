import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function GoalDetails() {
    const navigate = useNavigate();
    const { email } = useParams();

    // ✅ decode for correct localStorage key
    const decodedEmail = decodeURIComponent(email || "");

    const goals = useMemo(() => {
        if (!decodedEmail) return [];
        return JSON.parse(localStorage.getItem(`goals:${decodedEmail}`) || "[]");
    }, [decodedEmail]);

    const totalTarget = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);
    const totalSaved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-red-200">Goal Details</h1>
                    <p className="mt-2 text-white/70">
                        User: <span className="text-white/90">{decodedEmail}</span>
                    </p>
                </div>

                <button
                    onClick={() => navigate("/admin-dashboard")}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white/90"
                >
                    Back
                </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card title="Total Goals" value={String(goals.length)} />
                <Card title="Total Target" value={`₹${totalTarget.toLocaleString("en-IN")}`} />
                <Card title="Total Saved" value={`₹${totalSaved.toLocaleString("en-IN")}`} />
            </div>

            <div className="mt-6">
                {goals.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                        No goals found for this user.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {goals.map((g, idx) => {
                            const target = Number(g.target) || 0;
                            const saved = Number(g.saved) || 0;
                            const progress =
                                target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

                            return (
                                <div
                                    key={g.createdAt ?? idx}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                                >
                                    <h3 className="text-base font-semibold">{g.title}</h3>
                                    <p className="mt-1 text-sm text-white/70">
                                        ₹{saved.toLocaleString("en-IN")} / ₹{target.toLocaleString("en-IN")}
                                    </p>

                                    <div className="mt-3 h-3 w-full rounded-full bg-white/10">
                                        <div
                                            className="h-3 rounded-full bg-green-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-white/70">Progress: {progress}%</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function Card({ title, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-white/70">{title}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
        </div>
    );
}
