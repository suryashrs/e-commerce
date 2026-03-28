import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

const Seller = () => {
    const { user } = useAuth();
    console.log('User object:', user);
    const [activeTab, setActiveTab] = useState("overview");

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        price: '',
        description: '',
        stock: '0'
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [editProductForm, setEditProductForm] = useState({ name: '', category: '', price: '', description: '', stock: '0' });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUrlInput, setImageUrlInput] = useState("");
    const [imageInputType, setImageInputType] = useState("file");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // Product List State
    const [sellerProducts, setSellerProducts] = useState([]);
    
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

    useEffect(() => {
        if (activeTab === "products" && user) {
            fetchSellerProducts();
        } else if (activeTab === "coupons" && user) {
            fetchSellerCoupons();
        }
    }, [activeTab, user]);

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
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = () => fileInputRef.current.click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (!formData.name || !formData.price || !formData.category) {
            setMessage({ type: 'error', text: 'Please fill in required fields' });
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
                setFormData({ name: '', category: '', price: '', description: '', stock: '0' });
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
            stock: product.stock.toString()
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
                            { id: 'coupons', icon: '🎟️', label: 'Coupons' }
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
                    { id: 'coupons', icon: '🎟️', label: 'Coupons' }
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
                                    { title: 'Total Sales', value: 'Rs 0', icon: '💰', sub: 'This month' },
                                    { title: 'Products', value: sellerProducts.length, icon: '📦', sub: 'Active listings' },
                                    { title: 'Orders', value: '0', icon: '📝', sub: 'Pending fulfillment' },
                                    { title: 'Rating', value: '5.0', icon: '⭐', sub: 'Average rating' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white shadow-2xl rounded-3xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform duration-500">
                                            {stat.icon}
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm border border-gray-100">
                                            {stat.icon}
                                        </div>
                                        <h3 className="text-gray-500 font-semibold text-sm mb-1 uppercase tracking-wider">{stat.title}</h3>
                                        <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
                                        <span className="text-xs font-medium text-gray-400">{stat.sub}</span>
                                    </div>
                                ))}
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

                    {/* Edit Coupon Modal */}
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

                </div>
            </main>
            </div>
        </div>
    );
};

export default Seller;
