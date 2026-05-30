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
    MapPin,
    CheckCircle,
    AlertTriangle,
    X
} from "lucide-react";

/* ─── Toast Component ───────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
            <div
                key={t.id}
                className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold pointer-events-auto
                    animate-in slide-in-from-right-8 fade-in duration-300
                    ${t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100' :
                      t.type === 'error'   ? 'bg-rose-900/90 border-rose-500/40 text-rose-100' :
                                             'bg-gray-800/90 border-gray-600/40 text-gray-100'}`}
            >
                {t.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                {t.type === 'error'   && <XCircle    size={18} className="text-rose-400 shrink-0" />}
                <span>{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100 transition">
                    <X size={14} />
                </button>
            </div>
        ))}
    </div>
);

/* ─── Confirm Modal Component ───────────────────────────────────── */
const ConfirmModal = ({ config, onConfirm, onCancel }) => {
    if (!config) return null;
    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5
                    ${config.type === 'approve' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                    {config.type === 'approve'
                        ? <ShieldCheck size={32} className="text-emerald-400" />
                        : <AlertTriangle size={32} className="text-rose-400" />}
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">{config.title}</h3>
                <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">{config.message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-[2] py-3 rounded-xl font-bold text-white transition shadow-lg
                            ${config.type === 'approve'
                                ? 'bg-emerald-600 hover:bg-emerald-500'
                                : 'bg-rose-600 hover:bg-rose-500'}`}
                    >
                        {config.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ────────────────────────────────────────────── */
const AdminSellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null); // { sellerId, status, type, title, message, confirmLabel }

    /* Toast helpers */
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const fetchSellers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/pending_sellers.php`);
            if (Array.isArray(response.data)) {
                setSellers(response.data);
            } else if (response.data.status === 200) {
                setSellers(response.data.body);
            }
        } catch (err) {
            console.error("Failed to fetch pending sellers:", err);
            addToast("Failed to load seller requests.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();
    }, []);

    /* Open the confirm modal instead of window.confirm */
    const handleAction = (seller, status) => {
        const isApprove = status === 'approved';
        setConfirmModal({
            sellerId: seller.id,
            status,
            type: isApprove ? 'approve' : 'reject',
            title: isApprove ? 'Approve this Shop?' : 'Reject this Shop?',
            message: isApprove
                ? `You are about to approve "${seller.shop_name || seller.name}". They will receive an email & notification.`
                : `You are about to reject the application from "${seller.shop_name || seller.name}". This cannot be undone.`,
            confirmLabel: isApprove ? 'Yes, Approve' : 'Yes, Reject'
        });
    };

    /* Called when user clicks confirm inside the modal */
    const executeAction = async () => {
        const { sellerId, status } = confirmModal;
        setConfirmModal(null);
        setActionLoading(sellerId);
        try {
            await axios.post(`${API_BASE_URL}/admin/update_shop_status.php`, { id: sellerId, status });
            setSellers(prev => prev.filter(s => s.id !== sellerId));
            addToast(
                status === 'approved'
                    ? '✅ Shop approved! Seller has been notified via email.'
                    : '🚫 Shop application rejected.',
                status === 'approved' ? 'success' : 'error'
            );
        } catch (err) {
            console.error("Update failed:", err);
            addToast("Failed to update status. Please try again.", "error");
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
        <>
            {/* Toast notifications */}
            <Toast toasts={toasts} removeToast={removeToast} />

            {/* Confirm modal */}
            <ConfirmModal
                config={confirmModal}
                onConfirm={executeAction}
                onCancel={() => setConfirmModal(null)}
            />

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
                                        onClick={() => handleAction(seller, 'approved')}
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
                                        onClick={() => handleAction(seller, 'none')}
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
        </>
    );
};

export default AdminSellers;
