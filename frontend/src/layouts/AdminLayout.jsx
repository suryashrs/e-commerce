import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Home, 
    ChevronRight, 
    ShieldCheck, 
    Bell,
    Settings,
    LogOut,
    ArrowLeft,
    Star,
    Users
} from "lucide-react";

const AdminLayout = () => {
    const location = useLocation();
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin') {
                navigate("/admin/login");
            }
        }
    }, [user, loading, navigate]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
    );

    // Prevent rendering the admin layout if the user is not authenticated or not an admin
    if (!user || user.role !== 'admin') return null;

    const navItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Command Center" },
        { path: "/admin/sellers", icon: ShieldCheck, label: "Shop Requests" },
        { path: "/admin/users", icon: Users, label: "Account Control" },
        { path: "/admin/products", icon: Package, label: "Global Inventory" },
        { path: "/admin/reviews", icon: Star, label: "Global Reviews" },
        { path: "/admin/orders", icon: ShoppingCart, label: "Full Ledger" }
    ];

    return (
        <div className="flex min-h-screen bg-black text-gray-400 font-sans selection:bg-indigo-500/30">
            {/* HUD Sidebar */}
            <aside className="w-80 border-r border-white/5 flex flex-col fixed h-full z-50 bg-black/80 backdrop-blur-3xl">
                <div className="p-10 border-b border-white/5">
                    <div className="flex items-center space-x-3 mb-2">
                        <ShieldCheck className="text-indigo-500" size={24} />
                        <h1 className="text-xl font-black tracking-tighter text-white italic">ADMIN PANEL</h1>
                    </div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Global Operations Console</p>
                </div>

                <nav className="flex-1 px-6 py-10 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-between px-6 py-4 rounded-3xl transition-all duration-300 group ${
                                location.pathname === item.path 
                                ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20" 
                                : "hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center">
                                <item.icon size={18} className="mr-4" />
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </div>
                            {location.pathname === item.path && <ChevronRight size={14} className="opacity-50" />}
                        </Link>
                    ))}

                    <div className="pt-10 mt-10 border-t border-white/5">
                        <Link
                            to="/"
                            className="flex items-center px-6 py-4 rounded-3xl text-gray-600 hover:text-white transition-all space-x-4"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-bold text-sm">Return to Site</span>
                        </Link>
                    </div>
                </nav>

                <div className="p-8 border-t border-white/5 bg-white/2 overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center space-x-4 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-black text-white truncate">{user.name}</p>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Root Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Viewport */}
            <main className="flex-1 ml-80 min-h-screen bg-black">
                {/* HUD Top Bar */}
                <div className="sticky top-0 h-24 border-b border-white/5 flex items-center justify-between px-10 bg-black/50 backdrop-blur-md z-40">
                    <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5 text-[10px] font-black tracking-widest text-gray-500">
                        SYSTEM VERSION: 2.4.0-STABLE
                    </div>
                    <div className="flex items-center space-x-6">
                        <button className="text-gray-500 hover:text-indigo-400 transition relative">
                            <Bell size={20} />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
                        </button>
                        <button className="text-gray-500 hover:text-white transition">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {/* Background Light Effects */}
                    <div className="absolute top-0 right-0 w-1/2 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="relative z-10">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
