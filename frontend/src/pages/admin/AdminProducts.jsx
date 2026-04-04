import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { 
    Flag, 
    Trash2, 
    Package, 
    MoreHorizontal, 
    CheckCircle, 
    AlertTriangle,
    Eye,
    EyeOff
} from "lucide-react";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchProducts = async () => {
        try {
            // Updated to fetch ALL products including flagged ones
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

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleToggleFlag = async (id) => {
        setActionLoading(id);
        try {
            await axios.post(`${API_BASE_URL}/admin/flag_product.php`, { id });
            setProducts(products.map(p => p.id === id ? { ...p, is_flagged: !p.is_flagged } : p));
        } catch (err) {
            console.error("Flagging failed:", err);
            alert("Failed to toggle product flag.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this product?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/products/manage.php`, { data: { id } });
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
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
                                <th className="px-8 py-6">Product & Seller</th>
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
                                                    : 'bg-amber-500 text-white hover:bg-amber-600'
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
    );
};

export default AdminProducts;
