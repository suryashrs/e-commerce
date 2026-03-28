import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_products: 0,
        total_orders: 0,
        total_sales: 0,
        recent_orders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/stats.php`);
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-white">Loading dashboard...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Total Sales</h3>
                    <p className="text-3xl font-bold text-white">Rs {parseFloat(stats.total_sales).toFixed(2)}</p>
                    <span className="text-green-500 text-sm font-medium mt-2 inline-block">Real-time Data</span>
                </div>

                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Total Orders</h3>
                    <p className="text-3xl font-bold text-white">{stats.total_orders}</p>
                    <span className="text-yellow-500 text-sm font-medium mt-2 inline-block">View details in Orders</span>
                </div>

                <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
                    <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Total Products</h3>
                    <p className="text-3xl font-bold text-white">{stats.total_products}</p>
                    <span className="text-blue-500 text-sm font-medium mt-2 inline-block">Manage in Products</span>
                </div>
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
                <div className="space-y-4">
                    {stats.recent_orders.length > 0 ? (
                        stats.recent_orders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                                <div>
                                    <p className="font-semibold text-white">Order #{order.id}</p>
                                    <p className="text-sm text-gray-400">Placed by {order.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-white">Rs {parseFloat(order.total_amount).toFixed(2)}</p>
                                    <span className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">No recent orders found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
