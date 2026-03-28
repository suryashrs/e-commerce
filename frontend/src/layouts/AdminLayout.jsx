import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
    const location = useLocation();
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin') {
                navigate("/admin/login");
            }
        }
    }, [user, loading, navigate]);

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

    const isActive = (path) => {
        return location.pathname === path ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white";
    };

    return (
        <div className="flex min-h-screen bg-gray-900 text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-black border-r border-gray-800 flex flex-col fixed h-full z-10">
                <div className="flex items-center justify-center h-20 border-b border-gray-800">
                    <h1 className="text-2xl font-bold tracking-wider">WEARITNOW</h1>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link
                        to="/admin"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/admin")}`}
                    >
                        <span className="mr-3 text-lg">📊</span>
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                        to="/admin/products"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/admin/products")}`}
                    >
                        <span className="mr-3 text-lg">🛍️</span>
                        <span className="font-medium">Products</span>
                    </Link>
                    <Link
                        to="/admin/orders"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive("/admin/orders")}`}
                    >
                        <span className="mr-3 text-lg">📦</span>
                        <span className="font-medium">Orders</span>
                    </Link>
                    <Link
                        to="/"
                        className="flex items-center px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors mt-8"
                    >
                        <span className="mr-3 text-lg">🏠</span>
                        <span className="font-medium">Main Site</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
