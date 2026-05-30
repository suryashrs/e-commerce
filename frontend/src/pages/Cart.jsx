import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { API_BASE_URL } from '../config';
import AuthGuardModal from '../components/AuthGuardModal';
import { Tag } from 'lucide-react';

const Cart = () => {
    const { cartItems, updateQuantity, removeFromCart, getCartTotal, cartError, clearCartError, appliedCoupon, applyCoupon, removeCoupon } = useCart();
    const { user, viewMode } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [pointsRedeemed, setPointsRedeemed] = useState(false);
    const [pointsError, setPointsError] = useState('');
    const mockPointsBalance = 0;
    const navigate = useNavigate();

    const handleRedeemClick = () => {
        if (!pointsRedeemed && mockPointsBalance < 500) {
            setPointsError(`Insufficient points. You have ${mockPointsBalance} points, but need 500 points.`);
            return;
        }
        setPointsError('');
        setPointsRedeemed(!pointsRedeemed);
    };

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

    const pointsDiscountAmount = pointsRedeemed ? 50 : 0;
    const finalTotal = Math.max(0, getCartTotal() - calculateDiscount() - pointsDiscountAmount);

    const handleCheckout = (e) => {
        if (!user) {
            e.preventDefault();
            setShowAuthModal(true);
        } else {
            navigate('/checkout');
        }
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
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-black tracking-tight">Shopping Cart</h2>
            
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

            {viewMode !== 'buyer' && (user?.role === 'seller' || user?.role === 'admin') && (
                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
                    <div className="flex gap-4 items-start">
                        <div className="bg-amber-100 p-2 rounded-lg text-lg">🚧</div>
                        <div>
                            <h3 className="text-sm font-black text-amber-900 leading-tight uppercase tracking-widest">Restricted Account</h3>
                            <p className="text-amber-800/80 text-[11px] mt-1 font-medium leading-relaxed">You are in Seller Mode. Switch to Buyer Mode to make purchases.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {cartItems.filter(item => !item.is_flagged).map(item => (
                    <div key={item.id} className="flex items-center p-4 border-b border-gray-100 last:border-0">
                        <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="ml-4 flex-grow">
                            <h3 className="text-sm font-bold text-gray-900">{item.name}</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{item.category}</p>
                                <span className="text-gray-200">|</span>
                                <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest">Size: {item.size}</p>
                            </div>
                            <p className="text-black font-black text-xs mt-0.5">Rs {item.price}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border border-gray-100 rounded-lg overflow-hidden">
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-xs">-</button>
                                <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-xs">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-400 hover:text-rose-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                        <Tag size={20} className="text-gray-700" /> Coupon Code
                    </h3>
                    
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Trend Points</p>
                                <p className="text-gray-500 text-sm">Balance: {mockPointsBalance} points</p>
                            </div>
                            <button 
                                onClick={handleRedeemClick}
                                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                                    pointsRedeemed 
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                            >
                                {pointsRedeemed ? 'Cancel Redemption' : 'Redeem 500 Points for Rs.50'}
                            </button>
                        </div>
                        {pointsError && (
                            <p className="text-red-500 text-sm mt-3">{pointsError}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="ENTER COUPON CODE"
                            className="flex-grow border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all uppercase font-mono tracking-wider"
                            disabled={isApplying}
                        />
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isApplying || !couponCode.trim()}
                            className={`px-8 py-2.5 rounded-lg font-bold transition-all ${
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
                        {pointsRedeemed && (
                            <div className="flex justify-between text-indigo-600 font-medium">
                                <span>TrendPoints Discount</span>
                                <span>-Rs 50.00</span>
                            </div>
                        )}
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-black text-black">Rs {finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={viewMode !== 'buyer' && (user?.role === 'seller' || user?.role === 'admin')}
                        className={`px-8 py-3.5 rounded-xl font-bold transition w-full mt-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-center ${
                            (viewMode !== 'buyer' && (user?.role === 'seller' || user?.role === 'admin'))
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-200' 
                            : 'bg-primary text-white hover:bg-gray-800'
                        }`}
                    >
                        {(viewMode !== 'buyer' && (user?.role === 'seller' || user?.role === 'admin')) ? "🚫 Checkout Disabled" : "Proceed to Checkout"}
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
