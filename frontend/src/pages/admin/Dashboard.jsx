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
    ArrowUpRight,
    Eye,
    X
} from "lucide-react";
import axios from "axios";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Full Ledger State
    const [showLedger, setShowLedger] = useState(false);
    const [allOrders, setAllOrders] = useState([]);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [viewOrderDetails, setViewOrderDetails] = useState(null);
    const [ledgerSearch, setLedgerSearch] = useState('');

    useEffect(() => {
        fetchStats();
        fetchAllOrders();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/stats.php`);
            setStats(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setLoading(false);
        }
    };

    const fetchAllOrders = async () => {
        setLedgerLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/orders.php`);
            if (res.data.status === 200) {
                setAllOrders(res.data.body);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLedgerLoading(false);
        }
    };

    const handleOpenLedger = () => {
        setShowLedger(true);
    };

    const filteredOrders = allOrders.filter(order =>
        String(order.id).includes(ledgerSearch) ||
        order.customer_name?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        order.status?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        order.payment_method?.toLowerCase().includes(ledgerSearch.toLowerCase())
    );

    const statusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-400';
            case 'shipped': return 'bg-blue-500/10 text-blue-400';
            case 'cancelled': return 'bg-rose-500/10 text-rose-400';
            case 'completed': return 'bg-emerald-500/10 text-emerald-400';
            default: return 'bg-amber-500/10 text-amber-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldCheck size={48} className="mb-4 text-indigo-500" />
                    <p className="font-bold tracking-widest text-xs uppercase">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const counts = stats?.counts || {};
    const revenue = stats?.revenue || {};
    const recentActivity = stats?.recent_activity || [];

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
                    { label: 'Lifetime Revenue', value: `Rs ${revenue.lifetime?.toLocaleString() ?? 0}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Active Sellers', value: counts.active_sellers ?? 0, icon: Store, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Shop Requests', value: counts.pending_shops ?? 0, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Completed Orders', value: counts.completed_orders ?? 0, icon: ShoppingCart, color: 'text-purple-400', bg: 'bg-purple-500/10' }
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

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Today's Revenue", value: revenue.today, platform: revenue.platform_today },
                    { label: "7-Day Revenue", value: revenue.last7days, platform: revenue.platform_7days },
                    { label: "Platform Earnings", value: revenue.platform_lifetime, platform: null }
                ].map((item, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-3xl p-6">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{item.label}</p>
                        <p className="text-2xl font-black text-white">Rs {parseFloat(item.value ?? 0).toLocaleString()}</p>
                        {item.platform !== null && item.platform !== undefined && (
                            <p className="text-xs text-emerald-400 font-bold mt-1">Commission: Rs {parseFloat(item.platform).toLocaleString()}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Shop Approvals + Restrictions */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 p-10 rounded-[3rem]">
                        <h3 className="text-xl font-black text-white mb-8 flex items-center">
                            <Store className="mr-3 text-amber-400" size={24} /> Shop Approvals
                        </h3>
                        {(counts.pending_shops ?? 0) > 0 ? (
                            <div className="space-y-6">
                                <p className="text-gray-400 text-sm">There are <span className="text-white font-bold">{counts.pending_shops}</span> merchant shops waiting for approval.</p>
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
                                { label: 'Flagged Products', status: counts.flagged_products ?? 0 }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-[10px] font-black text-white px-2 py-1 bg-gray-700 rounded-lg">{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Global Activity / Full Ledger */}
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-[3rem] overflow-hidden">
                    <div className="p-10 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Global Activity</h3>
                        <button 
                            onClick={handleOpenLedger}
                            className="text-xs font-black text-indigo-400 hover:text-white transition flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full"
                        >
                            Full Ledger <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <tr>
                                    <th className="px-8 py-5">Order ID</th>
                                    <th className="px-8 py-5">Buyer</th>
                                    <th className="px-8 py-5">Amount</th>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {allOrders.length > 0 ? allOrders.slice(0, 8).map((order) => (
                                    <tr key={order.id} className="hover:bg-indigo-500/5 transition">
                                        <td className="px-8 py-5 font-mono text-indigo-400 font-bold text-sm">#{order.id}</td>
                                        <td className="px-8 py-5 text-white font-bold text-sm">{order.customer_name}</td>
                                        <td className="px-8 py-5 text-emerald-400 font-black text-sm">Rs {parseFloat(order.total_amount).toLocaleString()}</td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-gray-500 text-xs font-bold">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => setViewOrderDetails(order)}
                                                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition flex items-center gap-1.5 ml-auto"
                                            >
                                                <Eye size={13} /> View Details
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-16 text-center text-gray-600 font-bold text-sm">No recent orders</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ===== FULL LEDGER MODAL ===== */}
            {showLedger && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-6">
                    <div className="bg-gray-900 border border-gray-700 rounded-[2rem] w-full max-w-6xl my-8 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-8 border-b border-gray-700">
                            <div>
                                <h2 className="text-2xl font-black text-white">Full Order Ledger</h2>
                                <p className="text-gray-500 text-sm mt-1">{allOrders.length} total orders platform-wide</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={ledgerSearch}
                                    onChange={e => setLedgerSearch(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-56"
                                />
                                <button 
                                    onClick={() => setShowLedger(false)}
                                    className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {ledgerLoading ? (
                                <div className="py-24 text-center text-gray-500 font-bold">Loading orders...</div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="py-24 text-center text-gray-600 font-bold">No orders found.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-800/60 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 border-b border-gray-700">
                                        <tr>
                                            <th className="px-8 py-5">Order ID</th>
                                            <th className="px-8 py-5">Buyer</th>
                                            <th className="px-8 py-5">Email</th>
                                            <th className="px-8 py-5">Amount</th>
                                            <th className="px-8 py-5">Payment</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-800/40 transition group">
                                                <td className="px-8 py-5 font-mono text-indigo-400 font-bold text-sm">#{order.id}</td>
                                                <td className="px-8 py-5 text-white font-bold text-sm">{order.customer_name}</td>
                                                <td className="px-8 py-5 text-gray-400 text-xs">{order.customer_email ?? '—'}</td>
                                                <td className="px-8 py-5 text-emerald-400 font-black text-sm">Rs {parseFloat(order.total_amount).toLocaleString()}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tight ${order.payment_method === 'esewa' ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                                                        {order.payment_method === 'esewa' ? 'eSewa' : 'COD'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-gray-500 text-xs font-bold">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <button
                                                        onClick={() => setViewOrderDetails(order)}
                                                        className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition flex items-center gap-1.5 ml-auto"
                                                    >
                                                        <Eye size={13} /> View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ORDER DETAILS MODAL ===== */}
            {viewOrderDetails && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-900">
                                Order Details — <span className="font-mono text-gray-500">#{viewOrderDetails.id}</span>
                            </h2>
                            <button onClick={() => setViewOrderDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Info + Buyer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Order Information</h3>
                                    <div className="space-y-2.5">
                                        {[
                                            { label: 'Order ID', value: `#${viewOrderDetails.id}`, mono: true },
                                            { label: 'Status', value: viewOrderDetails.status, badge: true },
                                            { label: 'Order Date', value: new Date(viewOrderDetails.created_at).toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' }) },
                                            { label: 'Payment Method', value: viewOrderDetails.payment_method === 'esewa' ? 'eSewa' : 'Cash on Delivery' },
                                        ].map((row, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">{row.label}:</span>
                                                {row.badge ? (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                        viewOrderDetails.status?.toLowerCase() === 'delivered' || viewOrderDetails.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' :
                                                        viewOrderDetails.status?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                        viewOrderDetails.status?.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>{viewOrderDetails.status}</span>
                                                ) : (
                                                    <span className={`font-semibold text-gray-800 text-right ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Buyer Information</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="font-semibold text-gray-800">{viewOrderDetails.customer_name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Email:</span>
                                            <span className="font-semibold text-gray-800 text-right break-all">{viewOrderDetails.customer_email ?? '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                                    {viewOrderDetails.shipping_address || <span className="text-gray-400 italic">No address provided.</span>}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Order Items</h3>
                                <div className="space-y-3">
                                    {(viewOrderDetails.items || []).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                                            <img
                                                src={item.image_url}
                                                alt={item.product_name}
                                                className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm"
                                            />
                                            <div className="flex-grow">
                                                <p className="font-bold text-gray-900 text-sm">{item.product_name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Quantity: {item.quantity} × Rs. {parseFloat(item.item_price).toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-bold text-gray-900">Rs. {(item.quantity * item.item_price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="text-sm text-gray-500">Total Amount</span>
                                <span className="text-2xl font-black text-gray-900">Rs. {parseFloat(viewOrderDetails.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
