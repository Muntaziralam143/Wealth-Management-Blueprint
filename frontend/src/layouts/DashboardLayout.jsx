import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const currentUserEmail = localStorage.getItem("currentUserEmail") || "guest";

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("currentUserEmail");
        navigate("/login");
    };

    const linkClass = ({ isActive }) =>
        `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition
     ${isActive ? "bg-indigo-600 text-white shadow" : "bg-white/60 text-indigo-900 hover:bg-white"}`;

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
                {/* top header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-indigo-950">
                            User Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Welcome: <span className="font-semibold text-indigo-800">{currentUserEmail}</span>
                        </p>
                    </div>

                    <button
                        onClick={logout}
                        className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                    >
                        Logout
                    </button>
                </div>

                {/* layout */}
                <div className="mt-6 grid gap-4 lg:grid-cols-12">
                    {/* sidebar */}
                    <aside className="lg:col-span-3">
                        <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-xl ring-1 ring-indigo-100 p-4">
                            <nav className="space-y-3">
                                <NavLink to="/dashboard" end className={linkClass}>
                                    <span>Goals</span>
                                    <span className="text-xs opacity-70">Home</span>
                                </NavLink>

                                <NavLink to="/dashboard/portfolio" className={linkClass}>
                                    <span>Portfolio</span>
                                    <span className="text-xs opacity-70">Details</span>
                                </NavLink>

                                <NavLink to="/dashboard/simulations" className={linkClass}>
                                    <span>Simulator</span>
                                    <span className="text-xs opacity-70">Plan</span>
                                </NavLink>
                            </nav>
                        </div>
                    </aside>

                    {/* page content */}
                    <main className="lg:col-span-9">
                        <Outlet />
                    </main>
                </div>

                <div className="mt-10 pb-8 text-center text-xs text-slate-500">
                    © {new Date().getFullYear()} WealthTrack • Dashboard
                </div>
            </div>
        </div>
    );
}
