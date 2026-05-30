import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { Flag, Trash2, Package, CheckCircle, AlertTriangle, Eye, EyeOff, XCircle, X } from "lucide-react";

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
const AdminProducts = () => {
    const [products, setProducts] = useState([]);
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

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/read.php?admin=true`);
            if (response.data.status === 200 || Array.isArray(response.data)) {
                setProducts(Array.isArray(response.data) ? response.data : response.data.body);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleToggleFlag = async (id) => {
        setActionLoading(id);
        try {
            await axios.post(`${API_BASE_URL}/admin/flag_product.php`, { id });
            setProducts(products.map(p => p.id === id ? { ...p, is_flagged: !p.is_flagged } : p));
            addToast('Product flag status updated.', 'success');
        } catch (err) {
            console.error("Flagging failed:", err);
            addToast('Failed to toggle product flag.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            productId: id,
            title: 'Delete Product?',
            message: 'This will permanently remove the product from the platform. This action cannot be undone.',
            confirmLabel: 'Yes, Delete'
        });
    };

    const executeDelete = async () => {
        const id = confirmModal.productId;
        setConfirmModal(null);
        try {
            await axios.delete(`${API_BASE_URL}/products/manage.php`, { data: { id } });
            setProducts(products.filter(p => p.id !== id));
            addToast('Product deleted successfully.', 'success');
        } catch (error) {
            console.error("Error deleting product:", error);
            addToast('Failed to delete product.', 'error');
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

            <div className="space-y-8 animate-fade-in">
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Global Inventory</h1>
                        <p className="text-gray-400 mt-1">Review, flag, or moderate all platform listings.</p>
                    </div>
                </header>

                <div className="bg-gray-800/20 backdrop-blur-md border border-gray-700/50 rounded-[2.5rem] overflow-hidden">
                    <div className="overflow-x-auto text-sm">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    <th className="px-8 py-6">Product &amp; Seller</th>
                                    <th className="px-8 py-6">Category</th>
                                    <th className="px-8 py-6">Price</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/10">
                                {products.length > 0 ? products.map((product) => (
                                    <tr key={product.id} className={`group transition-all ${product.is_flagged ? 'bg-red-500/5' : 'hover:bg-gray-700/30'}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className={`w-14 h-14 rounded-2xl object-cover shadow-xl border-2 ${product.is_flagged ? 'border-red-500/50' : 'border-gray-700'}`}
                                                    />
                                                    {product.is_flagged && (
                                                        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg">
                                                            <AlertTriangle size={10} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base leading-tight mb-1">{product.name}</p>
                                                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        {product.seller_name || 'Anonymous Seller'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-bold uppercase text-[10px] tracking-widest">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-white font-black text-base">
                                            Rs. {parseFloat(product.price).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            {product.is_flagged ? (
                                                <span className="flex items-center gap-2 text-red-500 font-bold uppercase text-[10px] tracking-wider">
                                                    <EyeOff size={14} /> Flagged
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-emerald-500 font-bold uppercase text-[10px] tracking-wider">
                                                    <Eye size={14} /> Visible
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                <button
                                                    onClick={() => handleToggleFlag(product.id)}
                                                    disabled={actionLoading === product.id}
                                                    className={`p-3 rounded-xl transition shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                                        product.is_flagged
                                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                        : 'bg-black text-white hover:bg-zinc-800'
                                                    }`}
                                                    title={product.is_flagged ? "Unflag Item" : "Flag Violation"}
                                                >
                                                    <Flag size={14} strokeWidth={3} />
                                                    {product.is_flagged ? 'Unflag' : 'Flag'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition shadow-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-20 text-center">
                                            <div className="bg-gray-800/30 inline-flex p-6 rounded-full mb-4">
                                                <Package className="text-gray-600" size={32} />
                                            </div>
                                            <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">No items found in global feed</p>
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

export default AdminProducts;
