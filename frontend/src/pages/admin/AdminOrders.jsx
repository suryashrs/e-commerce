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
    MoreHorizontal,
    Eye,
    X
} from "lucide-react";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewOrderDetails, setViewOrderDetails] = useState(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/orders.php`);
            if (response.data.status === 200) {
                setOrders(response.data.body);
            }
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
                                        <button 
                                            onClick={() => setViewOrderDetails(order)}
                                            className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-500/20 transition flex items-center gap-1.5 ml-auto"
                                        >
                                            <Eye size={13} /> View Details
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

            {/* ===== ORDER DETAILS MODAL ===== */}
            {viewOrderDetails && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-black text-gray-900">
                                Order Details — <span className="font-mono text-gray-500">#{viewOrderDetails.id}</span>
                            </h2>
                            <button onClick={() => setViewOrderDetails(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">Order Information</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Order ID:</span>
                                            <span className="font-semibold text-gray-800 font-mono">#{viewOrderDetails.id}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Status:</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                viewOrderDetails.status?.toLowerCase() === 'delivered' || viewOrderDetails.status?.toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' :
                                                viewOrderDetails.status?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                viewOrderDetails.status?.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>{viewOrderDetails.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Order Date:</span>
                                            <span className="font-semibold text-gray-800">{new Date(viewOrderDetails.created_at).toLocaleString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Payment Method:</span>
                                            <span className="font-semibold text-gray-800 capitalize">{viewOrderDetails.payment_method === 'esewa' ? 'eSewa' : 'Cash on Delivery'}</span>
                                        </div>
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
                                            <span className="font-semibold text-gray-800 text-right break-all">{viewOrderDetails.customer_email || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Shipping Address</h3>
                                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                                    {viewOrderDetails.shipping_address || <span className="text-gray-400 italic">No address provided.</span>}
                                </div>
                            </div>
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
                                                <p className="text-xs text-gray-500 mt-0.5">Quantity: {item.quantity} × Rs. {parseFloat(item.item_price).toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold text-gray-900">Rs. {(item.quantity * item.item_price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
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

export default AdminOrders;
