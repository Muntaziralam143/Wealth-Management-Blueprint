// DashboardHome.jsx
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function DashboardHome() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "user"; // "user" | "admin"
  const token = localStorage.getItem("access_token");

  const [me, setMe] = useState(null);

  const [goals, setGoals] = useState([]);
  const [activeView, setActiveView] = useState("dashboard");
  // dashboard | goals | goalTracker | simulator | reports | profile | recommendation | calculator

  // add goal form
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");

  // edit goal
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editSaved, setEditSaved] = useState("");

  // simulator
  const [simMonthly, setSimMonthly] = useState(5000);
  const [simMonths, setSimMonths] = useState(12);
  const [simRate, setSimRate] = useState(10);

  // Goal Tracker: selected goal (by id)
  const [gtSelectedId, setGtSelectedId] = useState(null);

  // ✅ NEW: calculator (SIP/Retirement/EMI)
  const [calcTab, setCalcTab] = useState("sip"); // sip | retirement | emi

  // SIP
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipYears, setSipYears] = useState(10);
  const [sipReturn, setSipReturn] = useState(12);

  // Retirement
  const [retAgeNow, setRetAgeNow] = useState(22);
  const [retAgeAt, setRetAgeAt] = useState(60);
  const [retMonthlyNeed, setRetMonthlyNeed] = useState(40000);
  const [retInflation, setRetInflation] = useState(6);
  const [retReturn, setRetReturn] = useState(10);

  // EMI
  const [emiPrincipal, setEmiPrincipal] = useState(500000);
  const [emiRate, setEmiRate] = useState(10);
  const [emiYears, setEmiYears] = useState(5);

  // ✅ normalize email (same as admin)
  const normEmail = (e) => String(e || "").trim().toLowerCase();

  // ✅ sync backend goals -> localStorage for AdminDashboard
  const syncGoalsToLocal = (email, goalsArr) => {
    const e = normEmail(email);
    if (!e) return;

    const mapped = (Array.isArray(goalsArr) ? goalsArr : []).map((g) => ({
      title: g.title ?? "",
      target: Number(g.target_amount ?? 0),
      saved: Number(g.saved_amount ?? 0),
    }));

    localStorage.setItem(`goals:${e}`, JSON.stringify(mapped));

    // ✅ same tab refresh for AdminDashboard
    window.dispatchEvent(new Event("goals_updated"));
  };

  const apiFetch = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.detail || data.message)) ||
        `Request failed (${res.status})`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return data;
  };

  const loadMe = async () => {
    const data = await apiFetch("/api/users/me");
    setMe(data);
    if (data?.email) localStorage.setItem("currentUserEmail", data.email);

    // ✅ return user so we can pass email into loadGoals()
    return data;
  };

  // ✅ UPDATED: also sync goals to localStorage so AdminDashboard can see them
  const loadGoals = async (emailOverride) => {
    const data = await apiFetch("/api/goals");
    const list = Array.isArray(data) ? data : [];
    setGoals(list);

    const email =
      normEmail(emailOverride) ||
      normEmail(me?.email) ||
      normEmail(localStorage.getItem("currentUserEmail"));

    syncGoalsToLocal(email, list);

    return list;
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const user = await loadMe(); // ✅ get email
        await loadGoals(user?.email); // ✅ sync uses correct email
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (goals.length === 0) {
      setGtSelectedId(null);
      return;
    }
    if (!gtSelectedId) {
      setGtSelectedId(goals[0]?.id ?? null);
      return;
    }
    const exists = goals.some((g) => g.id === gtSelectedId);
    if (!exists) setGtSelectedId(goals[0]?.id ?? null);
  }, [goals, gtSelectedId]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUserEmail");
    navigate("/login");
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!title || !target) return;

    try {
      const payload = {
        title: title.trim(),
        target_amount: Number(target),
        saved_amount: Number(saved || 0),
      };

      await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTitle("");
      setTarget("");
      setSaved("");

      await loadGoals(); // ✅ will also sync to localStorage
      setActiveView("goalTracker");
    } catch (err) {
      alert(err.message || "Failed to create goal");
    }
  };

  const deleteGoal = async (goalId) => {
    try {
      await apiFetch(`/api/goals/${goalId}`, { method: "DELETE" });
      await loadGoals(); // ✅ will also sync to localStorage
    } catch (err) {
      alert(err.message || "Failed to delete goal");
    }
  };

  const startEdit = (goal) => {
    setEditingId(goal.id);
    setEditTitle(goal.title || "");
    setEditTarget(String(goal.target_amount ?? 0));
    setEditSaved(String(goal.saved_amount ?? 0));
    setActiveView("goals");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditTarget("");
    setEditSaved("");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const payload = {
        title: editTitle.trim(),
        target_amount: Number(editTarget || 0),
        saved_amount: Number(editSaved || 0),
      };

      await apiFetch(`/api/goals/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      cancelEdit();
      await loadGoals(); // ✅ will also sync to localStorage
    } catch (err) {
      alert(err.message || "Failed to update goal");
    }
  };

  const addMoney = async (goal, amount) => {
    const nextSaved = Math.max(0, Number(goal.saved_amount || 0) + amount);

    try {
      const payload = { saved_amount: nextSaved };
      await apiFetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadGoals(); // ✅ will also sync to localStorage
    } catch (err) {
      alert(err.message || "Failed to add money");
    }
  };

  const totalTarget = goals.reduce(
    (sum, g) => sum + (Number(g.target_amount) || 0),
    0
  );
  const totalSaved = goals.reduce(
    (sum, g) => sum + (Number(g.saved_amount) || 0),
    0
  );
  const remaining = Math.max(0, totalTarget - totalSaved);

  const overallProgress =
    totalTarget > 0
      ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
      : 0;

  const pieData = [
    { name: "Saved", value: totalSaved },
    { name: "Remaining", value: remaining },
  ];

  const topGoalsBar = goals
    .slice()
    .sort(
      (a, b) => (Number(b.target_amount) || 0) - (Number(a.target_amount) || 0)
    )
    .slice(0, 6)
    .map((g) => ({
      name: (g.title || "").length > 10 ? g.title.slice(0, 10) + "…" : g.title,
      saved: Number(g.saved_amount) || 0,
      target: Number(g.target_amount) || 0,
    }));

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const simResult = useMemo(() => {
    const r = Number(simRate) / 100 / 12;
    const n = Number(simMonths);
    const pmt = Number(simMonthly);

    if (!n || n <= 0) return 0;
    if (!r || r <= 0) return Math.round(pmt * n);

    const fv = pmt * ((Math.pow(1 + r, n) - 1) / r);
    return Math.round(fv);
  }, [simRate, simMonths, simMonthly]);

  const investedLine = useMemo(() => {
    const base = Math.max(1000, totalSaved || 15000);
    return Array.from({ length: 12 }).map((_, i) => {
      const t = i + 1;
      const wobble = Math.sin(t / 2) * 0.08 + Math.cos(t / 3) * 0.05;
      const v = Math.max(0, base * (0.6 + (t / 12) * 0.6) * (1 + wobble));
      return { m: `M${t}`, v: Math.round(v) };
    });
  }, [totalSaved]);

  const selectedGoal = useMemo(() => {
    if (!gtSelectedId) return null;
    return goals.find((g) => g.id === gtSelectedId) || null;
  }, [goals, gtSelectedId]);

  const selectedTarget = Number(selectedGoal?.target_amount || 0);
  const selectedSaved = Number(selectedGoal?.saved_amount || 0);
  const selectedRemain = Math.max(0, selectedTarget - selectedSaved);
  const selectedPct =
    selectedTarget > 0
      ? Math.min(100, Math.round((selectedSaved / selectedTarget) * 100))
      : 0;

  const donutSelected = useMemo(() => {
    return [
      { name: "Saved", value: selectedSaved, color: "#6D5EF6" },
      { name: "Remaining", value: selectedRemain, color: "#E9EADF" },
    ];
  }, [selectedSaved, selectedRemain]);

  const ringAllGoals = useMemo(() => {
    if (goals.length === 0) return [];
    const palette = [
      "#6D5EF6",
      "#F6A441",
      "#2CC46B",
      "#243B76",
      "#E86A92",
      "#2AA7C9",
    ];

    return goals.slice(0, 8).map((g, idx) => {
      const t = Number(g.target_amount || 0);
      const sv = Number(g.saved_amount || 0);
      const pct = t > 0 ? Math.min(100, Math.round((sv / t) * 100)) : 0;
      const weight = Math.max(3, pct);

      return {
        name: g.title || `Goal ${idx + 1}`,
        value: weight,
        pct,
        color: palette[idx % palette.length],
        id: g.id,
      };
    });
  }, [goals]);

  // ✅ NEW: SIP result + chart
  const sipResult = useMemo(() => {
    const P = Number(sipMonthly || 0);
    const r = Number(sipReturn || 0) / 100 / 12;
    const n = Number(sipYears || 0) * 12;
    if (!n || n <= 0) return 0;
    if (!r || r <= 0) return Math.round(P * n);
    const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return Math.round(fv);
  }, [sipMonthly, sipYears, sipReturn]);

  const sipInvested = Number(sipMonthly || 0) * Number(sipYears || 0) * 12;
  const sipGain = Math.max(0, sipResult - sipInvested);

  const sipLine = useMemo(() => {
    const P = Number(sipMonthly || 0);
    const r = Number(sipReturn || 0) / 100 / 12;
    const months = Math.max(1, Number(sipYears || 0) * 12);
    const points = Math.min(24, months);
    const step = Math.max(1, Math.floor(months / points));
    let total = 0;
    return Array.from({ length: points }).map((_, i) => {
      const m = (i + 1) * step;
      if (!r || r <= 0) {
        total = P * m;
      } else {
        total = P * ((Math.pow(1 + r, m) - 1) / r) * (1 + r);
      }
      return { m: `M${m}`, v: Math.round(total) };
    });
  }, [sipMonthly, sipYears, sipReturn]);

  // ✅ NEW: Retirement estimate (simple corpus)
  const retirement = useMemo(() => {
    const ageNow = Number(retAgeNow || 0);
    const ageAt = Number(retAgeAt || 0);
    const years = Math.max(0, ageAt - ageNow);

    const needNow = Number(retMonthlyNeed || 0);
    const inf = Number(retInflation || 0) / 100;
    const needAtRetirement = Math.round(needNow * Math.pow(1 + inf, years));

    // Assume you need 25 years post-retirement monthly expense (simple)
    const corpus = Math.round(needAtRetirement * 12 * 25);

    // Reverse SIP needed for that corpus
    const r = Number(retReturn || 0) / 100 / 12;
    const n = Math.max(1, years * 12);
    let monthlyReq = 0;
    if (!r || r <= 0) monthlyReq = Math.ceil(corpus / n);
    else monthlyReq = Math.ceil((corpus * r) / ((Math.pow(1 + r, n) - 1) * (1 + r)));

    return {
      years,
      needAtRetirement,
      corpus,
      monthlyReq,
    };
  }, [retAgeNow, retAgeAt, retMonthlyNeed, retInflation, retReturn]);

  // ✅ NEW: EMI
  const emi = useMemo(() => {
    const P = Number(emiPrincipal || 0);
    const r = Number(emiRate || 0) / 100 / 12;
    const n = Number(emiYears || 0) * 12;
    if (!P || P <= 0 || !n || n <= 0) return { emi: 0, totalPay: 0, interest: 0 };
    let E = 0;
    if (!r || r <= 0) E = P / n;
    else E = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = Math.round(E * n);
    const interest = Math.max(0, totalPay - P);
    return { emi: Math.round(E), totalPay, interest };
  }, [emiPrincipal, emiRate, emiYears]);

  // ✅ NEW: Recommendation engine (simple, based on goals + progress)
  const recommendations = useMemo(() => {
    const list = [];

    if (goals.length === 0) {
      list.push({
        title: "Start with 1 goal",
        desc: "Add an Emergency Fund goal first (₹25k–₹1L). It helps you handle surprises without debt.",
        tag: "Beginner",
      });
      list.push({
        title: "Track monthly savings",
        desc: "Try saving a fixed amount every month. Use the SIP calculator to estimate growth.",
        tag: "Habit",
      });
      return list;
    }

    // lowest progress
    const sorted = goals
      .slice()
      .map((g) => {
        const t = Number(g.target_amount || 0);
        const s = Number(g.saved_amount || 0);
        const pct = t > 0 ? Math.round((s / t) * 100) : 0;
        return { ...g, _pct: Math.min(100, Math.max(0, pct)) };
      })
      .sort((a, b) => a._pct - b._pct);

    const low = sorted[0];
    const high = sorted[sorted.length - 1];

    if (low) {
      const need = Math.max(0, Number(low.target_amount || 0) - Number(low.saved_amount || 0));
      list.push({
        title: `Boost “${low.title}”`,
        desc: `This is your lowest progress goal. Remaining is ${fmtINR(need)}. Try a small weekly add like ₹500 or ₹1000.`,
        tag: "Priority",
      });
    }

    if (high && high._pct >= 80) {
      list.push({
        title: `Finish “${high.title}” soon`,
        desc: `You’re at ${high._pct}% — consider one final push to complete it and then start a new goal.`,
        tag: "Almost done",
      });
    }

    if (overallProgress < 30) {
      list.push({
        title: "Set a monthly savings rule",
        desc: `Overall progress is ${overallProgress}%. A fixed monthly SIP can improve consistency.`,
        tag: "Plan",
      });
    } else {
      list.push({
        title: "Diversify goals",
        desc: "Try balancing short-term and long-term goals (Emergency + Big purchase + Retirement).",
        tag: "Strategy",
      });
    }

    // quick finance hygiene
    list.push({
      title: "Avoid high-interest debt",
      desc: "Use the EMI calculator before taking loans. Keep EMI manageable vs income.",
      tag: "Safety",
    });

    return list.slice(0, 6);
  }, [goals, overallProgress]);

  const currentUserEmail =
    me?.email || localStorage.getItem("currentUserEmail") || "user";

  return (
    <div className="min-h-screen w-full bg-[#eef1ef]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-5 lg:grid-cols-12">
          {/* ============ SIDEBAR ============ */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-8">
              <div className="rounded-[28px] bg-[#f7f8f6] shadow-md border border-[#e6e6e6] p-4">
                <div className="px-2 pt-2">
                  <p className="text-xs tracking-widest text-slate-400 font-bold">
                    WEALTHTRACK
                  </p>
                </div>

                <nav className="mt-4 flex flex-col gap-1">
                  <SidebarItem
                    active={activeView === "dashboard"}
                    icon={<GridIcon className="h-5 w-5" />}
                    label="Dashboard"
                    onClick={() => setActiveView("dashboard")}
                  />
                  <SidebarItem
                    active={activeView === "goals"}
                    icon={<TargetIcon className="h-5 w-5" />}
                    label="Goals"
                    onClick={() => setActiveView("goals")}
                  />
                  <SidebarItem
                    active={activeView === "goalTracker"}
                    icon={<PulseIcon className="h-5 w-5" />}
                    label="Goal Tracker"
                    onClick={() => setActiveView("goalTracker")}
                    highlight
                  />
                  <SidebarItem
                    active={false}
                    icon={<PieIcon className="h-5 w-5" />}
                    label="Portfolio"
                    onClick={() => navigate("/portfolio")}
                  />

                  {/* ✅ NEW: Recommendation */}
                  <SidebarItem
                    active={activeView === "recommendation"}
                    icon={<SparkIcon className="h-5 w-5" />}
                    label="Recommendation"
                    onClick={() => setActiveView("recommendation")}
                  />

                  {/* ✅ NEW: Calculator */}
                  <SidebarItem
                    active={activeView === "calculator"}
                    icon={<CalcIcon className="h-5 w-5" />}
                    label="Calculator"
                    onClick={() => setActiveView("calculator")}
                  />

                  <SidebarItem
                    active={activeView === "simulator"}
                    icon={<ClockIcon className="h-5 w-5" />}
                    label="Simulations"
                    onClick={() => setActiveView("simulator")}
                  />
                  <SidebarItem
                    active={activeView === "reports"}
                    icon={<ReportIcon className="h-5 w-5" />}
                    label="Reports"
                    onClick={() => setActiveView("reports")}
                  />

                  <div className="my-2 border-t border-[#e6e6e6]" />

                  <SidebarItem
                    active={activeView === "profile"}
                    icon={<UserIcon className="h-5 w-5" />}
                    label="Profile"
                    onClick={() => setActiveView("profile")}
                  />

                  {role === "admin" && (
                    <SidebarItem
                      active={false}
                      icon={<ShieldIcon className="h-5 w-5" />}
                      label="Admin"
                      onClick={() => navigate("/admin-dashboard")}
                    />
                  )}
                </nav>

                <div className="mt-4 rounded-2xl bg-white border border-[#ececec] p-3">
                  <p className="text-xs text-slate-500">Signed in as</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 break-all">
                    {currentUserEmail}
                  </p>

                  <button
                    onClick={logout}
                    className="mt-3 w-full rounded-xl bg-[#f1f2ef] px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[#e9eadf] transition border border-[#e6e6e6]"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* ============ MAIN ============ */}
          <main className="lg:col-span-9">
            {/* ============ TOP BAR ============ */}
            <div className="rounded-[34px] bg-[#f4b23b] text-[#3b2f13] shadow-md border border-[#e7aa2f] overflow-hidden">
              <div className="px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm opacity-90">
                      Good Morning,{" "}
                      <span className="font-bold">
                        {me?.name || currentUserEmail.split("@")[0] || "User"}
                      </span>
                    </p>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {activeView === "dashboard" && "Dashboard"}
                      {activeView === "goals" && "Goals"}
                      {activeView === "goalTracker" && "Goal Tracker"}
                      {activeView === "recommendation" && "Recommendation"}
                      {activeView === "calculator" && "Calculator"}
                      {activeView === "simulator" && "Simulations"}
                      {activeView === "reports" && "Reports"}
                      {activeView === "profile" && "Profile"}
                    </h1>
                    <p className="mt-1 text-sm opacity-90">
                      Overall goal progress:{" "}
                      <span className="font-bold">{overallProgress}%</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveView("goals")}
                      className="rounded-full bg-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition border border-white/30"
                    >
                      Manage Goals
                    </button>
                    <button
                      onClick={() => loadGoals()}
                      className="rounded-full bg-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/30 transition border border-white/30"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 px-6 pb-6 sm:px-8">
                <MiniCard
                  title="Your Wallet"
                  value={fmtINR(totalSaved)}
                  sub="Total saved"
                  icon={<WalletIcon className="h-5 w-5" />}
                />
                <MiniCard
                  title="Remaining"
                  value={fmtINR(remaining)}
                  sub="To reach targets"
                  icon={<FlagIcon className="h-5 w-5" />}
                />
                <MiniCard
                  title="Active Goals"
                  value={String(goals.length)}
                  sub="Goals you track"
                  icon={<LayersIcon className="h-5 w-5" />}
                />
              </div>
            </div>

            {/* ================= DASHBOARD VIEW (UNCHANGED) ================= */}
            {activeView === "dashboard" && (
              <>
                <div className="mt-5 grid gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-4 grid gap-5">
                    <SoftCard>
                      <p className="text-xs font-bold text-slate-500">
                        Goal Summary
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Total Target:{" "}
                        <span className="font-semibold">
                          {fmtINR(totalTarget)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        Total Saved:{" "}
                        <span className="font-semibold">
                          {fmtINR(totalSaved)}
                        </span>
                      </p>

                      <div className="mt-4">
                        <div className="h-2.5 w-full rounded-full bg-[#e9eadf]">
                          <div
                            className="h-2.5 rounded-full bg-[#f4b23b]"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span className="font-bold text-slate-700">
                            {overallProgress}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveView("goalTracker")}
                        className="mt-4 w-full rounded-xl bg-[#f1f2ef] px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-[#e9eadf] transition border border-[#e6e6e6]"
                      >
                        Open Goal Tracker UI
                      </button>
                    </SoftCard>

                    <SoftCard>
                      <p className="text-xs font-bold text-slate-500">
                        Quick Add Funds
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Add money to your goals faster.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <PillBtn
                          onClick={() => goals[0] && addMoney(goals[0], 500)}
                          disabled={goals.length === 0}
                        >
                          +₹500
                        </PillBtn>
                        <PillBtn
                          onClick={() => goals[0] && addMoney(goals[0], 1000)}
                          disabled={goals.length === 0}
                        >
                          +₹1000
                        </PillBtn>
                        <PillBtn
                          onClick={() => goals[0] && addMoney(goals[0], 5000)}
                          disabled={goals.length === 0}
                        >
                          +₹5000
                        </PillBtn>
                      </div>
                      {goals.length === 0 && (
                        <p className="mt-3 text-xs text-slate-500">
                          Add a goal first to use quick add.
                        </p>
                      )}
                    </SoftCard>
                  </div>

                  <div className="lg:col-span-8">
                    <SoftCard>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-500">
                            Invested Value
                          </p>
                          <p className="mt-1 text-lg font-extrabold text-slate-800">
                            {fmtINR(totalSaved)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-3 py-1 text-xs font-semibold text-slate-700">
                          This year
                        </span>
                      </div>

                      <div className="mt-4 h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={investedLine}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(v) => fmtINR(v)} />
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke="#f4b23b"
                              strokeWidth={3}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </SoftCard>

                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <SoftCard>
                        <p className="text-xs font-bold text-slate-500">
                          Saved vs Remaining
                        </p>
                        <div className="mt-3 h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={48}
                                outerRadius={70}
                                paddingAngle={2}
                              >
                                <Cell fill="#f4b23b" />
                                <Cell fill="#e9eadf" />
                              </Pie>
                              <Tooltip formatter={(v) => fmtINR(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </SoftCard>

                      <SoftCard>
                        <p className="text-xs font-bold text-slate-500">
                          Top Goals
                        </p>
                        <div className="mt-3 h-44">
                          {topGoalsBar.length === 0 ? (
                            <div className="h-full rounded-2xl bg-white border border-[#ececec] flex items-center justify-center text-slate-600 text-sm">
                              Add goals to see chart
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topGoalsBar}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v, n) => [fmtINR(v), n]} />
                                <Bar
                                  dataKey="target"
                                  fill="#e9eadf"
                                  radius={[10, 10, 0, 0]}
                                />
                                <Bar
                                  dataKey="saved"
                                  fill="#f4b23b"
                                  radius={[10, 10, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================= RECOMMENDATION VIEW ================= */}
            {activeView === "recommendation" && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <SoftCard className="md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        SMART RECOMMENDATIONS
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold text-slate-800">
                        Personalized tips for you
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Based on your goals and current progress (simple rules).
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveView("calculator")}
                      className="rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#e9eadf] transition"
                    >
                      Open Calculator
                    </button>
                  </div>
                </SoftCard>

                {recommendations.map((r, idx) => (
                  <SoftCard key={idx}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-slate-800">
                          {r.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{r.desc}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white border border-[#ececec] px-3 py-1 text-xs font-bold text-slate-700">
                        {r.tag}
                      </span>
                    </div>

                    {goals.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-white border border-[#ececec] p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Your snapshot
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          <MiniStat label="Goals" value={String(goals.length)} />
                          <MiniStat label="Saved" value={fmtINR(totalSaved)} />
                          <MiniStat label="Progress" value={`${overallProgress}%`} />
                        </div>
                      </div>
                    )}
                  </SoftCard>
                ))}
              </div>
            )}

            {/* ================= CALCULATOR VIEW (SIP/Retirement/EMI) ================= */}
            {activeView === "calculator" && (
              <div className="mt-5 grid gap-5">
                <SoftCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        FINANCE CALCULATOR
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold text-slate-800">
                        SIP • Retirement • EMI
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Quick estimates (not financial advice).
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <TabBtn active={calcTab === "sip"} onClick={() => setCalcTab("sip")}>
                        SIP
                      </TabBtn>
                      <TabBtn
                        active={calcTab === "retirement"}
                        onClick={() => setCalcTab("retirement")}
                      >
                        Retirement
                      </TabBtn>
                      <TabBtn active={calcTab === "emi"} onClick={() => setCalcTab("emi")}>
                        EMI
                      </TabBtn>
                    </div>
                  </div>
                </SoftCard>

                {/* SIP */}
                {calcTab === "sip" && (
                  <div className="grid gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <SoftCard>
                        <h3 className="text-lg font-extrabold text-slate-800">
                          SIP Calculator
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Estimate how much your monthly SIP can grow.
                        </p>

                        <div className="mt-5 grid gap-4">
                          <Field label="Monthly Investment (₹)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              value={sipMonthly}
                              onChange={(e) => setSipMonthly(Number(e.target.value || 0))}
                            />
                          </Field>

                          <Field label="Time (Years)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="1"
                              value={sipYears}
                              onChange={(e) => setSipYears(Number(e.target.value || 1))}
                            />
                          </Field>

                          <Field label="Expected Return (% per year)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              step="0.1"
                              value={sipReturn}
                              onChange={(e) => setSipReturn(Number(e.target.value || 0))}
                            />
                          </Field>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <MiniStat label="Invested" value={fmtINR(sipInvested)} />
                          <MiniStat label="Est. Gain" value={fmtINR(sipGain)} />
                          <MiniStat label="Future Value" value={fmtINR(sipResult)} />
                        </div>

                        <div className="mt-4 rounded-2xl bg-white border border-[#ececec] p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Tip
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            If you want, you can match SIP monthly amount with your goal remaining.
                          </p>
                        </div>
                      </SoftCard>
                    </div>

                    <div className="lg:col-span-7">
                      <SoftCard>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500">
                              SIP Growth
                            </p>
                            <p className="mt-1 text-lg font-extrabold text-slate-800">
                              {fmtINR(sipResult)}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-3 py-1 text-xs font-semibold text-slate-700">
                            Estimate
                          </span>
                        </div>

                        <div className="mt-4 h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sipLine}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip formatter={(v) => fmtINR(v)} />
                              <Line
                                type="monotone"
                                dataKey="v"
                                stroke="#f4b23b"
                                strokeWidth={3}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-3xl bg-white border border-[#ececec] p-5">
                            <p className="text-xs font-bold text-slate-500">
                              Suggested action
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              Increase SIP gradually when income increases.
                            </p>
                          </div>
                          <div className="rounded-3xl bg-white border border-[#ececec] p-5">
                            <p className="text-xs font-bold text-slate-500">
                              Note
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              Returns vary. This is only a simple projection.
                            </p>
                          </div>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                )}

                {/* Retirement */}
                {calcTab === "retirement" && (
                  <div className="grid gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                      <SoftCard>
                        <h3 className="text-lg font-extrabold text-slate-800">
                          Retirement Calculator
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Estimate your retirement monthly need and corpus.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <Field label="Your age (now)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              value={retAgeNow}
                              onChange={(e) => setRetAgeNow(Number(e.target.value || 0))}
                            />
                          </Field>

                          <Field label="Retirement age">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              value={retAgeAt}
                              onChange={(e) => setRetAgeAt(Number(e.target.value || 0))}
                            />
                          </Field>

                          <Field label="Monthly expense needed today (₹)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              value={retMonthlyNeed}
                              onChange={(e) =>
                                setRetMonthlyNeed(Number(e.target.value || 0))
                              }
                            />
                          </Field>

                          <Field label="Inflation (% per year)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              step="0.1"
                              value={retInflation}
                              onChange={(e) =>
                                setRetInflation(Number(e.target.value || 0))
                              }
                            />
                          </Field>

                          <Field label="Expected return (% per year)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              step="0.1"
                              value={retReturn}
                              onChange={(e) => setRetReturn(Number(e.target.value || 0))}
                            />
                          </Field>
                        </div>

                        <div className="mt-6 rounded-3xl bg-white border border-[#ececec] p-6">
                          <p className="text-xs font-bold text-slate-500">
                            Result
                          </p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <MiniStat
                              label="Years to retire"
                              value={String(retirement.years)}
                            />
                            <MiniStat
                              label="Monthly need at retirement"
                              value={fmtINR(retirement.needAtRetirement)}
                            />
                            <MiniStat
                              label="Estimated corpus"
                              value={fmtINR(retirement.corpus)}
                            />
                            <MiniStat
                              label="Monthly SIP needed"
                              value={fmtINR(retirement.monthlyReq)}
                            />
                          </div>

                          <p className="mt-3 text-xs text-slate-500">
                            Corpus assumes 25 years post-retirement expenses (simple).
                          </p>
                        </div>
                      </SoftCard>
                    </div>

                    <div className="lg:col-span-6">
                      <SoftCard>
                        <h3 className="text-lg font-extrabold text-slate-800">
                          Actions you can take
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Simple suggestions to improve readiness.
                        </p>

                        <div className="mt-5 grid gap-4">
                          <ActionCard
                            title="Increase savings rate"
                            desc="Try increasing your SIP when salary increases (even 5–10%)."
                          />
                          <ActionCard
                            title="Reduce debt before retirement"
                            desc="High EMIs reduce investment capacity. Use EMI calculator first."
                          />
                          <ActionCard
                            title="Keep an emergency fund"
                            desc="At least 3–6 months expenses so you don’t break long-term investments."
                          />
                        </div>

                        <div className="mt-6 rounded-3xl bg-white border border-[#ececec] p-6">
                          <p className="text-xs font-bold text-slate-500">
                            Quick link
                          </p>
                          <button
                            onClick={() => setCalcTab("sip")}
                            className="mt-2 w-full rounded-2xl bg-[#f4b23b] px-5 py-3 text-sm font-semibold text-[#3b2f13] shadow-sm hover:brightness-95 transition border border-[#e7aa2f]"
                          >
                            Try SIP Calculator
                          </button>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                )}

                {/* EMI */}
                {calcTab === "emi" && (
                  <div className="grid gap-5 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <SoftCard>
                        <h3 className="text-lg font-extrabold text-slate-800">
                          EMI Calculator
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Estimate monthly EMI for a loan.
                        </p>

                        <div className="mt-5 grid gap-4">
                          <Field label="Loan Amount / Principal (₹)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              value={emiPrincipal}
                              onChange={(e) =>
                                setEmiPrincipal(Number(e.target.value || 0))
                              }
                            />
                          </Field>

                          <Field label="Interest Rate (% per year)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="0"
                              step="0.1"
                              value={emiRate}
                              onChange={(e) => setEmiRate(Number(e.target.value || 0))}
                            />
                          </Field>

                          <Field label="Tenure (years)">
                            <input
                              className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                              type="number"
                              min="1"
                              value={emiYears}
                              onChange={(e) => setEmiYears(Number(e.target.value || 1))}
                            />
                          </Field>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <MiniStat label="Monthly EMI" value={fmtINR(emi.emi)} />
                          <MiniStat label="Total Pay" value={fmtINR(emi.totalPay)} />
                          <MiniStat label="Interest" value={fmtINR(emi.interest)} />
                        </div>

                        <div className="mt-4 rounded-2xl bg-white border border-[#ececec] p-4">
                          <p className="text-xs font-bold text-slate-500">
                            Tip
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Keep EMI low so you can still invest in goals.
                          </p>
                        </div>
                      </SoftCard>
                    </div>

                    <div className="lg:col-span-7">
                      <SoftCard>
                        <p className="text-xs font-bold text-slate-500">EMI Breakdown</p>

                        <div className="mt-4 h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Principal", value: Number(emiPrincipal || 0) },
                                  { name: "Interest", value: Number(emi.interest || 0) },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={2}
                              >
                                <Cell fill="#f4b23b" />
                                <Cell fill="#e9eadf" />
                              </Pie>
                              <Tooltip formatter={(v) => fmtINR(v)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <ActionCard
                            title="Compare tenure"
                            desc="Longer tenure reduces EMI but increases total interest."
                          />
                          <ActionCard
                            title="Prepayment"
                            desc="Even small prepayments can reduce total interest a lot."
                          />
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= GOAL TRACKER VIEW (UNCHANGED) ================= */}
            {activeView === "goalTracker" && (
              <div className="mt-5 grid gap-5 lg:grid-cols-12">
                {/* Left */}
                <div className="lg:col-span-5">
                  <div className="rounded-[28px] overflow-hidden shadow-md border border-[#e6e6e6] bg-white">
                    <div className="relative min-h-[520px] bg-[#f7f8f6]">
                      <div className="absolute inset-y-0 left-0 w-[55%] bg-[#6D5EF6]" />

                      <div className="relative h-full flex flex-col items-center justify-start px-6 py-8">
                        <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg border border-[#ececec] p-4 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold tracking-widest text-slate-400">
                              SELECTED GOAL
                            </p>
                            <p className="mt-1 text-lg font-extrabold text-slate-800 truncate">
                              {selectedGoal?.title || "No goal"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Saved:{" "}
                              <span className="font-semibold">
                                {fmtINR(selectedSaved)}
                              </span>{" "}
                              / Target:{" "}
                              <span className="font-semibold">
                                {fmtINR(selectedTarget)}
                              </span>
                            </p>
                          </div>

                          <div className="h-10 w-14 rounded-xl bg-[#2b2b2b] text-white flex items-center justify-center text-xs font-bold shadow">
                            G
                          </div>
                        </div>

                        <div className="mt-8 relative w-full max-w-[240px]">
                          <div className="relative aspect-square">
                            <div className="absolute inset-0 rounded-full bg-white shadow-lg border border-[#ececec]" />

                            <div className="absolute inset-[26%] rounded-full bg-white border border-[#f0f0f0] flex items-center justify-center text-center p-3 z-10">
                              <div>
                                <p className="text-[10px] font-extrabold tracking-widest text-slate-400">
                                  PROGRESS
                                </p>
                                <p className="mt-2 text-3xl font-extrabold text-slate-800">
                                  {selectedPct}%
                                </p>
                                <p className="mt-2 text-[11px] text-slate-500">
                                  Remain: {fmtINR(selectedRemain)}
                                </p>
                              </div>
                            </div>

                            <div className="absolute inset-0">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={donutSelected}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="70%"
                                    outerRadius="88%"
                                    startAngle={90}
                                    endAngle={-270}
                                    paddingAngle={2}
                                  >
                                    {donutSelected.map((seg) => (
                                      <Cell key={seg.name} fill={seg.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(v, n) => [fmtINR(v), n]} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="absolute -right-2 top-[28%] h-2.5 w-2.5 rounded-full bg-[#6D5EF6]" />
                            <div className="absolute left-[10%] bottom-[18%] h-2.5 w-2.5 rounded-full bg-[#2CC46B]" />
                          </div>
                        </div>

                        <div className="mt-8 w-full max-w-sm">
                          <p className="text-xs font-bold text-white/90 mb-3">
                            Pick a goal to view details
                          </p>

                          {goals.length === 0 ? (
                            <div className="rounded-2xl bg-white/90 border border-white/60 p-4 text-sm text-slate-700">
                              No goals yet. Go to{" "}
                              <span className="font-semibold">Goals</span> and
                              add one.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {goals.map((g) => {
                                const t = Number(g.target_amount || 0);
                                const sv = Number(g.saved_amount || 0);
                                const pct =
                                  t > 0
                                    ? Math.min(100, Math.round((sv / t) * 100))
                                    : 0;
                                const active = g.id === gtSelectedId;

                                return (
                                  <button
                                    key={g.id}
                                    onClick={() => setGtSelectedId(g.id)}
                                    className={[
                                      "rounded-2xl p-3 text-left border transition shadow-sm",
                                      active
                                        ? "bg-white border-[#efd79a] ring-2 ring-white/60"
                                        : "bg-white/90 border-white/60 hover:bg-white",
                                    ].join(" ")}
                                  >
                                    <p className="text-xs font-extrabold text-slate-700 truncate">
                                      {g.title}
                                    </p>
                                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                                      {pct}%
                                    </p>
                                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#e9eadf] overflow-hidden">
                                      <div
                                        className="h-1.5 bg-[#6D5EF6]"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <p className="mt-4 text-xs text-slate-200/90 text-center">
                          Donut shows Saved vs Remaining for the selected goal.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="lg:col-span-7">
                  <SoftCard>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          GOAL DETAILS
                        </p>
                        <h2 className="mt-1 text-2xl font-extrabold text-slate-800">
                          {selectedGoal?.title || "No goal selected"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Track progress, add savings quickly, and stay
                          consistent.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveView("goals")}
                          className="rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#e9eadf] transition"
                        >
                          Edit Goals
                        </button>
                        <button
                          onClick={() => setActiveView("dashboard")}
                          className="rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-[#e9eadf] transition"
                        >
                          Back
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <StatTile title="Target" value={fmtINR(selectedTarget)} />
                      <StatTile title="Saved" value={fmtINR(selectedSaved)} />
                      <StatTile title="Remaining" value={fmtINR(selectedRemain)} />
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-slate-700">
                        Progress
                      </p>
                      <div className="mt-2 h-3 w-full rounded-full bg-[#e9eadf]">
                        <div
                          className="h-3 rounded-full bg-[#6D5EF6]"
                          style={{ width: `${selectedPct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {selectedPct}% completed
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <PillBtn
                        onClick={() => selectedGoal && addMoney(selectedGoal, 500)}
                        disabled={!selectedGoal}
                      >
                        +₹500
                      </PillBtn>
                      <PillBtn
                        onClick={() => selectedGoal && addMoney(selectedGoal, 1000)}
                        disabled={!selectedGoal}
                      >
                        +₹1000
                      </PillBtn>
                      <PillBtn
                        onClick={() => selectedGoal && addMoney(selectedGoal, 5000)}
                        disabled={!selectedGoal}
                      >
                        +₹5000
                      </PillBtn>

                      <button
                        onClick={() => selectedGoal && startEdit(selectedGoal)}
                        className="ml-auto rounded-full bg-[#f1f2ef] border border-[#e6e6e6] px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#e9eadf] transition"
                        disabled={!selectedGoal}
                      >
                        Edit
                      </button>
                    </div>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="rounded-3xl bg-white border border-[#ececec] p-5">
                        <p className="text-sm font-extrabold text-slate-800">
                          Goal Progress Ring
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Slice size increases with progress (higher % = bigger slice).
                        </p>

                        <div className="mt-4 w-full max-w-[200px] mx-auto">
                          <div className="relative aspect-square">
                            {ringAllGoals.length === 0 ? (
                              <div className="absolute inset-0 rounded-2xl bg-[#f7f8f6] border border-[#ececec] flex items-center justify-center text-slate-600 text-sm">
                                Add goals to see ring
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={ringAllGoals}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius="72%"
                                    outerRadius="90%"
                                    paddingAngle={1}
                                    startAngle={90}
                                    endAngle={-270}
                                  >
                                    {ringAllGoals.map((seg) => (
                                      <Cell key={seg.id} fill={seg.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    formatter={(v, n, p) => {
                                      const pct = p?.payload?.pct ?? 0;
                                      return [`${pct}%`, n];
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-white border border-[#ececec] p-5">
                        <p className="text-sm font-extrabold text-slate-800">
                          All Goals
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Click a goal to show it in the donut.
                        </p>

                        <div className="mt-4 space-y-3">
                          {goals.length === 0 ? (
                            <div className="rounded-2xl bg-[#f7f8f6] border border-[#ececec] p-4 text-slate-600 text-sm">
                              No goals yet.
                            </div>
                          ) : (
                            goals.slice(0, 10).map((g) => {
                              const t = Number(g.target_amount || 0);
                              const sv = Number(g.saved_amount || 0);
                              const pct =
                                t > 0 ? Math.min(100, Math.round((sv / t) * 100)) : 0;
                              const active = g.id === gtSelectedId;

                              return (
                                <button
                                  key={g.id}
                                  onClick={() => setGtSelectedId(g.id)}
                                  className={[
                                    "w-full text-left rounded-2xl border p-4 transition",
                                    active
                                      ? "bg-[#f8e7bf] border-[#efd79a]"
                                      : "bg-[#f7f8f6] border-[#ececec] hover:bg-white",
                                  ].join(" ")}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-extrabold text-slate-800 truncate">
                                        {g.title}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {fmtINR(sv)} / {fmtINR(t)}
                                      </p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-800">
                                      {pct}%
                                    </span>
                                  </div>

                                  <div className="mt-3 h-2 w-full rounded-full bg-[#e9eadf]">
                                    <div
                                      className="h-2 rounded-full bg-[#6D5EF6]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </SoftCard>
                </div>
              </div>
            )}

            {/* ================= GOALS VIEW (UNCHANGED) ================= */}
            {activeView === "goals" && (
              <>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <SoftCard>
                    <p className="text-xs font-bold text-slate-500">Active Goals</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-800">
                      {goals.length}
                    </p>
                  </SoftCard>
                  <SoftCard>
                    <p className="text-xs font-bold text-slate-500">Total Target</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-800">
                      {fmtINR(totalTarget)}
                    </p>
                  </SoftCard>
                  <SoftCard>
                    <p className="text-xs font-bold text-slate-500">Total Saved</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-800">
                      {fmtINR(totalSaved)}
                    </p>
                  </SoftCard>
                </div>

                <SoftCard className="mt-5">
                  <h2 className="text-lg font-extrabold text-slate-800">
                    Add New Goal
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Example: “Buy Laptop”, “Emergency Fund”, “New Bike”
                  </p>

                  <form onSubmit={addGoal} className="mt-4 grid gap-4 md:grid-cols-3">
                    <Field label="Goal Name">
                      <input
                        className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Emergency Fund"
                      />
                    </Field>

                    <Field label="Target Amount (₹)">
                      <input
                        className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="e.g., 50000"
                        type="number"
                        min="0"
                      />
                    </Field>

                    <Field label="Already Saved (₹)">
                      <input
                        className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                        value={saved}
                        onChange={(e) => setSaved(e.target.value)}
                        placeholder="e.g., 10000"
                        type="number"
                        min="0"
                      />
                    </Field>

                    <button className="md:col-span-3 w-full rounded-2xl bg-[#f4b23b] px-5 py-3 text-sm font-semibold text-[#3b2f13] shadow-sm hover:brightness-95 transition border border-[#e7aa2f]">
                      Add Goal
                    </button>
                  </form>
                </SoftCard>

                {editingId !== null && (
                  <SoftCard className="mt-5">
                    <h2 className="text-lg font-extrabold text-slate-800">Edit Goal</h2>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <Field label="Goal Name">
                        <input
                          className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </Field>

                      <Field label="Target Amount (₹)">
                        <input
                          className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          type="number"
                          min="0"
                        />
                      </Field>

                      <Field label="Saved Amount (₹)">
                        <input
                          className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                          value={editSaved}
                          onChange={(e) => setEditSaved(e.target.value)}
                          type="number"
                          min="0"
                        />
                      </Field>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={saveEdit}
                        className="rounded-full bg-[#f4b23b] px-5 py-2.5 text-sm font-semibold text-[#3b2f13] hover:brightness-95 transition border border-[#e7aa2f]"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-full border border-[#e6e6e6] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-[#f1f2ef] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </SoftCard>
                )}

                <div className="mt-5">
                  <h2 className="text-lg font-extrabold text-slate-800">Your Goals</h2>

                  {goals.length === 0 ? (
                    <p className="mt-3 text-slate-600">
                      No goals yet. Add your first goal above.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      {goals.map((g) => {
                        const targetNum = Number(g.target_amount) || 0;
                        const savedNum = Number(g.saved_amount) || 0;
                        const progress =
                          targetNum > 0
                            ? Math.min(
                                100,
                                Math.round((savedNum / targetNum) * 100)
                              )
                            : 0;

                        return (
                          <SoftCard key={g.id}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-base font-extrabold text-slate-800">
                                  {g.title}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                  {fmtINR(savedNum)}{" "}
                                  <span className="text-slate-400">/</span>{" "}
                                  {fmtINR(targetNum)}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(g)}
                                  className="rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#f1f2ef] transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteGoal(g.id)}
                                  className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="h-3 w-full rounded-full bg-[#e9eadf]">
                                <div
                                  className="h-3 rounded-full bg-[#f4b23b]"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-sm">
                                <span className="text-slate-600">Progress</span>
                                <span className="font-semibold text-slate-800">
                                  {progress}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <PillBtn onClick={() => addMoney(g, 500)}>+₹500</PillBtn>
                              <PillBtn onClick={() => addMoney(g, 1000)}>
                                +₹1000
                              </PillBtn>
                              <PillBtn onClick={() => addMoney(g, 5000)}>
                                +₹5000
                              </PillBtn>
                            </div>
                          </SoftCard>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ================= SIMULATOR VIEW (UNCHANGED) ================= */}
            {activeView === "simulator" && (
              <SoftCard className="mt-5">
                <h2 className="text-lg font-extrabold text-slate-800">
                  Savings Simulator
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Estimate how much you can build by investing monthly with annual
                  returns.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <Field label="Monthly Investment (₹)">
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                      type="number"
                      min="0"
                      value={simMonthly}
                      onChange={(e) => setSimMonthly(Number(e.target.value || 0))}
                    />
                  </Field>

                  <Field label="Duration (months)">
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                      type="number"
                      min="1"
                      value={simMonths}
                      onChange={(e) => setSimMonths(Number(e.target.value || 1))}
                    />
                  </Field>

                  <Field label="Expected Return (% per year)">
                    <input
                      className="mt-1 w-full rounded-2xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#f4b23b]"
                      type="number"
                      min="0"
                      step="0.1"
                      value={simRate}
                      onChange={(e) => setSimRate(Number(e.target.value || 0))}
                    />
                  </Field>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-white border border-[#ececec] p-6">
                    <p className="text-sm text-slate-600">Estimated Future Value</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-800">
                      {fmtINR(simResult)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      (This is a simple estimate, not financial advice.)
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white border border-[#ececec] p-6">
                    <p className="text-sm font-bold text-slate-800">Tip</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Later we can connect simulator with goals to calculate monthly
                      amount needed.
                    </p>
                  </div>
                </div>
              </SoftCard>
            )}

            {activeView === "reports" && (
              <SoftCard className="mt-5">
                <h2 className="text-lg font-extrabold text-slate-800">Reports</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Coming soon: monthly spending summary, goal progress reports, and
                  export (PDF/CSV).
                </p>
              </SoftCard>
            )}

            {activeView === "profile" && (
              <SoftCard className="mt-5">
                <h2 className="text-lg font-extrabold text-slate-800">Profile</h2>
                <p className="mt-2 text-sm text-slate-600">
                  User:{" "}
                  <span className="font-semibold text-slate-800">
                    {currentUserEmail}
                  </span>
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white border border-[#ececec] p-4">
                    <p className="text-xs font-semibold text-slate-500">Role</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {role || "user"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-[#ececec] p-4">
                    <p className="text-xs font-semibold text-slate-500">Account</p>
                    <p className="mt-1 font-extrabold text-slate-800">Active</p>
                  </div>
                </div>
              </SoftCard>
            )}

            <div className="mt-10 pb-6 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} WealthTrack • Dashboard
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ===================== UI PARTS ===================== */

function SidebarItem({ icon, label, active, onClick, highlight = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition",
        active
          ? highlight
            ? "bg-[#f3d07a] text-[#3b2f13] shadow-sm border border-[#efd79a]"
            : "bg-white text-slate-800 shadow-sm border border-[#ececec]"
          : "text-slate-600 hover:bg-[#f1f2ef]",
      ].join(" ")}
    >
      <span className="text-slate-600">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      {active && <span className="ml-auto h-4 w-1.5 rounded-full bg-[#d6a84a]" />}
    </button>
  );
}

function SoftCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[28px] bg-[#f7f8f6] shadow-md border border-[#e6e6e6] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function MiniCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-3xl bg-white/25 border border-white/30 p-4">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-2xl bg-white/25 border border-white/30 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-xs opacity-90">{title}</p>
      </div>
      <p className="mt-2 text-xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs opacity-85">{sub}</p>
    </div>
  );
}

function StatTile({ title, value }) {
  return (
    <div className="rounded-2xl bg-white border border-[#ececec] p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-[#ececec] p-4">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

function ActionCard({ title, desc }) {
  return (
    <div className="rounded-3xl bg-white border border-[#ececec] p-5">
      <p className="text-sm font-extrabold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function PillBtn({ children, onClick, disabled = false }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-xs font-semibold transition border",
        disabled
          ? "bg-white/60 text-slate-400 border-[#ececec] cursor-not-allowed"
          : "bg-white text-slate-700 border-[#e6e6e6] hover:bg-[#f1f2ef]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function TabBtn({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold border transition",
        active
          ? "bg-[#f3d07a] text-[#3b2f13] border-[#efd79a]"
          : "bg-white text-slate-700 border-[#e6e6e6] hover:bg-[#f1f2ef]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ===================== ICONS ===================== */

function IconBase({ className = "", children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function GridIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

function TargetIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8v4l2 2" />
    </IconBase>
  );
}

function PulseIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 12h4l2-6 4 12 2-6h4" />
      <path d="M21 12h-2" />
    </IconBase>
  );
}

function PieIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3v9h9" />
      <path d="M21 12a9 9 0 1 1-9-9" />
    </IconBase>
  );
}

function ClockIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

function ReportIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v3h3" />
      <path d="M8 12h8" />
      <path d="M8 16h8" />
    </IconBase>
  );
}

function UserIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="9" r="4" />
    </IconBase>
  );
}

function ShieldIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" />
      <path d="M9 12l2 2 4-5" />
    </IconBase>
  );
}

function WalletIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M17 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1" />
      <path d="M17 13h4" />
      <circle cx="18" cy="13" r="1" />
    </IconBase>
  );
}

function FlagIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M5 3v18" />
      <path d="M5 4h12l-2 4 2 4H5" />
    </IconBase>
  );
}

function LayersIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </IconBase>
  );
}

/* ✅ NEW ICONS */
function SparkIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
      <path d="M19 13l.8 2.8L22 16l-2.2.2L19 19l-.8-2.8L16 16l2.2-.2L19 13z" />
    </IconBase>
  );
}

function CalcIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h3" />
      <path d="M13 11h3" />
      <path d="M8 15h3" />
      <path d="M13 15h3" />
    </IconBase>
  );
}
