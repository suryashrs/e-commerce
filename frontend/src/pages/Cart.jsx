import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { API_BASE_URL } from '../config';
import AuthGuardModal from '../components/AuthGuardModal';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, cartError, clearCartError, appliedCoupon, applyCoupon, removeCoupon } = useCart();
    const { user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        return () => clearCartError();
    }, [clearCartError]);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        
        setIsApplying(true);
        setCouponError('');
        setCouponSuccess('');
        
        try {
            const response = await fetch(`${API_BASE_URL}/coupons/validate.php?code=${couponCode}`);
            const data = await response.json();
            
            if (response.ok) {
                applyCoupon(data);
                setCouponSuccess(`Success! '${data.code}' applied.`);
                setCouponCode('');
            } else {
                setCouponError(data.message || 'Invalid coupon code.');
                removeCoupon();
            }
        } catch (error) {
            setCouponError('Error validating coupon. Please try again.');
        } finally {
            setIsApplying(false);
        }
    };

    const calculateDiscount = () => {
        if (!appliedCoupon) return 0;
        const subtotal = getCartTotal();
        if (appliedCoupon.discount_type === 'percentage') {
            return (subtotal * appliedCoupon.discount_value) / 100;
        } else {
            return Math.min(subtotal, appliedCoupon.discount_value);
        }
    };

    const finalTotal = getCartTotal() - calculateDiscount();

    const handleCheckout = (e) => {
        if (!user) {
            e.preventDefault();
            setShowAuthModal(true);
        } else {
            navigate('/checkout');
        }
    };

    const handleEsewaCheckout = () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${API_BASE_URL}/checkout/esewa_init.php`;

        const data = {
            user_id: user.id,
            total_amount: finalTotal,
            items: cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        // Add fields to form
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    };

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
                <p className="text-gray-600 mb-6">Add some items to get started!</p>
                <Link to="/shop" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition inline-block">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Shopping Cart</h2>
            
            {cartError && (
                <div className="mb-6 mx-auto p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl font-medium flex justify-between items-center animate-shake max-w-4xl">
                    <span className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span> {cartError}
                    </span>
                    <button onClick={clearCartError} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            {(user?.role === 'seller' || user?.role === 'admin') && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex gap-4 items-start">
                        <div className="bg-amber-100 p-3 rounded-xl text-2xl">🚧</div>
                        <div>
                            <h3 className="text-lg font-black text-amber-900 leading-tight">Purchasing Restricted for Merchant Accounts</h3>
                            <p className="text-amber-800/80 text-sm mt-1 font-medium">To maintain platform integrity, seller and admin accounts are prohibited from making purchases. Please create or use a separate buyer account for shopping.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {cartItems.filter(item => !item.is_flagged).map(item => (
                    <div key={item.id} className="flex items-center p-6 border-b border-gray-100 last:border-0">
                        <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                        <div className="ml-6 flex-grow">
                            <h3 className="text-lg font-semibold">{item.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-gray-500 text-sm">{item.category}</p>
                                <span className="text-gray-300">|</span>
                                <p className="text-black text-sm font-bold">Size: {item.size}</p>
                            </div>
                            <p className="text-accent font-semibold mt-1">Rs {item.price}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border rounded-lg">
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-3 py-2 hover:bg-gray-100">-</button>
                                <span className="px-4 py-2 border-x">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-3 py-2 hover:bg-gray-100">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-500 hover:text-red-700 ml-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Coupon Box */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="text-xl">🎟️</span> Have a Coupon Code?
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter code (e.g. DEAL10)"
                            className="flex-grow border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all uppercase font-mono tracking-wider"
                            disabled={isApplying}
                        />
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isApplying || !couponCode.trim()}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${
                                isApplying || !couponCode.trim()
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-black text-white hover:bg-gray-800 shadow-md'
                            }`}
                        >
                            {isApplying ? '...' : 'Apply'}
                        </button>
                    </div>
                    {couponError && <p className="text-red-500 text-sm mt-3 font-medium">⚠️ {couponError}</p>}
                    {couponSuccess && <p className="text-green-600 text-sm mt-3 font-medium">✅ {couponSuccess}</p>}
                    
                    {appliedCoupon && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center animate-fade-in">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Applied Code</span>
                                <span className="font-bold text-gray-900">{appliedCoupon.code}</span>
                                <span className="ml-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    {appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `Rs ${appliedCoupon.discount_value} OFF`}
                                </span>
                            </div>
                            <button 
                                onClick={() => { removeCoupon(); setCouponSuccess(''); }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-semibold">Rs {getCartTotal().toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>Discount ({appliedCoupon.code})</span>
                                <span>-Rs {calculateDiscount().toFixed(2)}</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-black text-black">Rs {finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={user?.role === 'seller' || user?.role === 'admin'}
                        className={`px-8 py-3.5 rounded-xl font-bold transition w-full mt-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center ${
                            (user?.role === 'seller' || user?.role === 'admin') 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-200' 
                            : 'bg-primary text-white hover:bg-gray-800'
                        }`}
                    >
                        {(user?.role === 'seller' || user?.role === 'admin') ? "🚫 Checkout Disabled" : "Proceed to Checkout"}
                    </button>
                    
                    <div className="relative my-4 flex items-center">
                        <div className="flex-grow border-t border-gray-100"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <button
                        onClick={handleEsewaCheckout}
                        disabled={user?.role === 'seller' || user?.role === 'admin'}
                        className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 hover:-translate-y-0.5 active:translate-y-0 ${
                            (user?.role === 'seller' || user?.role === 'admin')
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                            : 'bg-[#60bb46] hover:bg-[#52a63b] text-white'
                        }`}
                    >
                        <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className={`h-6 ${(user?.role === 'seller' || user?.role === 'admin') ? 'grayscale opacity-50' : 'brightness-0 invert'}`} />
                        {(user?.role === 'seller' || user?.role === 'admin') ? "🚫 Payment Disabled" : "Pay with eSewa"}
                    </button>
                    <Link to="/shop" className="mt-4 text-gray-500 hover:text-black hover:underline block text-center text-sm font-medium">
                        &larr; Continue Shopping
                    </Link>
                </div>
            </div>
            <AuthGuardModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                message="Please log in to proceed to checkout."
            />
        </div>
    );
};

export default Cart;
