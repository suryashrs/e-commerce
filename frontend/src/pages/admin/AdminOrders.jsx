import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { 
    ChevronLeft, 
    ChevronRight, 
    ShoppingCart,
    Calendar,
    User,
    CreditCard,
    MoreHorizontal
} from "lucide-react";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/orders/read_all.php`);
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Reset to page 1 when changing items per page
    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            <p className="text-gray-500 text-sm font-bold animate-pulse">Loading Ledger...</p>
        </div>
    );

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-wrap justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShoppingCart className="text-indigo-500" size={24} />
                        Full Transaction Ledger
                    </h1>
                    <p className="text-gray-400 mt-1 text-[10px] uppercase tracking-widest font-bold">Comprehensive Order & Revenue History</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-2xl border border-gray-700">
                    <span className="text-[10px] font-black text-gray-500 uppercase ml-2">Rows:</span>
                    <select 
                        value={itemsPerPage} 
                        onChange={handleItemsPerPageChange}
                        className="bg-gray-900 border-none text-white text-xs font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </header>

            <div className="bg-gray-800/20 backdrop-blur-3xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Customer Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Net Total</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Transaction Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">More</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {currentItems.map((order) => (
                                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-gray-600 bg-black/40 px-3 py-1 rounded-lg border border-white/5">#{order.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-[10px] font-black text-white">
                                                {order.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white tracking-tight">{order.name}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1"><User size={10}/> ID: {order.user_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <p className="text-xs font-black text-white">Rs. {parseFloat(order.total_amount).toLocaleString("en-IN")}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
                                            <Calendar size={10} />
                                            {new Date(order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-700">
                                        <button className="p-1.5 hover:bg-white/5 rounded-lg transition">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        Showing <span className="text-white">{indexOfFirstItem + 1}</span> to <span className="text-white">{Math.min(indexOfLastItem, orders.length)}</span> of <span className="text-white">{orders.length}</span>
                    </p>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(page => {
                                    return page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                                })
                                .map((page, index, array) => (
                                    <React.Fragment key={page}>
                                        {index > 0 && array[index - 1] !== page - 1 && (
                                            <span className="text-gray-600 px-1 text-[10px]">...</span>
                                        )}
                                        <button
                                            onClick={() => paginate(page)}
                                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                                currentPage === page 
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                                                    : "bg-gray-800 border border-gray-700 text-gray-500 hover:text-white"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                ))
                            }
                        </div>

                        <button 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {orders.length === 0 && (
                    <div className="py-32 text-center">
                        <ShoppingCart size={48} className="text-gray-700 mx-auto mb-4" />
                        <p className="text-lg font-black text-gray-600 uppercase tracking-widest">No Transactions Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
