import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

// simple palette (kept consistent)
const PIE_COLORS = ["#4f46e5", "#22c55e", "#f59e0b", "#a855f7", "#0ea5e9"];

export default function Portfolio() {
  const navigate = useNavigate();

  // ✅ FIX: user login stores "access_token", admin/old code may store "token"
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState("");

  // per-user portfolio keys
  const PORT_KEY = useMemo(() => {
    const email = (
      me?.email ||
      localStorage.getItem("currentUserEmail") ||
      "guest"
    ).toLowerCase();
    return `portfolio:${email}`;
  }, [me?.email]);

  // portfolio state
  const [holdings, setHoldings] = useState([]); // [{name,type,value}]
  const [cash, setCash] = useState(0);
  const [history, setHistory] = useState([]); // [{month, netWorth}]

  // add investment form
  const [invName, setInvName] = useState("");
  const [invType, setInvType] = useState("Equity");
  const [invValue, setInvValue] = useState("");

  const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // ---------- Fetch logged-in user ----------
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingMe(true);
        setError("");

        // ✅ FIX: redirect to login if token missing
        if (!token) {
          setError("No token found. Please login again.");
          setLoadingMe(false);
          navigate("/login");
          return;
        }

        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Failed /api/users/me: ${res.status} ${t}`);
        }

        const data = await res.json();
        setMe(data);

        // keep localStorage email consistent (useful for your dashboard too)
        if (data?.email) localStorage.setItem("currentUserEmail", data.email);
      } catch (e) {
        setError(e?.message || "Failed to load user profile.");
      } finally {
        setLoadingMe(false);
      }
    };

    run();
  }, [token, navigate]);

  // ---------- Load portfolio for that user ----------
  useEffect(() => {
    const raw = localStorage.getItem(PORT_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHoldings(parsed.holdings || []);
        setCash(Number(parsed.cash || 0));
        setHistory(parsed.history || []);
        return;
      } catch {
        // fallthrough to seed
      }
    }

    const seeded = seedPortfolio();
    setHoldings(seeded.holdings);
    setCash(seeded.cash);
    setHistory(seeded.history);
    localStorage.setItem(PORT_KEY, JSON.stringify(seeded));
  }, [PORT_KEY]);

  const persist = (next) => {
    localStorage.setItem(PORT_KEY, JSON.stringify(next));
  };

  // ---------- Derived metrics ----------
  const investedTotal = holdings.reduce((s, h) => s + (Number(h.value) || 0), 0);
  const netWorth = investedTotal + (Number(cash) || 0);

  const byType = useMemo(() => {
    const map = new Map();
    for (const h of holdings) {
      const t = h.type || "Other";
      map.set(t, (map.get(t) || 0) + (Number(h.value) || 0));
    }
    const items = Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
    if (Number(cash) > 0) items.push({ name: "Cash", value: Number(cash) });
    return items.sort((a, b) => b.value - a.value);
  }, [holdings, cash]);

  const holdingsBar = useMemo(() => {
    return holdings
      .slice()
      .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
      .slice(0, 8)
      .map((h) => ({
        name:
          (h.name || "Asset").length > 10
            ? h.name.slice(0, 10) + "…"
            : h.name,
        value: Number(h.value) || 0,
      }));
  }, [holdings]);

  const historyData = useMemo(() => {
    if (!history || history.length === 0) {
      return [{ month: "Now", netWorth }];
    }
    return history;
  }, [history, netWorth]);

  // ---------- Actions ----------
  const addInvestment = (e) => {
    e.preventDefault();
    setError("");

    const cleanName = invName.trim();
    const val = Number(invValue);

    if (!cleanName || !invType || !val || val <= 0) {
      setError("Please enter valid investment name, type, and value.");
      return;
    }

    const nextHoldings = [
      { name: cleanName, type: invType, value: val, createdAt: Date.now() },
      ...holdings,
    ];
    setHoldings(nextHoldings);

    const nextNetWorth =
      nextHoldings.reduce((s, h) => s + (Number(h.value) || 0), 0) +
      Number(cash || 0);
    const nextHistory = bumpHistory(historyData, nextNetWorth);

    setHistory(nextHistory);

    persist({
      holdings: nextHoldings,
      cash: Number(cash || 0),
      history: nextHistory,
    });

    setInvName("");
    setInvValue("");
  };

  const deleteHolding = (idx) => {
    const nextHoldings = holdings.filter((_, i) => i !== idx);
    setHoldings(nextHoldings);

    const nextNetWorth =
      nextHoldings.reduce((s, h) => s + (Number(h.value) || 0), 0) +
      Number(cash || 0);
    const nextHistory = bumpHistory(historyData, nextNetWorth);
    setHistory(nextHistory);

    persist({
      holdings: nextHoldings,
      cash: Number(cash || 0),
      history: nextHistory,
    });
  };

  const updateCash = (val) => {
    const nextCash = Math.max(0, Number(val || 0));
    setCash(nextCash);

    const nextNetWorth = investedTotal + nextCash;
    const nextHistory = bumpHistory(historyData, nextNetWorth);
    setHistory(nextHistory);

    persist({
      holdings,
      cash: nextCash,
      history: nextHistory,
    });
  };

  const logout = () => {
    // ✅ FIX: remove both token keys so both flows logout cleanly
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("currentUserEmail");
    navigate("/login");
  };

  // ---------- UI ----------
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#eef0ff] via-[#f6edff] to-[#ffffff]">
      {/* background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lime-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(79,70,229,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(79,70,229,0.08)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-950">
              Portfolio
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Connected to user:{" "}
              <span className="font-semibold text-indigo-800">
                {loadingMe ? "Loading..." : me?.email || "guest"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-indigo-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-white transition"
            >
              Back to Dashboard
            </button>

            <button
              onClick={logout}
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="mt-4 rounded-3xl bg-white/80 ring-1 ring-red-200 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loadingMe ? (
          <div className="mt-4 rounded-3xl bg-white/80 ring-1 ring-indigo-100 p-6 text-slate-700">
            Loading your portfolio…
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard title="Net Worth" value={fmtINR(netWorth)} />
              <StatCard title="Invested" value={fmtINR(investedTotal)} />
              <StatCard title="Cash" value={fmtINR(cash)} />
              <StatCard title="Holdings" value={String(holdings.length)} />
            </div>

            {/* Charts */}
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <GlassCard className="lg:col-span-1">
                <h2 className="text-base font-bold text-indigo-950">
                  Allocation
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  By asset type (includes Cash)
                </p>

                <div className="mt-4 h-60">
                  {byType.length === 0 ? (
                    <EmptyState text="Add holdings to see allocation." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byType}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {byType.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmtINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="mt-2 space-y-2 text-sm">
                  {byType.slice(0, 5).map((x, i) => (
                    <div
                      key={x.name}
                      className="flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        {x.name}
                      </span>
                      <span className="font-semibold text-indigo-950">
                        {fmtINR(x.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="lg:col-span-2">
                <h2 className="text-base font-bold text-indigo-950">
                  Net Worth Trend
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Quick view (local history for now)
                </p>

                <div className="mt-4 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => fmtINR(v)} />
                      <Line
                        type="monotone"
                        dataKey="netWorth"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <GlassCard className="lg:col-span-2">
                <h2 className="text-base font-bold text-indigo-950">
                  Top Holdings
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Largest positions (top 8)
                </p>

                <div className="mt-4 h-60">
                  {holdingsBar.length === 0 ? (
                    <EmptyState text="Add holdings to see the chart." />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={holdingsBar}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => fmtINR(v)} />
                        <Bar
                          dataKey="value"
                          fill="#4f46e5"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="lg:col-span-1">
                <h2 className="text-base font-bold text-indigo-950">
                  Cash Balance
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Update cash anytime
                </p>

                <div className="mt-4">
                  <label className="text-sm font-semibold text-indigo-900/80">
                    Cash (₹)
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-indigo-300"
                    type="number"
                    min="0"
                    value={cash}
                    onChange={(e) => updateCash(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Cash is included in Allocation + Net Worth.
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Add investment */}
            <GlassCard className="mt-6">
              <h2 className="text-lg font-bold text-indigo-950">
                Add Investment
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                This saves per-user. Later we’ll store it in PostgreSQL using
                backend APIs.
              </p>

              <form
                onSubmit={addInvestment}
                className="mt-4 grid gap-4 md:grid-cols-3"
              >
                <Field label="Name">
                  <input
                    className="mt-1 w-full rounded-2xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-indigo-300"
                    value={invName}
                    onChange={(e) => setInvName(e.target.value)}
                    placeholder="e.g., Nifty ETF"
                  />
                </Field>

                <Field label="Type">
                  <select
                    className="mt-1 w-full rounded-2xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-indigo-300"
                    value={invType}
                    onChange={(e) => setInvType(e.target.value)}
                  >
                    <option>Equity</option>
                    <option>Debt</option>
                    <option>Gold</option>
                    <option>Crypto</option>
                    <option>Real Estate</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Value (₹)">
                  <input
                    className="mt-1 w-full rounded-2xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-indigo-300"
                    value={invValue}
                    onChange={(e) => setInvValue(e.target.value)}
                    placeholder="e.g., 25000"
                    type="number"
                    min="0"
                  />
                </Field>

                <button className="md:col-span-3 w-full rounded-2xl bg-lime-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-lime-700 transition">
                  Add Investment
                </button>
              </form>
            </GlassCard>

            {/* Holdings list */}
            <div className="mt-6">
              <h2 className="text-lg font-bold text-indigo-950">Holdings</h2>

              {holdings.length === 0 ? (
                <p className="mt-3 text-slate-600">
                  No holdings yet. Add your first investment above.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {holdings.map((h, idx) => (
                    <div
                      key={h.createdAt ?? idx}
                      className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-indigo-100 p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-indigo-950">
                            {h.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            <span className="font-semibold text-indigo-800">
                              {h.type}
                            </span>{" "}
                            • {fmtINR(h.value)}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteHolding(idx)}
                          className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs text-slate-500">Value</div>
                        <div className="mt-1 text-lg font-extrabold text-indigo-950">
                          {fmtINR(h.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 pb-8 text-center text-xs text-slate-500">
              © {new Date().getFullYear()} WealthTrack • Portfolio
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl bg-white/80 backdrop-blur-md shadow-xl ring-1 ring-indigo-100 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-lg ring-1 ring-indigo-100 p-5">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-2 text-xl font-extrabold text-indigo-950">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-indigo-900/80">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="h-full rounded-2xl bg-white/60 ring-1 ring-indigo-100 flex items-center justify-center text-slate-600">
      {text}
    </div>
  );
}

// seeds initial portfolio so charts aren’t empty
function seedPortfolio() {
  const holdings = [
    { name: "Nifty ETF", type: "Equity", value: 50000, createdAt: Date.now() - 100000 },
    { name: "Gold Fund", type: "Gold", value: 20000, createdAt: Date.now() - 90000 },
    { name: "Debt Fund", type: "Debt", value: 30000, createdAt: Date.now() - 80000 },
  ];
  const cash = 15000;

  const base = holdings.reduce((s, h) => s + h.value, 0) + cash;
  const history = [
    { month: "Aug", netWorth: Math.round(base * 0.82) },
    { month: "Sep", netWorth: Math.round(base * 0.86) },
    { month: "Oct", netWorth: Math.round(base * 0.91) },
    { month: "Nov", netWorth: Math.round(base * 0.96) },
    { month: "Dec", netWorth: base },
  ];

  return { holdings, cash, history };
}

// updates history "Now" point or adds a new point
function bumpHistory(existing, netWorth) {
  const copy = (existing || []).slice();
  if (copy.length === 0) return [{ month: "Now", netWorth }];

  const last = copy[copy.length - 1];
  if (last?.month === "Now") {
    copy[copy.length - 1] = { month: "Now", netWorth };
    return copy;
  }
  return [...copy, { month: "Now", netWorth }];
}
