import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';
import { 
    User, 
    Box, 
    TrendingUp, 
    ChevronRight, 
    ShoppingBag, 
    Clock, 
    CheckCircle2, 
    XCircle,
    MapPin,
    Phone,
    Globe,
    Calendar,
    Mail,
    Camera,
    Bell
} from 'lucide-react';

const BuyerDashboard = () => {
    const { user, updateUser, viewMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine initial tab based on path
    const getInitialTab = () => {
        if (location.pathname === '/profile/edit') return 'profile';
        if (location.pathname === '/buyer') return 'orders';
        return 'orders';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [loading, setLoading] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    
    // Payment Success state
    const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);
    const [completedOrderId, setCompletedOrderId] = useState(null);
    const { clearCart } = useCart();
    
    // Profile form state
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        bio: '',
        phone: '',
        website: '',
        calendarUrl: '',
        displayEmail: '',
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
        fetchProfileData();
        fetchPaymentHistory();
    }, [user, navigate]);

    const fetchPaymentHistory = async () => {
        if (!user) return;
        setPaymentsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/payments.php?user_id=${user.id}&role=buyer`);
            if (res.ok) {
                const data = await res.json();
                console.log("Fetched buyer payments:", data);
                // Handle both direct array responses and wrapped body responses
                const history = Array.isArray(data.body) ? data.body : (Array.isArray(data) ? data : []);
                setPaymentHistory(history);
            } else {
                console.warn("Failed to fetch payments, status:", res.status);
            }
        } catch (err) {
            console.error("Failed to fetch payment history", err);
        } finally {
            setPaymentsLoading(false);
        }
    };

    // Mode Guard: Redirect to Seller Portal if in seller mode
    useEffect(() => {
        if (viewMode === 'seller' || viewMode === 'admin') {
            navigate('/seller');
        }
    }, [viewMode, navigate]);

    useEffect(() => {
        const tab = getInitialTab();
        setActiveTab(tab);
        
        // Handle eSewa success
        const params = new URLSearchParams(location.search);
        if (params.get('payment') === 'success') {
            const orderId = params.get('order_id');
            setCompletedOrderId(orderId);
            setPaymentSuccessModal(true);
            
            // Clear cart from context and storage
            clearCart();
            
            // Clean up URL to prevent repeated triggers
            navigate('/buyer', { replace: true });
        }
    }, [location.pathname, location.search, navigate, clearCart, user]);

    if (!user) {
        return null; // Don't render until authentication redirects or user is loaded
    }

    const fetchProfileData = () => {
        fetch(`${API_BASE_URL}/user/me.php?id=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.name) {
                    setFormData({
                        name: data.name || '',
                        location: data.location || '',
                        bio: data.bio || '',
                        phone: data.phone || '',
                        website: data.website || '',
                        calendarUrl: data.calendar_url || '',
                        displayEmail: data.email || '',
                    });
                }
            })
            .catch(err => console.error("Failed to fetch profile", err));
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/user_notifications.php?user_id=${user.id}`);
            const data = await res.json();
            if (res.ok && data.status === 200) {
                setNotifications(data.body);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/orders/user_orders.php?user_id=${user.id}`);
            const data = await res.json();
            if (data.status === 200) {
                setOrders(data.body);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');

        const uploadData = new FormData();
        uploadData.append('avatar', file);
        uploadData.append('id', user.id);

        try {
            const response = await fetch(`${API_BASE_URL}/user/upload_avatar.php`, {
                method: 'POST',
                body: uploadData,
            });
            const data = await response.json();
            if (response.ok) {
                updateUser({ avatar: data.avatar_url });
                setSuccessMessage('Avatar updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message || 'Failed to upload avatar.');
            }
        } catch (err) {
            setError('An error occurred while uploading.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/user/update.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    ...formData,
                    calendar_url: formData.calendarUrl
                }),
            });
            if (response.ok) {
                setSuccessMessage('Profile updated successfully!');
                updateUser({ ...formData });
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError('Failed to update profile.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        
        // Optimistic UI: Update state immediately
        const originalOrders = [...orders];
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));

        setCancellingOrderId(orderId);
        setError('');
        setSuccessMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/orders/update_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status: 'Cancelled' })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setSuccessMessage(`Order #${orderId} was successfully cancelled.`);
                // Sync with server data to be safe
                fetchOrders();
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                // Rollback on error
                setOrders(originalOrders);
                setError(data.message || 'Failed to cancel order.');
            }
        } catch (err) {
            // Rollback on error
            setOrders(originalOrders);
            console.error("Failed to cancel order", err);
            setError('Connection error. Please try again.');
        } finally {
            setCancellingOrderId(null);
        }
    };

    const getStatusInfo = (status) => {
        const s = status?.toLowerCase();
        if (s === 'delivered') return { icon: <CheckCircle2 size={12} />, color: 'bg-green-50 text-green-600', label: 'Delivered' };
        if (s === 'cancelled') return { icon: <XCircle size={12} />, color: 'bg-rose-50 text-rose-600', label: 'Cancelled' };
        return { icon: <Clock size={12} />, color: 'bg-amber-50 text-amber-600', label: 'Pending' };
    };

    const renderProfile = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">Edit Profile</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Personal Settings</p>
                    </div>
                </div>
                <form onSubmit={handleProfileSubmit} className="p-6 space-y-8">
                    <div className="flex items-center gap-8 pb-8 border-b border-gray-50">
                        <div className="relative group">
                            {user.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white font-black text-2xl border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition active:scale-95">
                                <Camera size={16} className="text-gray-900" />
                                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Profile Photo</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-sans">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="name" value={formData.name} onChange={handleProfileChange}
                                    placeholder="e.g. John Doe"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Location</label>
                             <div className="relative group">
                                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="location" value={formData.location} onChange={handleProfileChange}
                                    placeholder="e.g. New York, USA"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Display Email</label>
                             <div className="relative group">
                                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="email" name="displayEmail" value={formData.displayEmail} onChange={handleProfileChange}
                                    placeholder="your@email.com"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                             <div className="relative group">
                                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="phone" value={formData.phone} onChange={handleProfileChange}
                                    placeholder="+1 234 567 890"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Website</label>
                             <div className="relative group">
                                <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="website" value={formData.website} onChange={handleProfileChange}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Calendar URL</label>
                             <div className="relative group">
                                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="calendarUrl" value={formData.calendarUrl} onChange={handleProfileChange}
                                    placeholder="e.g. calendly.com/username"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Bio</label>
                            <textarea 
                                name="bio" rows="3" value={formData.bio} onChange={handleProfileChange}
                                placeholder="Describe yourself..."
                                className="w-full px-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold resize-none"
                            ></textarea>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-2">Max 1024 characters</p>
                        </div>
                    </div>

                    {successMessage && (
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm text-center border border-emerald-100 animate-in zoom-in-95">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm text-center border border-rose-100 animate-in zoom-in-95">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={loading} className="bg-black text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition shadow-2xl hover:shadow-black/20">
                            {loading ? 'Saving...' : 'Update Explorer Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderOrders = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-10">
            <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">My Orders</h2>
            {orders.length > 0 ? (
                orders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    return (
                        <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Order #{order.id}</h3>
                                    <p className="text-xs text-gray-400 font-bold mt-1">Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </span>
                                    <p className="text-xl font-black mt-3">Rs. {parseFloat(order.total_amount).toFixed(2)}</p>
                                    {order.status?.toLowerCase() === 'pending' && (
                                        <button 
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={cancellingOrderId === order.id}
                                            className={`mt-4 flex items-center gap-2 text-[10px] font-black border px-4 py-2 rounded-full transition uppercase tracking-widest ml-auto ${
                                                cancellingOrderId === order.id 
                                                ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                                                : 'text-rose-500 border-rose-100 hover:bg-rose-50'
                                            }`}
                                        >
                                            {cancellingOrderId === order.id ? (
                                                <span className="flex items-center gap-2 animate-pulse">
                                                    <Clock size={12} className="animate-spin" /> Cancelling...
                                                </span>
                                            ) : (
                                                <><XCircle size={12} /> Cancel Order</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Items:</p>
                                <div className="space-y-6">
                                    {order.items?.filter(item => !item.is_flagged).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 group-hover:scale-105 transition duration-500 shadow-sm">
                                                    <img 
                                                        src={item.image_url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200"} 
                                                        alt={item.product_name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{item.product_name}</h4>
                                                    <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest">Quantity: {item.quantity} × Rs. {item.item_price}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-sm">Rs. {(item.quantity * item.item_price).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-20 text-center shadow-sm">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShoppingBag className="text-gray-200" size={32} />
                    </div>
                    <h3 className="text-xl font-black mb-2">No orders found</h3>
                    <p className="text-gray-400 font-medium text-sm">You haven't placed any orders yet. Start shopping!</p>
                    <Link to="/shop" className="inline-block mt-8 bg-black text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition">Explore Store</Link>
                </div>
            )}
        </div>
    );

    const renderTrendPoints = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-black text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden mb-10">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/40 mb-3">Loyalty Balance</p>
                        <h2 className="text-7xl font-black tracking-tighter">2,450</h2>
                        <h3 className="text-xl font-bold mt-2 text-white/60 italic">TrendPoints</h3>
                    </div>
                    <div className="bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/10 text-center">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/50 mb-1">Membership</p>
                        <p className="text-xs font-black uppercase tracking-widest text-amber-400">Platinum Elite</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                     { label: 'Points Earned', value: '4,100', desc: 'Life-time total style accumulation' },
                     { label: 'Next Reward', value: '550', desc: 'Points until exclusive VIP voucher' }
                 ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{stat.label}</h4>
                        <p className="text-3xl font-black mb-2">{stat.value}</p>
                        <p className="text-xs text-gray-500 font-medium">{stat.desc}</p>
                    </div>
                 ))}
            </div>
        </div>
    );

    const handleMarkAsRead = async (notifId) => {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
        window.dispatchEvent(new Event('notificationsUpdated'));
        try {
            await fetch(`${API_BASE_URL}/notifications/mark_read.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: notifId })
            });
        } catch(err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleDeleteNotification = async (notifId) => {
        setNotifications(prev => prev.filter(n => n.id !== notifId));
        window.dispatchEvent(new Event('notificationsUpdated'));
        try {
            await fetch(`${API_BASE_URL}/notifications/delete_notification.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: notifId })
            });
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return renderProfile();
            case 'orders': return renderOrders();
            case 'payments': return renderPaymentHistory();
            default: return renderOrders();
        }
    };

    const renderPaymentHistory = () => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-end mb-2 pl-2">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payment History</h2>
                    <p className="text-gray-500 mt-1">Review your recent transactions and purchase status.</p>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/50 p-8">
                {paymentsLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Ledger...</p>
                    </div>
                ) : paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">
                                    <th className="px-6 py-2">Transaction ID</th>
                                    <th className="px-6 py-2">Date</th>
                                    <th className="px-6 py-2">Type</th>
                                    <th className="px-6 py-2 text-right">Amount</th>
                                    <th className="px-6 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map((payment) => (
                                    <tr key={payment.id} className="group bg-gray-50/50 hover:bg-white hover:shadow-lg transition-all duration-300">
                                        <td className="px-6 py-4 rounded-l-2xl font-bold text-gray-900 border-y border-l border-transparent group-hover:border-gray-100">
                                            #{payment.id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm border-y border-transparent group-hover:border-gray-100">
                                            {new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{payment.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 border-y border-transparent group-hover:border-gray-100">
                                            Rs {parseFloat(payment.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 rounded-r-2xl text-center border-y border-r border-transparent group-hover:border-gray-100">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                payment.status.toLowerCase() === 'completed' || payment.status.toLowerCase() === 'delivered'
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                            <TrendingUp className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No transaction records found</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] py-8 px-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight mb-1">Buyer Dashboard</h1>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Welcome back, {user?.name}!</p>
                    </div>
                    <div className="bg-gray-50 flex items-center gap-3 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                         <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-black text-xs">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-[10px]">
                            <p className="font-black text-gray-900 leading-tight">{user?.name}</p>
                            <p className="text-gray-400 font-bold uppercase tracking-widest opacity-60">Buyer Member</p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-10">
                    <aside className="lg:w-64 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sticky top-32">
                            <nav className="space-y-2">
                                {[
                                    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
                                    { id: 'orders', label: 'Orders', icon: <Box size={18} /> },
                                    { id: 'payments', label: 'Payments', icon: <TrendingUp size={18} /> },
                                    { id: 'points', label: 'TrendPoints', icon: <TrendingUp size={18} /> },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all group ${
                                            activeTab === item.id 
                                            ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' 
                                            : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'} transition-colors`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <ChevronRight size={14} className={`${activeTab === item.id ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity`} />
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-grow min-w-0">
                        {renderContent()}
                    </main>
                </div>
            </div>

            {/* Payment Success Modal Overlay */}
            {paymentSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-inner">
                            <CheckCircle2 size={48} strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Success!</h2>
                        <p className="text-gray-500 font-medium mb-8">
                            Your payment is completed for order #{completedOrderId}.
                        </p>
                        
                        <Link 
                            to="/shop" 
                            onClick={() => setPaymentSuccessModal(false)}
                            className="w-full bg-black text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:-translate-y-1 hover:shadow-xl active:translate-y-0 transition-all block"
                        >
                            Continue Shopping
                        </Link>
                        
                        <button 
                            onClick={() => setPaymentSuccessModal(false)}
                            className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition"
                        >
                            View Order
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerDashboard;
