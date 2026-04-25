import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { 
    Trash2, 
    Star, 
    MessageSquare, 
    ShieldAlert, 
    User, 
    Package,
    Calendar,
    MessageCircle,
    CheckCircle
} from "lucide-react";

const AdminReviews = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

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

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Mark this review as deleted? It will be hidden from buyers/sellers but remain in history.")) return;
        
        setActionLoading(id);
        try {
            await axios.post(`${API_BASE_URL}/reviews/admin_delete.php`, { 
                review_id: id,
                admin_id: user.id 
            });
            // Update local state instead of refetching
            setReviews(reviews.map(r => r.id === id ? { ...r, status: 'deleted' } : r));
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
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
                                <th className="px-8 py-6">User & Rating</th>
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
                                                        <Star 
                                                            key={i} 
                                                            size={10} 
                                                            fill={i < review.rating ? "currentColor" : "none"} 
                                                            className={i < review.rating ? "text-amber-500" : "text-gray-600"}
                                                        />
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
                                            <p className="text-gray-400 italic leading-relaxed text-xs">
                                                "{review.comment}"
                                            </p>
                                            {review.seller_reply && (
                                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                        <MessageCircle size={10} /> Merchant Reply
                                                    </p>
                                                    <p className="text-gray-500 text-[11px] leading-snug">
                                                        {review.seller_reply}
                                                    </p>
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
                                                    onClick={() => handleDelete(review.id)}
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
    );
};

export default AdminReviews;
