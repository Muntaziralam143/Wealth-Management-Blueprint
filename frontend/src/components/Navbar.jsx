import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const logout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="w-full border-b border-white/10 bg-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="font-bold text-lg">Wealth Manager</h1>

                <div className="flex gap-3 items-center">
                    {token && role === "user" && (
                        <Link to="/dashboard" className="hover:underline">
                            Dashboard
                        </Link>
                    )}

                    {token && role === "admin" && (
                        <Link to="/admin-dashboard" className="hover:underline">
                            Admin
                        </Link>
                    )}

                    {token && (
                        <button
                            onClick={logout}
                            className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
