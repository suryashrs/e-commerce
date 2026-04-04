import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { 
    Users, 
    ShoppingCart, 
    Package, 
    DollarSign, 
    TrendingUp, 
    Store, 
    ShieldCheck, 
    AlertCircle,
    CheckCircle2,
    XCircle,
    ArrowUpRight
} from "lucide-react";
import axios from "axios";

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_products: 0,
        total_orders: 0,
        total_revenue: 0,
        total_users: 0,
        pending_shops: 0,
        recent_orders: []
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/stats.php`);
            if (res.data.status === 200) {
                setStats(res.data.body);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setLoading(false);
        }
    };

    const handleAction = (action, text) => {
        setMessage({ type: 'success', text: `${text} action successful.` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldCheck size={48} className="mb-4 text-indigo-500" />
                    <p className="font-bold tracking-widest text-xs uppercase">Authenticating Shield...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">Command Center</h1>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mt-2">Platform Administration / Dashboard</p>
                </div>
                <div className="flex space-x-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Global Systems Online</span>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className="bg-white p-4 rounded-2xl flex items-center space-x-3 border-l-4 border-black animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 size={18} />
                    <p className="font-bold text-sm text-black">{message.text}</p>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Platform Revenue', value: `Rs ${stats.total_revenue}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Active Users', value: stats.total_users, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Shop Requests', value: stats.pending_shops, icon: Store, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Total Volume', value: stats.total_orders, icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-8 rounded-[2.5rem] hover:border-indigo-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <TrendingUp className="text-gray-600 group-hover:text-emerald-400 transition-colors" size={16} />
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                        <h4 className="text-3xl font-black text-white">{stat.value}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* User & Shop Management Toggles */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-10 rounded-[3rem]">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center">
                            <Store className="mr-3 text-amber-400" size={24} /> Shop Approvals
                        </h3>
                        {stats.pending_shops > 0 ? (
                            <div className="space-y-6">
                                <p className="text-gray-400 text-sm">There are <span className="text-white font-bold">{stats.pending_shops}</span> merchant shops waiting for global approval.</p>
                                <button 
                                    onClick={() => handleAction('approve', 'Merchant Approval')}
                                    className="w-full py-4 bg-amber-400 text-black rounded-2xl font-black text-xs hover:bg-amber-300 transition shadow-xl"
                                >
                                    Open Approval Queue
                                </button>
                            </div>
                        ) : (
                            <div className="p-8 border border-dashed border-gray-700 rounded-3xl text-center">
                                <CheckCircle2 size={32} className="mx-auto mb-4 text-emerald-500/50" />
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Queue Clear</p>
                                <p className="text-gray-600 text-[10px] mt-2">All shops are up to date.</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-10 rounded-[3rem]">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center">
                            <AlertCircle size={24} className="mr-3 text-rose-400" /> Restrictions
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Self-Purchase Prevention', status: 'Active' },
                                { label: 'Cross-Role Checkouts', status: 'Restricted' },
                                { label: 'Global Fee Structure', status: '5.2%' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[10px] font-black text-white px-2 py-1 bg-gray-700 rounded-lg">{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Transaction Activity */}
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-[3rem] overflow-hidden">
                    <div className="p-10 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Global Activity</h3>
                        <button className="text-xs font-black text-indigo-400 hover:text-white transition">Full Ledger</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <tr>
                                    <th className="px-10 py-6">ID</th>
                                    <th className="px-10 py-6">Operator</th>
                                    <th className="px-10 py-6">Volume</th>
                                    <th className="px-10 py-6">Status</th>
                                    <th className="px-10 py-6">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {stats.recent_orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-indigo-500/5 transition group">
                                        <td className="px-10 py-6 text-indigo-400 font-bold text-sm">#{order.id}</td>
                                        <td className="px-10 py-6 text-white font-bold text-sm">{order.name}</td>
                                        <td className="px-10 py-6 text-white font-black text-sm">Rs {order.total_amount}</td>
                                        <td className="px-10 py-6">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-6 text-gray-500 text-xs font-bold">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
