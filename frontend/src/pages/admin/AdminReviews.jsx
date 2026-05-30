import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { Trash2, Star, ShieldAlert, MessageCircle, CheckCircle, AlertTriangle, XCircle, X } from "lucide-react";

/* ─── Toast ──────────────────────────────────────────────────────── */
const Toast = ({ toasts, removeToast }) => (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300
                ${t.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/40 text-emerald-100' :
                  t.type === 'error'   ? 'bg-rose-900/90 border-rose-500/40 text-rose-100' :
                                         'bg-gray-800/90 border-gray-600/40 text-gray-100'}`}>
                {t.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
                {t.type === 'error'   && <XCircle size={18} className="text-rose-400 shrink-0" />}
                <span>{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100 transition"><X size={14} /></button>
            </div>
        ))}
    </div>
);

/* ─── Confirm Modal ──────────────────────────────────────────────── */
const ConfirmModal = ({ config, onConfirm, onCancel }) => {
    if (!config) return null;
    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/15 flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle size={32} className="text-rose-400" />
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">{config.title}</h3>
                <p className="text-gray-400 text-center text-sm mb-8 leading-relaxed">{config.message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition">Cancel</button>
                    <button onClick={onConfirm} className="flex-[2] py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg">{config.confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────── */
const AdminReviews = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [toasts, setToasts] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    const fetchReviews = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reviews/admin_reviews.php`);
            if (response.data.records) {
                setReviews(response.data.records);
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleDelete = (review) => {
        setConfirmModal({
            reviewId: review.id,
            title: 'Delete Review?',
            message: `Mark this review by "${review.user_name}" as deleted? It will be hidden from buyers/sellers but remain in history.`,
            confirmLabel: 'Yes, Delete'
        });
    };

    const executeDelete = async () => {
        const id = confirmModal.reviewId;
        setConfirmModal(null);
        setActionLoading(id);
        try {
            await axios.post(`${API_BASE_URL}/reviews/admin_delete.php`, { review_id: id, admin_id: user.id });
            setReviews(reviews.map(r => r.id === id ? { ...r, status: 'deleted' } : r));
            addToast('Review has been removed from the platform.', 'success');
        } catch (error) {
            console.error("Error deleting review:", error);
            addToast('Failed to delete review.', 'error');
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
            <Toast toasts={toasts} removeToast={removeToast} />
            <ConfirmModal config={confirmModal} onConfirm={executeDelete} onCancel={() => setConfirmModal(null)} />

            <div className="space-y-8 animate-fade-in pb-12">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Review Content Moderation</h1>
                        <p className="text-gray-400 mt-1">Monitor quality, flag abuse, and remove spam across the platform.</p>
                    </div>
                </header>

                <div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/50 rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <th className="px-8 py-6">User &amp; Rating</th>
                                    <th className="px-8 py-6">Product</th>
                                    <th className="px-8 py-6">Commentary</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/10">
                                {reviews.length > 0 ? reviews.map((review) => (
                                    <tr key={review.id} className={`group transition-all ${review.status === 'deleted' ? 'bg-red-500/5 opacity-60' : 'hover:bg-gray-700/30'}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-700 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xl border border-gray-600">
                                                    {review.user_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base leading-tight mb-1">{review.user_name}</p>
                                                    <div className="flex gap-0.5 text-amber-500">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-500" : "text-gray-600"} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-0.5">#{review.product_id}</span>
                                                <span className="text-gray-300 font-medium line-clamp-1">{review.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 max-w-md">
                                            <div className="space-y-2">
                                                <p className="text-gray-400 italic leading-relaxed text-xs">"{review.comment}"</p>
                                                {review.seller_reply && (
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                            <MessageCircle size={10} /> Merchant Reply
                                                        </p>
                                                        <p className="text-gray-500 text-[11px] leading-snug">{review.seller_reply}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {review.status === 'deleted' ? (
                                                <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-widest flex items-center gap-1 w-fit">
                                                    <ShieldAlert size={12} /> Deleted
                                                </span>
                                            ) : (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black uppercase text-[9px] tracking-widest flex items-center gap-1 w-fit">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                {review.status !== 'deleted' && (
                                                    <button
                                                        onClick={() => handleDelete(review)}
                                                        disabled={actionLoading === review.id}
                                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                                        title="Remove Abusive Content"
                                                    >
                                                        <Trash2 size={14} />
                                                        {actionLoading === review.id ? 'Removing...' : 'Delete'}
                                                    </button>
                                                )}
                                                <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                                                    ID: {review.id}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="bg-gray-800/30 inline-flex p-6 rounded-full mb-4">
                                                <Star className="text-gray-600" size={32} />
                                            </div>
                                            <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">No reviews in digital history</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminReviews;
