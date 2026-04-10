import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    Edit,
    Camera,
    Star,
    MessageSquare as MessageIcon
} from 'lucide-react';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

import { API_BASE_URL } from "../config";

const Seller = () => {
    const { user, updateUser, viewMode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab && ['overview', 'products', 'add-product', 'coupons', 'orders', 'profile'].includes(tab)) return tab;
        return "overview";
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [sellerOrders, setSellerOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Mode Guard: Redirect to Buyer Dashboard if in buyer mode
    useEffect(() => {
        if (viewMode === 'buyer') {
            navigate('/buyer');
        }
    }, [viewMode, navigate]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        stock: '0',
        sizes: '',  // Comma separated e.g. S, M, L
        colors: '',  // Comma separated e.g. Red, Blue
        has_tryon: 0
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editProductForm, setEditProductForm] = useState({ name: '', category: '', price: '', description: '', stock: '0', has_tryon: 0 });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [imageInputType, setImageInputType] = useState("file");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Product List State
    const [sellerProducts, setSellerProducts] = useState([]);
    
    // Review List State
    const [sellerReviews, setSellerReviews] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [replyLoading, setReplyLoading] = useState(false);
    
    // Coupon List State
    const [sellerCoupons, setSellerCoupons] = useState([]);
    const [couponForm, setCouponForm] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        expiry_date: ''
    });
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });
    const [editingCoupon, setEditingCoupon] = useState(null); // null = modal closed
    const [editForm, setEditForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Profile State (Matching BuyerDashboard)
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        location: user?.location || '',
        bio: user?.bio || '',
        phone: user?.phone || '',
        website: user?.website || '',
        calendar_url: user?.calendar_url || '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                location: user.location || '',
                bio: user.bio || '',
                phone: user.phone || '',
                website: user.website || '',
                calendar_url: user.calendar_url || '',
            });
        }
    }, [user]);

    // Poll to check for account approval
    useEffect(() => {
        const fetchLatestUserStatus = async () => {
            if (user?.id) {
                try {
                    const res = await fetch(`${API_BASE_URL}/user/me.php?id=${user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        // If the shop status has changed, update local context
                        if (data.shop_status && data.shop_status !== user.shop_status) {
                            updateUser(data);
                        }
                    }
                } catch (e) {
                    console.error("Failed to check status", e);
                }
            }
        };

        // Check once on mount
        fetchLatestUserStatus();

        let intervalId;
        // If pending, poll every 5 seconds
        if (user?.shop_status === 'pending') {
            intervalId = setInterval(fetchLatestUserStatus, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [user?.id, user?.shop_status]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) {
            setActiveTab(tab);
        } else {
            // Default back to overview if no tab is specified
            setActiveTab("overview");
        }
    }, [location.search]);

    useEffect(() => {
        if (activeTab === "products" && user) {
            fetchSellerProducts();
        } else if (activeTab === "coupons" && user) {
            fetchSellerCoupons();
        } else if ((activeTab === "orders" || activeTab === "overview") && user) {
            fetchSellerOrders();
        } else if (activeTab === "notifications" && user) {
            fetchNotifications();
        } else if (activeTab === "reviews" && user) {
            fetchSellerReviews();
        }
    }, [activeTab, user]);

    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/update_status.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId, status: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                // Refresh orders
                fetchSellerOrders();
                // Pop up for the seller
                alert(`Order #${orderId} has been marked as ${newStatus}! Notification sent to buyer.`);
            } else {
                alert(data.message || 'Failed to update order status');
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/user/update.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: user.id, ...profileData })
            });
            const data = await res.json();
            if (data.status === 200) {
                updateUser(data.body);
                alert("Profile updated successfully!");
            }
        } catch (err) {
            console.error("Update failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', user.id);

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/user/upload_avatar.php`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.status === 200) {
                updateUser({ ...user, avatar: data.body.avatar_url });
            }
        } catch (err) {
            console.error("Avatar upload failed", err);
        } finally {
            setLoading(false);
        }
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

    const fetchSellerOrders = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/seller_orders.php?seller_id=${user.id}`);
            const data = await response.json();
            if (response.ok) {
                setSellerOrders(Array.isArray(data.body) ? data.body : []);
            } else {
                setSellerOrders([]);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
            setSellerOrders([]);
        }
    };

    const fetchSellerProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/read.php?seller_id=${user.id}`);
            const data = await response.json();
            if (response.ok) {
                setSellerProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch products", error);
        }
    };

    const fetchSellerCoupons = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/coupons/read.php?seller_id=${user.id}`);
            const data = await response.json();
            if (response.ok) {
                setSellerCoupons(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Failed to fetch coupons", error);
        }
    };

    const fetchSellerReviews = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/seller_reviews.php?seller_id=${user.id}`);
            const data = await response.json();
            if (response.ok) {
                setSellerReviews(data.records || []);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setReplyLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reviews/seller_reply.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    review_id: replyingTo.id,
                    seller_id: user.id,
                    reply: replyText
                })
            });
            if (response.ok) {
                setReplyingTo(null);
                setReplyText("");
                fetchSellerReviews();
                alert("Reply posted successfully!");
            }
        } catch (error) {
            console.error("Failed to post reply", error);
        } finally {
            setReplyLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/products/delete.php?id=${productId}&seller_id=${user.id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            
            if (response.ok) {
                setSellerProducts(prev => prev.filter(p => p.id !== productId));
            } else {
                alert(result.message || "Failed to delete product.");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("An error occurred while deleting the product.");
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            const response = await fetch(`${API_BASE_URL}/coupons/delete.php?id=${couponId}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok) {
                setSellerCoupons(prev => prev.filter(c => c.id !== couponId));
                setCouponMessage({ type: 'success', text: 'Coupon deleted.' });
            } else {
                setCouponMessage({ type: 'error', text: result.message || 'Failed to delete.' });
            }
        } catch (error) {
            setCouponMessage({ type: 'error', text: 'Error deleting coupon.' });
        }
    };

    const handleEditCoupon = (coupon) => {
        setEditingCoupon(coupon);
        setEditForm({
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : ''
        });
    };

    const handleUpdateCoupon = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/coupons/update.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingCoupon.id, ...editForm })
            });
            const result = await response.json();
            if (response.ok) {
                setEditingCoupon(null);
                setCouponMessage({ type: 'success', text: 'Coupon updated successfully.' });
                fetchSellerCoupons();
            } else {
                setCouponMessage({ type: 'error', text: result.message || 'Failed to update.' });
            }
        } catch (error) {
            setCouponMessage({ type: 'error', text: 'Error updating coupon.' });
        } finally {
            setEditLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCouponInputChange = (e) => {
        const { name, value } = e.target;
        setCouponForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please upload a valid image file (PNG, JPG, WEBP). PDF and other files are not allowed.");
                e.target.value = "";
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = () => fileInputRef.current.click();

    const getRevenueTrend = () => {
        const last7DaysLabels = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
        }).reverse();

        const last7DaysDates = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const dailyRevenue = last7DaysDates.map(date => {
            return sellerOrders
                .filter(order => order.created_at.startsWith(date))
                .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
        });

        return {
            labels: last7DaysLabels,
            datasets: [
                {
                    label: 'Daily Revenue',
                    data: dailyRevenue,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e1b4b',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                displayColors: false,
                callbacks: {
                    label: (context) => `Revenue: Rs ${context.raw}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
                ticks: { 
                    font: { weight: '600', size: 10 }, 
                    color: '#94a3b8',
                    callback: (value) => 'Rs ' + value
                }
            },
            x: {
                grid: { display: false },
                ticks: { font: { weight: '600', size: 10 }, color: '#94a3b8' }
            }
        },
        maintainAspectRatio: false
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const isImageProvided = (imageInputType === "file" && image) || (imageInputType === "url" && imageUrlInput);

        if (!formData.name || !formData.price || !formData.category || !formData.stock || !formData.sizes || !formData.colors || !formData.description || !isImageProvided) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('category', formData.category);
        data.append('price', formData.price);
        data.append('description', formData.description);
        data.append('stock', formData.stock);
        data.append('seller_id', user.id);
        
        // Handle JSON fields for sizes and colors
        const sizeArray = formData.sizes.split(',').map(s => s.trim()).filter(s => s !== '');
        const colorArray = formData.colors.split(',').map(c => c.trim()).filter(c => c !== '');
        data.append('sizes', JSON.stringify(sizeArray));
        data.append('colors', JSON.stringify(colorArray));
        data.append('has_tryon', formData.has_tryon);
        
        if (imageInputType === "file" && image) {
            data.append('image', image);
        } else if (imageInputType === "url" && imageUrlInput) {
            data.append('image_url', imageUrlInput);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/products/manage.php`, {
                method: 'POST',
                body: data
            });
            const result = await response.json();

            if (response.ok || response.status === 201) {
                setMessage({ type: 'success', text: 'Product added successfully!' });
                setFormData({ name: '', category: '', price: '', description: '', stock: '0', sizes: '', colors: '' });
                setImage(null);
                setImagePreview(null);
                setImageUrlInput("");
                setTimeout(() => {
                    setActiveTab("products");
                    setMessage({ type: '', text: '' });
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to add product' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'An error occurred while adding product.' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setEditProductForm({
            name: product.name,
            category: product.category,
            price: product.price,
            description: product.description,
            stock: product.stock.toString(),
            has_tryon: product.has_tryon,
            image_url: product.image_url,
            try_on_image_url: product.try_on_image_url
        });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products/manage.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingProduct.id, ...editProductForm })
            });
            const result = await response.json();
            if (response.ok) {
                setEditingProduct(null);
                setMessage({ type: 'success', text: 'Product updated successfully.' });
                fetchSellerProducts();
            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to update.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error updating product.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        setCouponLoading(true);
        setCouponMessage({ type: '', text: '' });

        if (!couponForm.code || !couponForm.discount_value || !couponForm.expiry_date) {
            setCouponMessage({ type: 'error', text: 'Please fill in all fields' });
            setCouponLoading(false);
            return;
        }

        const payload = {
            ...couponForm,
            seller_id: user.id
        };

        try {
            const response = await fetch(`${API_BASE_URL}/coupons/manage.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok || response.status === 201) {
                setCouponMessage({ type: 'success', text: 'Coupon created successfully!' });
                setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', expiry_date: '' });
                fetchSellerCoupons(); // Refresh the list
                setTimeout(() => setCouponMessage({ type: '', text: '' }), 3000);
            } else {
                setCouponMessage({ type: 'error', text: result.message || 'Failed to create coupon' });
            }
    } catch (error) {
        console.error(error);
        setCouponMessage({ type: 'error', text: 'An error occurred while creating coupon.' });
    } finally {
        setCouponLoading(false);
    }
};

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const renderProfile = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Edit Merchant Profile</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Store / Personal Settings</p>
                    </div>
                </div>
                <form onSubmit={handleProfileSubmit} className="p-10 space-y-10">
                    <div className="flex items-center gap-8 pb-8 border-b border-gray-50">
                        <div className="relative group">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white font-black text-2xl border-4 border-gray-50 shadow-md group-hover:scale-105 transition-transform duration-500">
                                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition active:scale-95">
                                <Camera size={16} className="text-gray-900" />
                                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                            </label>
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Merchant Photo</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 font-sans">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="name" value={profileData.name} onChange={handleProfileChange}
                                    placeholder="e.g. Jane Smith"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Location</label>
                             <div className="relative group">
                                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="location" value={profileData.location} onChange={handleProfileChange}
                                    placeholder="e.g. New York, USA"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                             <div className="relative group">
                                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="phone" value={profileData.phone} onChange={handleProfileChange}
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
                                    type="text" name="website" value={profileData.website} onChange={handleProfileChange}
                                    placeholder="https://yourstore.com"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="space-y-3">
                             <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Calendar URL</label>
                             <div className="relative group">
                                <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                                <input 
                                    type="text" name="calendar_url" value={profileData.calendar_url} onChange={handleProfileChange}
                                    placeholder="e.g. calendly.com/username"
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-2xl transition font-bold"
                                />
                             </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Bio / Store Description</label>
                            <textarea 
                                name="bio" rows="4" value={profileData.bio} onChange={handleProfileChange}
                                placeholder="Describe your store and products..."
                                className="w-full px-8 py-6 bg-gray-50/50 border border-transparent focus:bg-white focus:border-gray-200 rounded-[2.5rem] transition font-bold resize-none"
                            ></textarea>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-2">Max 1024 characters</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <button type="submit" disabled={loading} className="bg-black text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition shadow-2xl hover:shadow-black/20">
                            {loading ? 'Saving...' : 'Update Merchant Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-12 text-center max-w-lg mx-auto transform transition duration-500 hover:-translate-y-2 hover:shadow-3xl">
                    <div className="text-6xl mb-6">🔒</div>
                    <h3 className="text-3xl font-bold mb-4 text-gray-800">
                        Merchant Access Required
                    </h3>
                    <p className="text-gray-500 mb-8 font-light">
                        Please sign in to access your WearIt Now Seller Dashboard.
                    </p>
                    <a
                        href="/login"
                        className="bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition shadow-lg inline-block"
                    >
                        Login Now
                    </a>
                </div>
            </div>
        );
    }

    // Check for application status
    if (user.shop_status === 'pending') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-24">
                <div className="max-w-xl w-full bg-white shadow-2xl rounded-[3rem] p-12 text-center border border-gray-50 relative overflow-hidden">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-50 rounded-full -ml-12 -mb-12 opacity-50"></div>
                    
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Clock size={48} strokeWidth={2.5} className="animate-pulse" />
                        </div>
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-500 mb-4">Application Status</p>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 uppercase">Pending Approval</h1>
                        <p className="text-gray-500 text-sm font-bold leading-relaxed mb-10 max-w-sm mx-auto">
                            Thank you for applying to be a seller! Our administration team is currently reviewing your shop details of <span className="text-black">{user.shop_name}</span>. This usually takes 24-48 hours.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between text-left">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop Name</p>
                                    <p className="text-sm font-bold text-gray-900">{user.shop_name}</p>
                                </div>
                                <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Reviewing</div>
                            </div>
                            
                            <div className="pt-6">
                                <Link to="/" className="text-sm font-black text-gray-900 hover:text-indigo-600 transition-colors uppercase tracking-widest flex items-center justify-center group">
                                    Continue Shopping
                                    <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (user.shop_status === 'suspended') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 pt-24">
                <div className="max-w-xl w-full bg-white shadow-2xl rounded-[3rem] p-12 text-center border border-rose-50 relative overflow-hidden">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <XCircle size={48} strokeWidth={2.5} />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase text-rose-500 mb-4">Account Alert</p>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 uppercase">Store Suspended</h1>
                    <p className="text-gray-500 text-sm font-bold leading-relaxed mb-10 max-w-sm mx-auto">
                        Your merchant account has been suspended by the administration team. Please contact support for further information regarding your store status.
                    </p>
                    <Link to="/" className="inline-block bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition shadow-lg">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Background Accent */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200 to-transparent opacity-30 pointer-events-none z-0"></div>

            <div className="flex">
            {/* Navigation Sidebar */}
            <aside className="hidden md:flex sticky top-0 h-screen w-72 z-40 flex-col shrink-0">
                <div className="bg-white/90 backdrop-blur-xl shadow-2xl m-4 mt-20 rounded-[1.5rem] p-6 flex-1 border border-white/40 flex flex-col overflow-y-auto">
                    <div className="mb-8 pl-2">
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">WearIt Now</h2>
                        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full mt-1 inline-block">Merchant Portal</span>
                    </div>

                    <nav className="flex flex-col space-y-2 flex-grow">
                        {[
                            { id: 'overview', icon: '📊', label: 'Overview' },
                            { id: 'products', icon: '🛍️', label: 'My Products' },
                            { id: 'add-product', icon: '➕', label: 'Add Product' },
                            { id: 'coupons', icon: '🎟️', label: 'Coupons' },
                            { id: 'orders', icon: '📝', label: 'Fulfillment' },
                            { id: 'reviews', icon: '⭐', label: 'Reviews' },
                            { id: 'notifications', icon: '🔔', label: 'Notifications' },
                            { id: 'profile', icon: '👤', label: 'Profile' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? "bg-black text-white shadow-lg transform scale-[1.02]"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                            >
                                <span className="mr-3 text-xl">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-100">
                        <div className="flex items-center space-x-3 px-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {user.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">Seller</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <div className="md:hidden flex flex-row flex-wrap gap-2 px-4 pt-20 pb-4 bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-40">
                {[
                    { id: 'overview', icon: '📊', label: 'Overview' },
                    { id: 'products', icon: '🛍️', label: 'My Products' },
                    { id: 'add-product', icon: '➕', label: 'Add' },
                    { id: 'coupons', icon: '🎟️', label: 'Coupons' },
                    { id: 'orders', icon: '📝', label: 'Orders' },
                    { id: 'reviews', icon: '⭐', label: 'Reviews' },
                    { id: 'notifications', icon: '🔔', label: 'Alerts' },
                    { id: 'profile', icon: '👤', label: 'Profile' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            activeTab === tab.id ? 'bg-black text-white shadow' : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        <span>{tab.icon}</span>{tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area - offset by sidebar width */}
            <main className="flex-1 pt-6 md:pt-24 pb-12 px-4 md:px-8 relative z-10 min-h-screen">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] p-10 border border-white/50 transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Back, {user.name}!</h1>
                                <p className="text-gray-500 font-medium">Here's what's happening with your store today.</p>
                            </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { title: 'Total Sales', value: `Rs ${sellerOrders.reduce((acc, order) => acc + parseFloat(order.total_amount), 0).toFixed(0)}`, icon: '💰', sub: 'Gross Revenue', target: 'orders' },
                                        { title: 'Products', value: sellerProducts.length, icon: '📦', sub: 'Active listings', target: 'products' },
                                        { title: 'Orders', value: sellerOrders.length, icon: '📝', sub: 'Pending fulfillment', target: 'orders' },
                                        { title: 'Platform Comm.', value: `Rs ${sellerOrders.length * 100}`, icon: '🏷️', sub: 'Total deductions', target: 'orders' }
                                    ].map((stat, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => stat.target && setActiveTab(stat.target)}
                                        className="bg-white shadow-2xl rounded-3xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden group text-left w-full"
                                    >
                                        <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform duration-500">
                                            {stat.icon}
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            {stat.icon}
                                        </div>
                                        <h3 className="text-gray-500 font-semibold text-sm mb-1 uppercase tracking-wider">{stat.title}</h3>
                                        <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-400">{stat.sub}</span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* REVENUE TREND CHART */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white/90 backdrop-blur-md shadow-2xl rounded-[2.5rem] p-10 border border-white/50">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Revenue Performance</h3>
                                            <p className="text-sm text-gray-400 font-medium">Last 7 days revenue trend</p>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                                            Live Status
                                        </div>
                                    </div>
                                    <div style={{ height: 300 }}>
                                        <Line data={getRevenueTrend()} options={chartOptions} />
                                    </div>
                                </div>

                                <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-[2.5rem] p-10 border border-white/50 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Finance Summary</h3>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            Your sales are updated automatically. Track your net growth after platform fees.
                                        </p>
                                    </div>
                                    <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-400">Total Commissions</span>
                                            <span className="text-sm font-black text-rose-500">- Rs {sellerOrders.length * 100}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
                                            <span className="text-sm font-bold text-green-700">Net Revenue</span>
                                            <span className="text-lg font-black text-green-700">
                                                Rs {sellerOrders.reduce((acc, o) => acc + parseFloat(o.total_amount), 0) - (sellerOrders.length * 100)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RECENT SALES / CUSTOMER HISTORY */}
                            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-[2.5rem] p-10 border border-white/50">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Recent Customer Activity</h3>
                                        <p className="text-sm text-gray-400 font-medium">Identify who is buying from your store</p>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('orders')}
                                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition flex items-center gap-2"
                                    >
                                        View Full Ledger <ChevronRight size={14} />
                                    </button>
                                </div>
                                
                                {sellerOrders.length > 0 ? (
                                    <div className="space-y-4">
                                        {sellerOrders.slice(0, 5).map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-gray-50 transition-all hover:scale-[1.01] group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold shadow-lg transform group-hover:rotate-6 transition-transform">
                                                        {order.customer_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900">{order.customer_name}</p>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Verified Buyer</p>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-tight mt-0.5">
                                                            {order.items.length} {order.items.length === 1 ? 'Product' : 'Products'} • ID: #{order.id}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-gray-900 text-lg">Rs {parseFloat(order.total_amount).toFixed(0)}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-gray-50/30 rounded-3xl border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold italic tracking-tight">No recent interaction history available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === "products" && (
                        <div className="animate-fade-in-up">
                            <div className="flex justify-between items-end mb-8 pl-2">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">My Inventory</h2>
                                    <p className="text-gray-500 mt-1">Manage and track your listed products.</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab("add-product")}
                                    className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-gray-800 transition shadow-lg text-sm"
                                >
                                    + New Product
                                </button>
                            </div>

                            {sellerProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {sellerProducts.map((product) => (
                                        <div key={product.id} className="bg-white shadow-xl rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 flex flex-col">
                                            <div className="h-56 bg-gray-50 relative group overflow-hidden">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-5xl opacity-40">🛍️</div>
                                                )}
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                                    {product.category}
                                                </div>
                                            </div>
                                            <div className="p-6 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight mb-2">
                                                        {product.name}
                                                    </h3>
                                                </div>
                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                                                    <span className="text-xl font-extrabold text-indigo-600">
                                                        Rs {product.price}
                                                    </span>
                                                    <div className="flex flex-col items-end space-y-2">
                                                        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${product.stock > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                            {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                                                        </span>
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => handleEditProduct(product)}
                                                                className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition px-2 py-1 rounded-md"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="flex items-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition px-2 py-1 rounded-md"
                                                                title="Delete Product"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white shadow-2xl rounded-3xl p-16 text-center border border-gray-100">
                                    <div className="text-6xl mb-6 opacity-80">📦</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No products yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Start building your store by listing your first amazing fashion piece today.</p>
                                    <button
                                        onClick={() => setActiveTab("add-product")}
                                        className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
                                    >
                                        Add Your First Product
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD PRODUCT TAB */}
                    {activeTab === "add-product" && (
                        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] p-10 border border-white/50 animate-fade-in-up">
                            <h2 className="text-3xl font-extrabold mb-6 text-gray-900 tracking-tight">Create Listing</h2>

                            {message.text && (
                                <div className={`mb-8 p-4 rounded-2xl font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                {/* Same form fields but restyled with slightly softer borders */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Product Name</label>
                                        <input
                                            type="text" name="name" value={formData.name} onChange={handleInputChange}
                                            placeholder="e.g., Stylish Cotton T-Shirt"
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Category</label>
                                        <select
                                            name="category" value={formData.category} onChange={handleInputChange}
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner appearance-none"
                                        >
                                            <option value="">Select category</option>
                                            <option value="tops">Tops</option>
                                            <option value="bottoms">Bottoms</option>
                                            <option value="outerwear">Outerwear</option>
                                            <option value="accessories">Accessories</option>
                                            <option value="thrift">Thrift ♻️</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Price (Rs)</label>
                                        <input
                                            type="number" name="price" value={formData.price} onChange={handleInputChange}
                                            placeholder="1000"
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Stock Quantity</label>
                                        <input
                                            type="number" name="stock" value={formData.stock} onChange={handleInputChange}
                                            placeholder="50"
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Available Sizes</label>
                                        <input
                                            type="text" name="sizes" value={formData.sizes} onChange={handleInputChange}
                                            placeholder="e.g. S, M, L, XL"
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">Available Colors</label>
                                        <input
                                            type="text" name="colors" value={formData.colors} onChange={handleInputChange}
                                            placeholder="e.g. Red, Black, Blue"
                                            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                    
                                    <div className="col-span-1 md:col-span-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-xl">🎨</div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Virtual Try-On (AR)</p>
                                                <p className="text-xs text-gray-500 font-medium">Remove background and enable live fitting room for this product.</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={formData.has_tryon === 1} 
                                                onChange={(e) => setFormData(prev => ({ ...prev, has_tryon: e.target.checked ? 1 : 0 }))}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 ml-1">Description</label>
                                    <textarea
                                        rows="4" name="description" value={formData.description} onChange={handleInputChange}
                                        placeholder="Describe your product..."
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner resize-none"
                                    ></textarea>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="block text-sm font-semibold text-gray-700">Product Image</label>
                                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                            <button 
                                                type="button" onClick={() => setImageInputType("file")}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${imageInputType === "file" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
                                            >Upload File</button>
                                            <button 
                                                type="button" onClick={() => setImageInputType("url")}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${imageInputType === "url" ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"}`}
                                            >Image URL</button>
                                        </div>
                                    </div>

                                    {imageInputType === "file" ? (
                                        <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-3xl p-10 text-center hover:border-black hover:bg-gray-50 transition-all relative group">
                                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                            {imagePreview ? (
                                                <div className="flex flex-col items-center relative">
                                                    <img src={imagePreview} alt="Preview" className="h-48 object-contain mb-4 rounded-xl shadow-md group-hover:scale-105 transition-transform" />
                                                    <p className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{image.name}</p>
                                                    
                                                    {/* Edit/Delete Overlay Options */}
                                                    <div className="absolute top-0 right-0 p-2 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end">
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); handleImageClick(); }}
                                                            className="bg-white/90 backdrop-blur text-sm font-bold text-gray-800 px-3 py-1.5 rounded-lg shadow-lg hover:bg-gray-100 transition border border-gray-200"
                                                        >
                                                            ✏️ Change
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); setImage(null); setImagePreview(null); }}
                                                            className="bg-red-50 text-sm font-bold text-red-600 px-3 py-1.5 rounded-lg shadow-lg hover:bg-red-100 transition border border-red-200"
                                                        >
                                                            🗑️ Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center cursor-pointer" onClick={handleImageClick}>
                                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl mb-4 group-hover:-translate-y-1 transition-transform">📷</div>
                                                    <p className="text-gray-700 font-semibold mb-1">Click to upload image</p>
                                                    <p className="text-sm text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="border border-gray-200 bg-gray-50/50 rounded-3xl p-8 hover:border-gray-300 transition-all">
                                            <div className="flex items-center mb-4 space-x-3">
                                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-lg">🔗</div>
                                                <p className="text-gray-700 font-semibold">Paste Image Source Link</p>
                                            </div>
                                            <input
                                                type="url" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                                            />
                                            {imageUrlInput && (
                                                <div className="mt-6 flex flex-col items-center">
                                                    <img src={imageUrlInput} alt="Preview" className="h-48 object-contain rounded-xl shadow-md border border-gray-100 bg-white p-2" 
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
                                                        onLoad={(e) => { e.target.style.display = 'block'; e.target.nextSibling.style.display = 'none'; }} 
                                                    />
                                                    <p className="text-red-500 text-sm hidden mt-3 font-medium bg-red-50 px-4 py-2 rounded-lg">⚠️ Failed to load image. Check the URL.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button type="submit" disabled={loading} className={`flex-1 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                                        {loading ? 'Processing...' : 'Publish Listing'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* COUPONS TAB */}
                    {activeTab === "coupons" && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Coupon Generator Card */}
                                <div className="w-full md:w-1/3 bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] p-8 border border-white/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] h-fit shrink-0">
                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center">
                                        <span className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center mr-3 text-lg">🎟️</span>
                                        New Coupon
                                    </h3>
                                    
                                    {couponMessage.text && (
                                        <div className={`mb-6 p-3 rounded-xl text-sm font-medium border ${couponMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                            {couponMessage.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleCouponSubmit} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Code</label>
                                            <input 
                                                type="text" name="code" value={couponForm.code} onChange={handleCouponInputChange}
                                                placeholder="e.g. SUMMER20" maxLength="50"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-mono tracking-wider transition-all"
                                            />
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Discount Type</label>
                                            <select 
                                                name="discount_type" value={couponForm.discount_type} onChange={handleCouponInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none font-medium"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount (Rs)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Value</label>
                                            <input 
                                                type="number" name="discount_value" value={couponForm.discount_value} onChange={handleCouponInputChange}
                                                placeholder={couponForm.discount_type === 'percentage' ? '20' : '500'}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Expiry Date</label>
                                            <input 
                                                type="date" name="expiry_date" value={couponForm.expiry_date} onChange={handleCouponInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
                                            />
                                        </div>

                                        <button type="submit" disabled={couponLoading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 transition-all mt-2">
                                            {couponLoading ? 'Creating...' : 'Generate Coupon'}
                                        </button>
                                    </form>
                                </div>

                                {/* Active Coupons List */}
                                <div className="w-full md:w-2/3 bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] p-8 border border-white/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex flex-col">
                                    <h3 className="text-2xl font-extrabold text-gray-900 mb-6">Active Campaigns</h3>
                                    
                                    <div className="flex-grow overflow-auto">
                                        {sellerCoupons.length > 0 ? (
                                            <table className="w-full text-left border-separate border-spacing-y-3">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">Code</th>
                                                        <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">Value</th>
                                                        <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 hidden sm:table-cell">Expires</th>
                                                        <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 text-right">Uses</th>
                                                        <th className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sellerCoupons.map((coupon) => (
                                                        <tr key={coupon.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                                                            <td className="px-4 py-4 rounded-l-2xl">
                                                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">{coupon.code}</span>
                                                            </td>
                                                            <td className="px-4 py-4 font-bold text-gray-900">
                                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `Rs ${coupon.discount_value} OFF`}
                                                            </td>
                                                            <td className="px-4 py-4 text-sm text-gray-500 font-medium hidden sm:table-cell">
                                                                {new Date(coupon.expiry_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-xs font-bold shadow-md">
                                                                    {coupon.usage_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-right rounded-r-2xl">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleEditCoupon(coupon)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition text-xs font-bold border border-indigo-100"
                                                                    >
                                                                        ✏️ Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteCoupon(coupon.id)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold border border-red-100"
                                                                    >
                                                                        🗑️ Del
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                                <div className="text-5xl opacity-40 mb-4">💨</div>
                                                <p className="font-bold text-gray-700 text-lg mb-1">No coupons yet</p>
                                                <p className="text-sm text-gray-500 max-w-xs">Create percentage or flat discounts to boost your sales.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ORDERS/FULFILLMENT TAB */}
                    {activeTab === "orders" && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div className="flex justify-between items-end mb-6 pl-2">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">Order Fulfillment</h2>
                                    <p className="text-gray-500 mt-1">Manage and ship your incoming customer orders.</p>
                                </div>
                            </div>

                            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-[2rem] p-8 border border-white/50 overflow-hidden">
                                {sellerOrders.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-separate border-spacing-y-4">
                                            <thead>
                                                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    <th className="px-6 pb-2">Order Info</th>
                                                    <th className="px-6 pb-2">Items</th>
                                                    <th className="px-6 pb-2">Customer</th>
                                                    <th className="px-6 pb-2">Amount</th>
                                                    <th className="px-6 pb-2">Status</th>
                                                    <th className="px-6 pb-2 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sellerOrders.map((order) => (
                                                    <tr key={order.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors group">
                                                        <td className="px-6 py-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-gray-100">
                                                            <div className="font-bold text-gray-900">#{order.id}</div>
                                                            <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100 min-w-[200px]">
                                                            <div className="flex flex-col gap-2">
                                                                {order.items.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 bg-white/50 p-1.5 rounded-xl border border-gray-100/50 shadow-sm">
                                                                        <img 
                                                                            src={item.image_url} 
                                                                            alt={item.product_name} 
                                                                            className="h-8 w-8 rounded-lg object-cover shadow-inner"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-[11px] font-bold text-gray-900 truncate tracking-tight">{item.product_name}</p>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                                                                                {item.quantity} × <span className="text-indigo-600">Rs {item.item_price}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100">
                                                            <div className="font-semibold text-gray-800">{order.customer_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-indigo-600 border-y border-transparent group-hover:border-gray-100">
                                                            Rs {parseFloat(order.total_amount).toFixed(0)}
                                                        </td>
                                                        <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                                order.status?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                                                                order.status?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.status?.toLowerCase() === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-gray-100 text-right">
                                                            <div className="relative group/dropdown inline-block text-left">
                                                                <button 
                                                                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-md flex items-center gap-1"
                                                                >
                                                                    Manage <span className="text-[10px]">▼</span>
                                                                </button>
                                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl z-50 border border-gray-100 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-200">
                                                                    <div className="py-2">
                                                                        {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                                            <button 
                                                                                onClick={() => handleOrderStatusUpdate(order.id, 'Shipped')}
                                                                                className="block w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-bold transition-colors"
                                                                            >
                                                                                📦 Mark as Shipped
                                                                            </button>
                                                                        )}
                                                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                                                             <button 
                                                                                onClick={() => handleOrderStatusUpdate(order.id, 'Delivered')}
                                                                                className="block w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-600 font-bold transition-colors border-t border-gray-50"
                                                                            >
                                                                                ✅ Mark as Delivered
                                                                            </button>
                                                                        )}
                                                                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                                             <button 
                                                                                onClick={() => handleOrderStatusUpdate(order.id, 'Cancelled')}
                                                                                className="block w-full text-left px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 font-bold transition-colors border-t border-gray-50"
                                                                            >
                                                                                ❌ Cancel Order
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        <div className="text-6xl mb-4">📭</div>
                                        <h3 className="text-xl font-bold text-gray-800">No orders yet</h3>
                                        <p className="text-gray-500">When customers buy your products, they will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === "reviews" && (
                        <div className="animate-fade-in-up space-y-8">
                            <div className="flex justify-between items-end mb-6 pl-2">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">Product Reviews</h2>
                                    <p className="text-gray-500 mt-1">See what customers are saying about your products.</p>
                                </div>
                            </div>

                            {sellerReviews.length > 0 ? (
                                <div className="grid gap-6">
                                    {sellerReviews.map((review) => (
                                        <div key={review.id} className="bg-white/90 backdrop-blur-md shadow-xl rounded-[2rem] p-8 border border-white/50 flex flex-col gap-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl shadow-md">
                                                        {review.user_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900 text-lg">{review.user_name}</span>
                                                            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                                <CheckCircle2 size={12} />
                                                                <span>Verified Purchaser</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{review.product_name}</p>
                                                            <span className="text-gray-300">•</span>
                                                            <p className="text-[10px] font-bold text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            size={16} 
                                                            fill={i < review.rating ? "currentColor" : "none"} 
                                                            className={i < review.rating ? "text-amber-400" : "text-gray-200"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-gray-700 font-medium leading-relaxed italic text-lg bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                                "{review.comment}"
                                            </p>

                                            {review.seller_reply ? (
                                                <div className="bg-black/5 p-6 rounded-[1.5rem] border border-black/5 relative overflow-hidden group">
                                                    <div className="flex items-center gap-2 text-xs font-black text-black uppercase tracking-[0.2em] mb-3">
                                                        <MessageIcon size={14} />
                                                        <span>Official Response</span>
                                                        <span className="ml-auto text-[10px] text-gray-400 font-bold">{new Date(review.seller_reply_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-bold leading-relaxed pr-8">
                                                        {review.seller_reply}
                                                    </p>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo(review);
                                                            setReplyText(review.seller_reply);
                                                        }}
                                                        className="absolute top-4 right-4 text-xs font-black text-indigo-600 hover:text-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter"
                                                    >
                                                        Edit Reply
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => setReplyingTo(review)}
                                                    className="w-fit flex items-center gap-2 text-xs font-black text-black bg-white border-2 border-black px-6 py-2.5 rounded-full hover:bg-black hover:text-white transition-all transform hover:scale-105 shadow-sm active:scale-95"
                                                >
                                                    <MessageIcon size={14} />
                                                    REPLY TO CUSTOMER
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white/90 shadow-2xl rounded-[3rem] p-24 text-center border border-white/50">
                                    <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                        <Star size={48} strokeWidth={1} />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-4">Quiet Atmosphere</h3>
                                    <p className="text-gray-500 font-bold max-w-sm mx-auto leading-relaxed">
                                        No reviews have been posted for your collection yet. Great service usually sparks great feedback!
                                    </p>
                                </div>
                            )}

                            {/* Reply Modal */}
                            {replyingTo && (
                                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                                    <div className="bg-white rounded-[2.5rem] shadow-3xl p-10 w-full max-w-lg animate-scale-in relative border border-white/20">
                                        <button 
                                            onClick={() => setReplyingTo(null)}
                                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 transition-all active:scale-90"
                                        >
                                            ✕
                                        </button>
                                        
                                        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-indigo-500 mb-6 flex items-center gap-2">
                                            <span className="w-8 h-[2px] bg-indigo-500"></span>
                                            Review Response
                                        </p>
                                        
                                        <div className="mb-8 pl-4 border-l-4 border-gray-100">
                                            <p className="text-xs font-black text-gray-400 mb-1 uppercase tracking-widest">{replyingTo.user_name}'s Review:</p>
                                            <p className="text-sm font-bold text-gray-600 italic">"{replyingTo.comment}"</p>
                                        </div>

                                        <form onSubmit={handleReplySubmit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-black text-gray-900 uppercase tracking-widest ml-1">Your Reply</label>
                                                <textarea
                                                    rows="5"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Address feedback or thank your customer..."
                                                    className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:outline-none focus:ring-0 focus:border-black transition-all font-bold text-gray-700 resize-none placeholder:text-gray-300"
                                                    required
                                                ></textarea>
                                            </div>
                                            
                                            <div className="flex gap-4 pt-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setReplyingTo(null)}
                                                    className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs hover:border-gray-200 hover:text-gray-600 transition-all active:scale-95"
                                                >
                                                    Dismiss
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    disabled={replyLoading}
                                                    className="flex-1 bg-black text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
                                                >
                                                    {replyLoading ? 'TRANSMITTING...' : 'POST RESPONSE'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {editingCoupon && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-md animate-fade-in-up">
                                <h3 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-lg">✏️</span>
                                    Edit Coupon
                                </h3>
                                <form onSubmit={handleUpdateCoupon} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Code</label>
                                        <input
                                            type="text" value={editForm.code}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-mono tracking-wider transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Discount Type</label>
                                        <select
                                            value={editForm.discount_type}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, discount_type: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (Rs)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Value</label>
                                        <input
                                            type="number" value={editForm.discount_value}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, discount_value: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Expiry Date</label>
                                        <input
                                            type="date" value={editForm.expiry_date}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-gray-700"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setEditingCoupon(null)}
                                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={editLoading}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition"
                                        >
                                            {editLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Product Modal */}
                    {editingProduct && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                                <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-600 w-10 h-10 rounded-full flex items-center justify-center text-lg">🛍️</span>
                                    Edit Product
                                </h3>
                                <form onSubmit={handleUpdateProduct} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Product Name</label>
                                            <input
                                                type="text" value={editProductForm.name}
                                                onChange={(e) => setEditProductForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                                            <select
                                                value={editProductForm.category}
                                                onChange={(e) => setEditProductForm(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            >
                                                <option value="tops">Tops</option>
                                                <option value="bottoms">Bottoms</option>
                                                <option value="outerwear">Outerwear</option>
                                                <option value="accessories">Accessories</option>
                                                <option value="thrift">Thrift ♻️</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Price (Rs)</label>
                                            <input
                                                type="number" value={editProductForm.price}
                                                onChange={(e) => setEditProductForm(prev => ({ ...prev, price: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Stock Quantity</label>
                                            <input
                                                type="number" value={editProductForm.stock}
                                                onChange={(e) => setEditProductForm(prev => ({ ...prev, stock: e.target.value }))}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            />
                                        </div>
                                        
                                        <div className="col-span-1 md:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-lg">🎨</div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">Virtual Try-On (AR)</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">Toggle live AR fitting for this product.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={editProductForm.has_tryon === 1} 
                                                    onChange={(e) => setEditProductForm(prev => ({ ...prev, has_tryon: e.target.checked ? 1 : 0 }))}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-sm"></div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                                        <textarea
                                            rows="4" value={editProductForm.description}
                                            onChange={(e) => setEditProductForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setEditingProduct(null)}
                                            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={loading}
                                            className="flex-1 bg-black text-white font-bold py-3 rounded-xl shadow-lg hover:bg-gray-800 transition"
                                        >
                                            {loading ? 'Saving...' : 'Save Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === "profile" && renderProfile()}

                </div>
            </main>
            </div>
        </div>
    );
};

export default Seller;
