import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { 
    CheckCircle2, 
    XCircle, 
    UserPlus, 
    Mail, 
    Clock, 
    ShieldCheck,
    Phone,
    MapPin
} from "lucide-react";

const AdminSellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchSellers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/pending_sellers.php`);
            // My new API returns an array, the old one might have had a wrapper.
            // Check for both.
            if (Array.isArray(response.data)) {
                setSellers(response.data);
            } else if (response.data.status === 200) {
                setSellers(response.data.body);
            }
        } catch (err) {
            console.error("Failed to fetch pending sellers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    const handleAction = async (id, status) => {
        if (!window.confirm(`${status === 'approved' ? 'Approve' : 'Reject'} this shop?`)) return;
        setActionLoading(id);
        try {
            // Using update_shop_status.php which I created
            await axios.post(`${API_BASE_URL}/admin/update_shop_status.php`, { 
                id, 
                status: status 
            });
            setSellers(prev => prev.filter(s => s.id !== id));
            alert(`Seller ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
        } catch (err) {
            console.error("Update failed:", err);
            alert("Failed to update status.");
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Shop Requests</h1>
                    <p className="text-gray-400 mt-1">Review and approve new seller registrations.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {sellers.length > 0 ? (
                    sellers.map((seller) => (
                        <div key={seller.id} className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-[2.5rem] p-10 group hover:border-indigo-500/30 transition-all shadow-2xl relative overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
                                        <UserPlus className="text-indigo-500" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{seller.shop_name || 'No Shop Name'}</h3>
                                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">{seller.name}</p>
                                    </div>
                                </div>
                                <span className="bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-amber-500/20">
                                    Pending
                                </span>
                            </div>
                            
                            {/* Shop Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Shop Number</p>
                                        <p className="text-sm font-bold text-gray-300">{seller.shop_number || "Not provided"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Email Address</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                            <Mail size={14} className="text-gray-600" />
                                            <span>{seller.email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone Number</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                            <Phone size={14} className="text-gray-600" />
                                            <span>{seller.shop_phone || "Not provided"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Application Date</p>
                                        <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                            <Clock size={14} className="text-gray-600" />
                                            <span>{new Date(seller.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-full space-y-1 pt-2 border-t border-gray-700/50">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Physical Address</p>
                                    <div className="flex items-start gap-2 text-sm font-bold text-gray-300">
                                        <MapPin size={14} className="text-gray-600 mt-1 shrink-0" />
                                        <p>{seller.shop_address || "Not provided"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleAction(seller.id, 'approved')}
                                    disabled={actionLoading === seller.id}
                                    className="flex-[2] bg-white text-black font-black py-4 px-6 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading === seller.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} />
                                            <span>Approve Shop</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleAction(seller.id, 'none')}
                                    disabled={actionLoading === seller.id}
                                    className="flex-1 bg-gray-800 text-gray-400 font-black py-4 px-6 rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-gray-700"
                                >
                                    {actionLoading === seller.id ? '...' : (
                                        <>
                                            <XCircle size={20} />
                                            <span>Reject</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-32 text-center bg-gray-800/10 rounded-[3.5rem] border border-dashed border-gray-700/50 transition-all hover:bg-gray-800/20">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle2 className="text-gray-600" size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-400 tracking-tight">System Fully Updated!</h3>
                        <p className="text-gray-600 font-medium max-w-sm mx-auto mt-2">There are currently no new merchant applications awaiting review.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSellers;
