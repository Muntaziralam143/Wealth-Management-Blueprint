// AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const API_PREFIX = "/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Tabs: dashboard | users | reports
  const [tab, setTab] = useState("dashboard");

  const [users, setUsers] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);

  // expanded sub-tab: goals | activity
  const [expandedViewByUserId, setExpandedViewByUserId] = useState({}); // { [id]: "goals"|"activity" }

  // goals cache by user id
  const [goalsByUserId, setGoalsByUserId] = useState({}); // { [id]: Goal[] }
  const [loadingGoalsByUserId, setLoadingGoalsByUserId] = useState({}); // { [id]: boolean }

  // activity cache by user id
  const [activityByUserId, setActivityByUserId] = useState({}); // { [id]: Activity[] }
  const [loadingActivityByUserId, setLoadingActivityByUserId] = useState({}); // { [id]: boolean }

  // edit state
  const [editingKey, setEditingKey] = useState(null); // `${userId}::${index}`
  const [editForm, setEditForm] = useState({ title: "", target: "", saved: "" });

  // add state
  const [addOpenForUserId, setAddOpenForUserId] = useState(null); // userId
  const [addForm, setAddForm] = useState({ title: "", target: "", saved: "" });

  // UI state
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // all | user | admin (role may not exist)
  const [sortBy, setSortBy] = useState("name"); // name | goals | saved
  const [error, setError] = useState("");

  // Activity filters (inside expanded user)
  const [activityFilterByUserId, setActivityFilterByUserId] = useState({}); // { [id]: "all"|"auth"|"goals" }
  const [activitySearchByUserId, setActivitySearchByUserId] = useState({}); // { [id]: string }

  // token
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    const h = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const toINR = (n) => Number(n || 0).toLocaleString("en-IN");

  // ---------------- Helpers ----------------
  const safeParse = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  // ✅ IMPORTANT:
  // - If your USER dashboard writes logs as activity:<email>, admin can still read them.
  // - If you later make backend logs, admin will auto-use GET /admin/users/:id/activity
  const activityKeyById = (userId) => `activity:${userId}`;
  const activityKeyByEmail = (email) => `activity:${String(email || "").toLowerCase()}`;

  const downloadTextFile = (filename, text, mime) => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const normalizeGoal = (g) => ({
    ...g,
    target: g?.target ?? g?.target_amount ?? 0,
    saved: g?.saved ?? g?.saved_amount ?? 0,
  });

  const api = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
      ...options,
      headers: { ...authHeaders, ...(options.headers || {}) },
    });

    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const j = await res.json();
        msg = j?.detail || j?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  const loadUsers = async () => {
    setError("");
    try {
      const list = await api("/admin/users", { method: "GET" });
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const loadGoalsForUser = async (userId) => {
    if (!userId) return;
    setError("");
    setLoadingGoalsByUserId((p) => ({ ...p, [userId]: true }));
    try {
      const goals = await api(`/admin/users/${userId}/goals`, { method: "GET" });
      const normalized = Array.isArray(goals) ? goals.map(normalizeGoal) : [];
      setGoalsByUserId((p) => ({ ...p, [userId]: normalized }));
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoadingGoalsByUserId((p) => ({ ...p, [userId]: false }));
    }
  };

  // ✅ Activity log loader:
  // 1) Try backend endpoint (if you add it): GET /admin/users/:id/activity
  // 2) Fallback to localStorage: activity:<userId>
  // 3) Fallback to localStorage: activity:<email>
  const loadActivityForUser = async (user) => {
    const userId = user?.id;
    const email = user?.email;

    if (!userId && !email) return;
    setError("");
    setLoadingActivityByUserId((p) => ({ ...p, [userId]: true }));

    try {
      // 1) API attempt
      if (userId) {
        try {
          const act = await api(`/admin/users/${userId}/activity`, { method: "GET" });
          if (Array.isArray(act)) {
            const normalized = act.map((x, idx) => ({
              id: x?.id ?? `${userId}-${idx}`,
              ts: x?.ts ?? x?.timestamp ?? x?.created_at ?? new Date().toISOString(),
              action: x?.action ?? x?.event ?? "activity",
              actor: x?.actor ?? x?.by ?? "user",
              meta: x?.meta ?? x?.details ?? {},
            }));
            setActivityByUserId((p) => ({ ...p, [userId]: normalized }));
            return;
          }
        } catch {
          // ignore and fallback
        }
      }

      // 2) localStorage by userId
      let ls = [];
      if (userId) {
        ls = safeParse(localStorage.getItem(activityKeyById(userId)), []);
      }

      // 3) localStorage by email
      if ((!ls || ls.length === 0) && email) {
        ls = safeParse(localStorage.getItem(activityKeyByEmail(email)), []);
      }

      const normalizedLs = Array.isArray(ls)
        ? ls.map((x, idx) => ({
            id: x?.id ?? `${userId || email}-${idx}`,
            ts: x?.ts ?? x?.timestamp ?? new Date().toISOString(),
            action: x?.action ?? x?.event ?? "activity",
            actor: x?.actor ?? "user",
            meta: x?.meta ?? x?.details ?? {},
          }))
        : [];

      setActivityByUserId((p) => ({ ...p, [userId]: normalizedLs }));
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoadingActivityByUserId((p) => ({ ...p, [userId]: false }));
    }
  };

  // first load
  useEffect(() => {
    if (!token) {
      navigate("/admin-login");
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("access_token");
    localStorage.removeItem("currentUserEmail");
    navigate("/admin-login");
  };

  // cached
  const getUserGoals = (userId) => goalsByUserId[userId] || [];
  const getUserActivity = (userId) => activityByUserId[userId] || [];

  const userSummary = (userId) => {
    const goals = getUserGoals(userId);

    const totalTarget = goals.reduce(
      (s, g) => s + (Number(g.target_amount ?? g.target) || 0),
      0
    );
    const totalSaved = goals.reduce(
      (s, g) => s + (Number(g.saved_amount ?? g.saved) || 0),
      0
    );
    const pct =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return { totalTarget, totalSaved, pct, count: goals.length };
  };

  // ---------- User expand ----------
  const toggleUserExpand = async (u) => {
    const userId = u?.id;
    if (!userId) return;

    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }

    setExpandedUserId(userId);
    setExpandedViewByUserId((p) => ({ ...p, [userId]: p[userId] || "goals" }));

    // preload goals + activity
    if (!goalsByUserId[userId]) await loadGoalsForUser(userId);
    if (!activityByUserId[userId]) await loadActivityForUser(u);

    // init activity controls
    setActivityFilterByUserId((p) => ({ ...p, [userId]: p[userId] || "all" }));
    setActivitySearchByUserId((p) => ({ ...p, [userId]: p[userId] || "" }));
  };

  const setExpandedView = async (u, view) => {
    const userId = u?.id;
    if (!userId) return;
    setExpandedViewByUserId((p) => ({ ...p, [userId]: view }));

    if (view === "activity" && !activityByUserId[userId]) {
      await loadActivityForUser(u);
    }
    if (view === "goals" && !goalsByUserId[userId]) {
      await loadGoalsForUser(userId);
    }
  };

  // ---------- CRUD Goals (Admin actions) ----------
  const openAdd = (userId) => {
    setAddOpenForUserId(userId);
    setAddForm({ title: "", target: "", saved: "" });
  };
  const closeAdd = () => {
    setAddOpenForUserId(null);
    setAddForm({ title: "", target: "", saved: "" });
  };

  const addGoal = async (userId) => {
    const title = (addForm.title || "").trim();
    const target = Number(addForm.target || 0);
    let saved = Number(addForm.saved || 0);

    if (!title) return;
    if (target > 0) saved = Math.max(0, Math.min(saved, target));
    else saved = Math.max(0, saved);

    setError("");
    try {
      const created = await api(`/admin/users/${userId}/goals`, {
        method: "POST",
        body: JSON.stringify({
          title,
          target_amount: target,
          saved_amount: saved,
        }),
      });

      const normalized = normalizeGoal(created);
      setGoalsByUserId((p) => {
        const prev = p[userId] || [];
        return { ...p, [userId]: [normalized, ...prev] };
      });

      closeAdd();
      setExpandedUserId(userId);
      setExpandedViewByUserId((p) => ({ ...p, [userId]: "goals" }));
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const startEdit = (userId, index) => {
    const goals = getUserGoals(userId);
    const g = goals[index];
    if (!g) return;

    setEditingKey(`${userId}::${index}`);
    setEditForm({
      title: g.title ?? "",
      target: String(g.target_amount ?? g.target ?? ""),
      saved: String(g.saved_amount ?? g.saved ?? ""),
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditForm({ title: "", target: "", saved: "" });
  };

  const applyEdit = async (userId, index) => {
    const goals = getUserGoals(userId);
    const old = goals[index];
    if (!old) return;

    const title = (editForm.title || "").trim();
    const target = Number(editForm.target || 0);
    let saved = Number(editForm.saved || 0);

    if (target > 0) saved = Math.max(0, Math.min(saved, target));
    else saved = Math.max(0, saved);

    setError("");
    try {
      const updated = await api(`/admin/goals/${old.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          target_amount: target,
          saved_amount: saved,
        }),
      });

      const normalized = normalizeGoal(updated);

      setGoalsByUserId((p) => {
        const next = (p[userId] || []).slice();
        next[index] = normalized;
        return { ...p, [userId]: next };
      });

      cancelEdit();
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const deleteGoal = async (userId, index) => {
    const goals = getUserGoals(userId);
    const g = goals[index];
    if (!g) return;

    const ok = window.confirm(`Delete goal "${g.title}"?`);
    if (!ok) return;

    setError("");
    try {
      await api(`/admin/goals/${g.id}`, { method: "DELETE" });

      setGoalsByUserId((p) => {
        const next = (p[userId] || []).slice();
        next.splice(index, 1);
        return { ...p, [userId]: next };
      });

      if (editingKey === `${userId}::${index}`) cancelEdit();
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const deleteUser = async (user) => {
    const ok = window.confirm(
      `Delete user "${user?.email}"?\n\nYour backend admin_router currently does NOT include a delete-user endpoint.\nSo this button is kept, but it cannot delete from DB.`
    );
    if (!ok) return;

    setError("Delete User is not implemented in backend yet.");
  };

  // ---------- Dashboard Stats ----------
  const stats = useMemo(() => {
    const totalUsers = users.length;

    let totalGoals = 0;
    let totalSaved = 0;
    let totalTarget = 0;
    let activePortfolios = 0;

    users.forEach((u) => {
      const uid = u?.id;
      if (!uid) return;
      const goals = getUserGoals(uid);

      if (goals.length > 0) activePortfolios += 1;

      totalGoals += goals.length;
      totalSaved += goals.reduce(
        (s, g) => s + (Number(g.saved_amount ?? g.saved) || 0),
        0
      );
      totalTarget += goals.reduce(
        (s, g) => s + (Number(g.target_amount ?? g.target) || 0),
        0
      );
    });

    const pct =
      totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    return { totalUsers, activePortfolios, totalGoals, totalSaved, totalTarget, pct };
  }, [users, goalsByUserId]);

  // Users visible list
  const visibleUsers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = users.slice();

    if (needle) {
      list = list.filter((u) => {
        const name = String(u?.name || "").toLowerCase();
        const email = String(u?.email || "").toLowerCase();
        return name.includes(needle) || email.includes(needle);
      });
    }

    if (roleFilter !== "all") {
      list = list.filter((u) => (u?.role || "user") === roleFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "name") return String(a?.name || "").localeCompare(String(b?.name || ""));
      if (sortBy === "goals") return getUserGoals(b?.id).length - getUserGoals(a?.id).length;
      if (sortBy === "saved") return userSummary(b?.id).totalSaved - userSummary(a?.id).totalSaved;
      return 0;
    });

    return list;
  }, [users, q, roleFilter, sortBy, goalsByUserId]);

  // Reports: Top Savers
  const topSavers = useMemo(() => {
    return users
      .map((u) => {
        const uid = u?.id;
        const sum = userSummary(uid);
        return {
          id: uid,
          name: u?.name || "Unnamed",
          email: u?.email || "",
          saved: sum.totalSaved,
          target: sum.totalTarget,
          pct: sum.pct,
          goals: sum.count,
        };
      })
      .filter((r) => r.id)
      .sort((a, b) => b.saved - a.saved)
      .slice(0, 5);
  }, [users, goalsByUserId]);

  const exportJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      stats,
      users: users.map((u) => ({
        ...u,
        goals: getUserGoals(u?.id),
        activity: getUserActivity(u?.id),
      })),
    };
    downloadTextFile(
      `wealth-admin-report-${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  // ✅ Export selected user
  const exportUserJSON = (u) => {
    const uid = u?.id;
    if (!uid) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      user: u,
      goals: getUserGoals(uid),
      activity: getUserActivity(uid),
    };
    downloadTextFile(
      `user-${uid}-export-${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const exportUserCSV = (u) => {
    const uid = u?.id;
    if (!uid) return;

    const goals = getUserGoals(uid);
    const activity = getUserActivity(uid);

    const esc = (v) => {
      const s = String(v ?? "");
      if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [];
    lines.push("SECTION,USER_ID,USER_EMAIL,USER_NAME");
    lines.push(`META,${esc(uid)},${esc(u?.email || "")},${esc(u?.name || "")}`);
    lines.push("");

    lines.push("GOALS");
    lines.push("id,title,target_amount,saved_amount,progress_pct,created_at,updated_at");
    goals.forEach((g) => {
      const target = Number(g.target_amount ?? g.target ?? 0);
      const saved = Number(g.saved_amount ?? g.saved ?? 0);
      const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
      lines.push(
        [
          esc(g?.id || ""),
          esc(g?.title || ""),
          esc(target),
          esc(saved),
          esc(pct),
          esc(g?.created_at || ""),
          esc(g?.updated_at || ""),
        ].join(",")
      );
    });

    lines.push("");
    lines.push("ACTIVITY");
    lines.push("id,ts,action,actor,goal_title,amount,meta");
    activity.forEach((a) => {
      const meta = a?.meta || {};
      lines.push(
        [
          esc(a?.id || ""),
          esc(a?.ts || ""),
          esc(a?.action || ""),
          esc(a?.actor || ""),
          esc(meta?.goalTitle || meta?.title || ""),
          esc(meta?.amount ?? meta?.saved_amount ?? meta?.target_amount ?? ""),
          esc(JSON.stringify(meta || {})),
        ].join(",")
      );
    });

    downloadTextFile(`user-${uid}-export-${Date.now()}.csv`, lines.join("\n"), "text/csv");
  };

  // Preload goals for first few users (dashboard stats)
  useEffect(() => {
    const preload = async () => {
      if (!users.length) return;
      const batch = users.slice(0, 6).map((u) => u.id).filter(Boolean);
      for (const uid of batch) {
        if (!goalsByUserId[uid]) {
          // eslint-disable-next-line no-await-in-loop
          await loadGoalsForUser(uid);
        }
      }
    };
    preload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // ---------- Activity formatting ----------
  const formatAction = (a) => {
    const action = String(a?.action || "").toUpperCase();
    const meta = a?.meta || {};

    // login/logout
    if (action === "USER_LOGIN") return "User Login";
    if (action === "USER_LOGOUT") return "User Logout";

    // goal events
    if (action === "USER_ADD_GOAL") return `Goal Created: ${meta.goalTitle || meta.title || ""}`.trim();
    if (action === "USER_UPDATE_GOAL") return `Goal Updated: ${meta.goalTitle || meta.title || ""}`.trim();
    if (action === "USER_DELETE_GOAL") return `Goal Deleted: ${meta.goalTitle || meta.title || ""}`.trim();

    // money update events
    if (action === "USER_SAVE_MONEY") {
      const amt = meta.amount ?? meta.saved_amount ?? "";
      const title = meta.goalTitle || meta.title || "";
      return `Saved Money${title ? ` (${title})` : ""}: ₹${toINR(amt)}`;
    }

    // admin events (if you also log them)
    if (action.startsWith("ADMIN_")) return action.replaceAll("_", " ");

    // fallback
    return action ? action.replaceAll("_", " ") : "Activity";
  };

  const activityKind = (a) => {
    const action = String(a?.action || "").toUpperCase();
    if (action === "USER_LOGIN" || action === "USER_LOGOUT") return "auth";
    if (action.includes("GOAL") || action.includes("SAVE")) return "goals";
    return "other";
  };

  const activityBadge = (a) => {
    const kind = activityKind(a);
    if (kind === "auth")
      return "bg-sky-500/10 text-sky-200 ring-sky-400/20";
    if (kind === "goals")
      return "bg-emerald-500/10 text-emerald-200 ring-emerald-400/20";
    return "bg-white/5 text-white/70 ring-white/10";
  };

  const filteredActivity = (userId) => {
    const list = getUserActivity(userId);
    const filter = activityFilterByUserId[userId] || "all";
    const search = (activitySearchByUserId[userId] || "").trim().toLowerCase();

    return list
      .filter((a) => {
        if (filter === "auth") return activityKind(a) === "auth";
        if (filter === "goals") return activityKind(a) === "goals";
        return true;
      })
      .filter((a) => {
        if (!search) return true;
        const txt =
          `${a?.action || ""} ${formatAction(a)} ${JSON.stringify(a?.meta || {})}`.toLowerCase();
        return txt.includes(search);
      })
      .slice(0, 80);
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-[#070B12] text-white">
      {/* background glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-[260px] shrink-0 border-r border-white/10 bg-[#070B12]/60 backdrop-blur-xl">
          <div className="p-6">
            {/* ✅ removed W logo */}
            <div>
              <p className="text-lg font-extrabold leading-5">Wealth Admin</p>
              <p className="text-xs text-white/50">Platform Console</p>
            </div>

            <div className="mt-8 space-y-2">
              <SideBtn
                active={tab === "dashboard"}
                onClick={() => setTab("dashboard")}
                icon={<IconGrid />}
                label="Dashboard"
              />
              <SideBtn
                active={tab === "users"}
                onClick={() => setTab("users")}
                icon={<IconUsers />}
                label="Users"
              />
              <SideBtn
                active={tab === "reports"}
                onClick={() => setTab("reports")}
                icon={<IconFile />}
                label="Reports"
              />
            </div>

            <div className="mt-10 border-t border-white/10 pt-4">
              <button
                onClick={logout}
                className="w-full rounded-xl bg-rose-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              >
                Logout
              </button>
              <button
                onClick={() => navigate("/")}
                className="mt-2 w-full rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                Home
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
              <p className="mt-1 text-white/55">System overview & platform health</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadUsers}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
              >
                Refresh
              </button>
              <button
                onClick={exportJSON}
                className="rounded-xl bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30 hover:bg-amber-400/20"
              >
                Export JSON
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-4 rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/20 p-4">
              <p className="text-sm text-rose-200 font-semibold">Error</p>
              <p className="text-sm text-rose-200/80 mt-1">{error}</p>
            </div>
          )}

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div className="mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <DarkStatCard title="Total Users" value={String(stats.totalUsers)} icon={<IconUsersBadge />} accent="amber" />
                <DarkStatCard title="Active Portfolios" value={String(stats.activePortfolios)} icon={<IconChart />} accent="emerald" />
                <DarkStatCard title="Total Goals" value={String(stats.totalGoals)} icon={<IconShield />} accent="rose" />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Panel>
                  <p className="text-sm font-semibold text-white/80">Total Saved</p>
                  <p className="mt-2 text-3xl font-extrabold">₹{toINR(stats.totalSaved)}</p>
                  <p className="mt-2 text-xs text-white/50">Combined savings across all user goals</p>
                </Panel>

                <Panel>
                  <p className="text-sm font-semibold text-white/80">Total Target</p>
                  <p className="mt-2 text-3xl font-extrabold">₹{toINR(stats.totalTarget)}</p>
                  <p className="mt-2 text-xs text-white/50">Combined target amount across all goals</p>
                </Panel>

                <Panel>
                  <p className="text-sm font-semibold text-white/80">Overall Progress</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-amber-300"
                        style={{ width: `${Math.min(100, Math.max(0, stats.pct))}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-white/85">{stats.pct}%</span>
                  </div>
                  <p className="mt-2 text-xs text-white/50">Saved / Target (all users combined)</p>
                </Panel>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Panel>
                  <p className="text-sm font-semibold text-white/80">Quick Actions</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setTab("users")}
                      className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      Manage Users
                    </button>
                    <button
                      onClick={exportJSON}
                      className="rounded-xl bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30 hover:bg-amber-400/20"
                    >
                      Export Report
                    </button>
                  </div>
                </Panel>

                <Panel>
                  <p className="text-sm font-semibold text-white/80">Top Savers (Preview)</p>
                  <div className="mt-3 space-y-2">
                    {topSavers.length === 0 ? (
                      <p className="text-sm text-white/50">No user data available yet.</p>
                    ) : (
                      topSavers.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.name}</p>
                            <p className="text-xs text-white/45 truncate">{r.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">₹{toINR(r.saved)}</p>
                            <p className="text-xs text-white/45">{r.pct}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="mt-6">
              <Panel>
                <div className="grid gap-3 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <label className="text-xs font-semibold text-white/60">Search users</label>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search by name or email..."
                      className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-300/50"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-white/60">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                    >
                      <option value="all">All</option>
                      <option value="user">Users</option>
                      <option value="admin">Admins</option>
                    </select>
                    <p className="mt-1 text-[11px] text-white/35">
                      Your UserOut schema doesn’t include role, so everyone is treated as “user”.
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-white/60">Sort</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                    >
                      <option value="name">Name (A-Z)</option>
                      <option value="goals">Goals (High → Low)</option>
                      <option value="saved">Saved (High → Low)</option>
                    </select>
                  </div>
                </div>
              </Panel>

              <div className="mt-4 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 text-white/70">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold">#</th>
                        <th className="p-4 text-left text-sm font-semibold">User</th>
                        <th className="p-4 text-left text-sm font-semibold">Role</th>
                        <th className="p-4 text-left text-sm font-semibold">Summary</th>
                        <th className="p-4 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="text-white/90">
                      {visibleUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-10 text-center">
                            <p className="text-white/80 font-semibold">No users found</p>
                            <p className="text-white/45 text-sm mt-1">Try changing search / filters.</p>
                          </td>
                        </tr>
                      ) : (
                        visibleUsers.map((u, i) => {
                          const uid = u?.id;
                          const goals = getUserGoals(uid);
                          const sum = userSummary(uid);
                          const expanded = expandedUserId === uid;

                          return (
                            <React.Fragment key={`${uid}-${u?.email || i}`}>
                              <tr className="border-t border-white/10">
                                <td className="p-4">{i + 1}</td>

                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/20 flex items-center justify-center font-extrabold text-amber-200">
                                      {(u?.name || u?.email || "U").slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold truncate">{u?.name || "Unnamed"}</p>
                                      <p className="text-sm text-white/50 truncate">{u?.email}</p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-emerald-500/10 text-emerald-200 ring-emerald-400/20">
                                    USER
                                  </span>
                                </td>

                                <td className="p-4 text-sm text-white/60">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold text-white/90">
                                      ₹{toINR(sum.totalSaved)} / ₹{toINR(sum.totalTarget)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-28 rounded bg-white/10 overflow-hidden">
                                        <div
                                          className="h-2 rounded bg-emerald-300"
                                          style={{ width: `${Math.min(100, Math.max(0, sum.pct))}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-white/50">{sum.pct}%</span>
                                      <span className="text-xs text-white/30">•</span>
                                      <span className="text-xs text-white/50">{sum.count} goals</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => toggleUserExpand(u)}
                                      className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
                                    >
                                      {expanded ? "Hide Details" : "View Details"}
                                    </button>

                                    <button
                                      onClick={() => openAdd(uid)}
                                      className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
                                    >
                                      + Add Goal
                                    </button>

                                    <button
                                      onClick={() => exportUserJSON(u)}
                                      className="rounded-lg bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/25 hover:bg-amber-400/20"
                                    >
                                      Export User (JSON)
                                    </button>

                                    <button
                                      onClick={() => exportUserCSV(u)}
                                      className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-400/25 hover:bg-indigo-500/20"
                                    >
                                      Export User (CSV)
                                    </button>

                                    <button
                                      onClick={() => deleteUser(u)}
                                      className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm font-semibold text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/25"
                                    >
                                      Delete User
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Add Goal Panel */}
                              {addOpenForUserId === uid && (
                                <tr className="border-t border-white/10 bg-white/3">
                                  <td colSpan="5" className="p-4">
                                    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                                      <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-base font-bold">
                                          Add goal for <span className="text-amber-200">{u?.email}</span>
                                        </h3>
                                        <button
                                          onClick={closeAdd}
                                          className="rounded-lg bg-white/5 px-3 py-1 text-sm font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                                        >
                                          Close
                                        </button>
                                      </div>

                                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        <input
                                          value={addForm.title}
                                          onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                                          placeholder="Goal title"
                                          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-300/50"
                                        />
                                        <input
                                          value={addForm.target}
                                          onChange={(e) => setAddForm((p) => ({ ...p, target: e.target.value }))}
                                          placeholder="Target (₹)"
                                          type="number"
                                          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-300/50"
                                        />
                                        <input
                                          value={addForm.saved}
                                          onChange={(e) => setAddForm((p) => ({ ...p, saved: e.target.value }))}
                                          placeholder="Saved (₹)"
                                          type="number"
                                          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-300/50"
                                        />
                                      </div>

                                      <div className="mt-3 flex gap-2">
                                        <button
                                          onClick={() => addGoal(uid)}
                                          className="rounded-xl bg-emerald-500/25 px-4 py-2 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                                        >
                                          Add Goal
                                        </button>
                                        <button
                                          onClick={closeAdd}
                                          className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* Expanded User Details */}
                              {expanded && (
                                <tr className="border-t border-white/10 bg-white/3">
                                  <td colSpan="5" className="p-4">
                                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                          <p className="text-sm text-white/60">
                                            Viewing{" "}
                                            <span className="text-white/90 font-semibold">
                                              {u?.name || "Unnamed"}
                                            </span>{" "}
                                            • <span className="text-white/50">{u?.email}</span>
                                          </p>
                                          <p className="text-xs text-white/40 mt-1">
                                            Activity Log shows: login/logout + goal set time + money changes (if your USER app logs it).
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() => setExpandedView(u, "goals")}
                                            className={[
                                              "rounded-xl px-4 py-2 text-sm font-semibold ring-1",
                                              (expandedViewByUserId[uid] || "goals") === "goals"
                                                ? "bg-amber-400 text-black ring-amber-300"
                                                : "bg-white/5 text-white/90 ring-white/10 hover:bg-white/10",
                                            ].join(" ")}
                                          >
                                            Goals
                                          </button>

                                          <button
                                            onClick={() => setExpandedView(u, "activity")}
                                            className={[
                                              "rounded-xl px-4 py-2 text-sm font-semibold ring-1",
                                              (expandedViewByUserId[uid] || "goals") === "activity"
                                                ? "bg-amber-400 text-black ring-amber-300"
                                                : "bg-white/5 text-white/90 ring-white/10 hover:bg-white/10",
                                            ].join(" ")}
                                          >
                                            Activity Log
                                          </button>

                                          <button
                                            onClick={() => exportUserJSON(u)}
                                            className="rounded-xl bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30 hover:bg-amber-400/20"
                                          >
                                            Export User JSON
                                          </button>

                                          <button
                                            onClick={() => exportUserCSV(u)}
                                            className="rounded-xl bg-indigo-500/15 px-4 py-2 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-400/30 hover:bg-indigo-500/20"
                                          >
                                            Export User CSV
                                          </button>
                                        </div>
                                      </div>

                                      {/* Goals View */}
                                      {(expandedViewByUserId[uid] || "goals") === "goals" && (
                                        <div className="mt-4">
                                          {loadingGoalsByUserId[uid] ? (
                                            <p className="text-sm text-white/55">Loading goals...</p>
                                          ) : goals.length === 0 ? (
                                            <p className="text-white/60">No goals found for this user.</p>
                                          ) : (
                                            <div className="grid gap-4 md:grid-cols-2">
                                              {goals.map((g, index) => {
                                                const key = `${uid}::${index}`;
                                                const isEditing = editingKey === key;

                                                const target = Number(g.target_amount ?? g.target ?? 0);
                                                const saved = Number(g.saved_amount ?? g.saved ?? 0);
                                                const progress = target > 0 ? Math.round((saved / target) * 100) : 0;

                                                return (
                                                  <div key={g.id || key} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                                                    <div className="flex items-start justify-between gap-3">
                                                      <div className="min-w-0 flex-1">
                                                        {!isEditing ? (
                                                          <>
                                                            <h3 className="truncate text-base font-bold text-white/90">{g.title}</h3>
                                                            <p className="mt-1 text-sm text-white/55">
                                                              ₹{toINR(saved)} / ₹{toINR(target)}
                                                            </p>
                                                          </>
                                                        ) : (
                                                          <div className="grid gap-2">
                                                            <input
                                                              value={editForm.title}
                                                              onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                                                              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                              <input
                                                                value={editForm.target}
                                                                onChange={(e) => setEditForm((p) => ({ ...p, target: e.target.value }))}
                                                                type="number"
                                                                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                                                              />
                                                              <input
                                                                value={editForm.saved}
                                                                onChange={(e) => setEditForm((p) => ({ ...p, saved: e.target.value }))}
                                                                type="number"
                                                                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                                                              />
                                                            </div>
                                                          </div>
                                                        )}
                                                      </div>

                                                      <div className="flex shrink-0 gap-2">
                                                        {!isEditing ? (
                                                          <>
                                                            <button
                                                              onClick={() => startEdit(uid, index)}
                                                              className="rounded-lg bg-amber-400/15 px-3 py-1.5 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/25 hover:bg-amber-400/20"
                                                            >
                                                              Edit
                                                            </button>
                                                            <button
                                                              onClick={() => deleteGoal(uid, index)}
                                                              className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-sm font-semibold text-rose-200 ring-1 ring-rose-400/25 hover:bg-rose-500/20"
                                                            >
                                                              Delete
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <>
                                                            <button
                                                              onClick={() => applyEdit(uid, index)}
                                                              className="rounded-lg bg-emerald-500/25 px-3 py-1.5 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                                                            >
                                                              Save
                                                            </button>
                                                            <button
                                                              onClick={cancelEdit}
                                                              className="rounded-lg bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                                                            >
                                                              Cancel
                                                            </button>
                                                          </>
                                                        )}
                                                      </div>
                                                    </div>

                                                    <div className="mt-3">
                                                      <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
                                                        <div className="h-2 rounded bg-emerald-300" style={{ width: `${Math.min(100, progress)}%` }} />
                                                      </div>
                                                      <p className="mt-1 text-xs text-white/45">
                                                        Progress: {Number.isFinite(progress) ? progress : 0}%
                                                      </p>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Activity View */}
                                      {(expandedViewByUserId[uid] || "goals") === "activity" && (
                                        <div className="mt-4">
                                          {loadingActivityByUserId[uid] ? (
                                            <p className="text-sm text-white/55">Loading activity...</p>
                                          ) : (
                                            <>
                                              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                                <div className="flex flex-col gap-1">
                                                  <p className="text-sm font-semibold text-white/85">
                                                    Activity Log (Login/Logout + Goals + Money)
                                                  </p>
                                                  <p className="text-xs text-white/45">
                                                    If you don’t see entries, your USER app is not saving logs yet.
                                                  </p>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                  <input
                                                    value={activitySearchByUserId[uid] || ""}
                                                    onChange={(e) =>
                                                      setActivitySearchByUserId((p) => ({ ...p, [uid]: e.target.value }))
                                                    }
                                                    placeholder="Search activity..."
                                                    className="w-56 rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-300/50"
                                                  />

                                                  <select
                                                    value={activityFilterByUserId[uid] || "all"}
                                                    onChange={(e) =>
                                                      setActivityFilterByUserId((p) => ({ ...p, [uid]: e.target.value }))
                                                    }
                                                    className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-amber-300/50"
                                                  >
                                                    <option value="all">All</option>
                                                    <option value="auth">Login/Logout</option>
                                                    <option value="goals">Goals/Money</option>
                                                  </select>

                                                  <button
                                                    onClick={() => loadActivityForUser(u)}
                                                    className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/10 hover:bg-white/10"
                                                  >
                                                    Refresh Log
                                                  </button>
                                                </div>
                                              </div>

                                              <div className="mt-3">
                                                {getUserActivity(uid).length === 0 ? (
                                                  <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                                                    <p className="text-white/80 font-semibold">No activity found.</p>
                                                    <p className="text-sm text-white/45 mt-1">
                                                      To show login/logout and goal money events, your USER app must save logs to{" "}
                                                      <span className="text-white/70 font-semibold">
                                                        localStorage key: activity:{u?.email?.toLowerCase()}
                                                      </span>{" "}
                                                      (or backend endpoint).
                                                    </p>
                                                  </div>
                                                ) : (
                                                  <div className="space-y-2">
                                                    {filteredActivity(uid).map((a) => (
                                                      <div key={a.id} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
                                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                          <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                              <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", activityBadge(a)].join(" ")}>
                                                                {activityKind(a).toUpperCase()}
                                                              </span>
                                                              <p className="text-sm font-semibold text-white/90 break-words">
                                                                {formatAction(a)}
                                                              </p>
                                                            </div>

                                                            {/* show money/time details if present */}
                                                            <div className="mt-1 text-xs text-white/55 space-y-1">
                                                              {(a?.meta?.goalTitle || a?.meta?.title) && (
                                                                <p>
                                                                  <span className="text-white/40">Goal:</span>{" "}
                                                                  <span className="text-white/80 font-semibold">
                                                                    {a?.meta?.goalTitle || a?.meta?.title}
                                                                  </span>
                                                                </p>
                                                              )}
                                                              {(a?.meta?.target_amount != null || a?.meta?.saved_amount != null || a?.meta?.amount != null) && (
                                                                <p className="flex flex-wrap gap-x-3 gap-y-1">
                                                                  {a?.meta?.target_amount != null && (
                                                                    <span>
                                                                      <span className="text-white/40">Target:</span>{" "}
                                                                      <span className="text-white/80 font-semibold">₹{toINR(a.meta.target_amount)}</span>
                                                                    </span>
                                                                  )}
                                                                  {a?.meta?.saved_amount != null && (
                                                                    <span>
                                                                      <span className="text-white/40">Saved:</span>{" "}
                                                                      <span className="text-white/80 font-semibold">₹{toINR(a.meta.saved_amount)}</span>
                                                                    </span>
                                                                  )}
                                                                  {a?.meta?.amount != null && (
                                                                    <span>
                                                                      <span className="text-white/40">Amount:</span>{" "}
                                                                      <span className="text-white/80 font-semibold">₹{toINR(a.meta.amount)}</span>
                                                                    </span>
                                                                  )}
                                                                </p>
                                                              )}
                                                            </div>
                                                          </div>

                                                          <div className="text-xs text-white/45 shrink-0">
                                                            {new Date(a.ts).toLocaleString()}
                                                          </div>
                                                        </div>

                                                        {/* show meta for debugging */}
                                                        {a.meta && Object.keys(a.meta).length > 0 && (
                                                          <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-white/60 bg-black/20 rounded-xl p-2 ring-1 ring-white/10">
                                                            {JSON.stringify(a.meta, null, 2)}
                                                          </pre>
                                                        )}
                                                      </div>
                                                    ))}
                                                    <p className="text-xs text-white/35">Showing latest 80 entries after filters.</p>
                                                  </div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports */}
          {tab === "reports" && (
            <div className="mt-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/80">Summary Report</p>
                      <p className="mt-1 text-xs text-white/50">Auto-generated</p>
                    </div>
                    <button
                      onClick={exportJSON}
                      className="rounded-xl bg-amber-400/15 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-400/30 hover:bg-amber-400/20"
                    >
                      Export JSON
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniStat label="Users" value={stats.totalUsers} />
                    <MiniStat label="Active Portfolios" value={stats.activePortfolios} />
                    <MiniStat label="Total Goals" value={stats.totalGoals} />
                    <MiniStat label="Overall Progress" value={`${stats.pct}%`} />
                  </div>
                </Panel>

                <Panel>
                  <p className="text-sm font-semibold text-white/80">Top Savers</p>
                  <div className="mt-3 space-y-2">
                    {topSavers.length === 0 ? (
                      <p className="text-sm text-white/50">No user data available yet.</p>
                    ) : (
                      topSavers.map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.name}</p>
                            <p className="text-xs text-white/45 truncate">{r.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">₹{toINR(r.saved)}</p>
                            <p className="text-xs text-white/45">{r.goals} goals • {r.pct}%</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Panel>
              </div>

              <div className="mt-4">
                <Panel>
                  <p className="text-sm font-semibold text-white/80">Notes</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-white/55 space-y-1">
                    <li>To show user login/logout + goal money logs, your USER frontend must write activity events.</li>
                    <li>Admin reads from localStorage <code className="text-white/70">activity:&lt;email&gt;</code> or backend endpoint (optional).</li>
                  </ul>
                </Panel>
              </div>
            </div>
          )}

          <div className="mt-10 pb-6 text-center text-xs text-white/35">
            © {new Date().getFullYear()} WealthTrack • Admin Panel
          </div>

          {/* ✅ COPY-PASTE HELP (User-side activity logger) */}
          <div className="mt-4 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
            <p className="text-sm font-semibold text-white/85">User Activity Logging (Required)</p>
            <p className="mt-1 text-xs text-white/55">
              Your Admin panel will show login/logout + goal set time + money only if your USER pages save logs.
              Add this helper somewhere in your user dashboard code and call it on login/logout/goal actions:
            </p>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-white/70 bg-black/20 rounded-xl p-3 ring-1 ring-white/10">{`// Put in: src/utils/activity.js (or anywhere)
// Use key: activity:<email>  (AdminDashboard reads it)
export function logUserActivity(email, action, meta = {}) {
  const key = \`activity:\${String(email || "").toLowerCase()}\`;
  const entry = {
    id: \`\${Date.now()}-\${Math.random().toString(16).slice(2)}\`,
    ts: new Date().toISOString(),
    action,              // e.g. "USER_LOGIN", "USER_LOGOUT", "USER_ADD_GOAL", "USER_SAVE_MONEY"
    actor: "user",
    meta,                // include goalTitle, target_amount, saved_amount, amount, etc.
  };
  let prev = [];
  try { prev = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
  const next = [entry, ...prev].slice(0, 300);
  localStorage.setItem(key, JSON.stringify(next));
}

// EXAMPLES:
// after successful login:
logUserActivity(email, "USER_LOGIN", { device: navigator.userAgent });

// on logout:
logUserActivity(email, "USER_LOGOUT", {});

// on goal create:
logUserActivity(email, "USER_ADD_GOAL", { goalTitle: title, target_amount, saved_amount });

// when user adds money to goal:
logUserActivity(email, "USER_SAVE_MONEY", { goalTitle: title, amount: addedAmount, saved_amount: newSaved, target_amount });
`}</pre>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */
function SideBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition",
        active
          ? "bg-amber-400 text-black ring-amber-300 shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
          : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      <span className={active ? "text-black" : "text-white/70"}>{icon}</span>
      <span className="text-left">{label}</span>
    </button>
  );
}

function Panel({ children }) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 md:p-5 backdrop-blur-xl">
      {children}
    </div>
  );
}

function DarkStatCard({ title, value, icon, accent = "amber" }) {
  const accentMap = {
    amber: "text-amber-200 ring-amber-400/25 bg-amber-400/10",
    emerald: "text-emerald-200 ring-emerald-400/25 bg-emerald-400/10",
    rose: "text-rose-200 ring-rose-400/25 bg-rose-400/10",
  };
  const badge = accentMap[accent] || accentMap.amber;

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/55">{title}</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight">{value}</p>
        </div>
        <div className={["h-12 w-12 rounded-2xl ring-1 flex items-center justify-center", badge].join(" ")}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-white/90">{value}</p>
    </div>
  );
}

/* ---------------- Minimal Icons (no extra libs) ---------------- */
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconUsersBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" />
      <path d="M8 17V9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 17V7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 17v-4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
