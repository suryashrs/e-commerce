import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { MapPin, Tag, CreditCard, CheckCircle2, Circle } from 'lucide-react';

const Checkout = () => {
    const { cartItems, getCartTotal, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        email: user?.email || '',
        street_address: '',
        city: '',
        state_province: '',
        zip_code: '',
        country: 'Nepal'
    });
    
    // Payment Method State
    const [paymentMethod, setPaymentMethod] = useState('esewa');

    // UI State
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Coupon & Points State
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [pointsRedeemed, setPointsRedeemed] = useState(false);
    const [pointsError, setPointsError] = useState('');
    const mockPointsBalance = 418; // Default mock as per screenshot

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Calculate Discounts
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

    // Points Redemption Logic
    const handleRedeemClick = () => {
        if (!pointsRedeemed && mockPointsBalance < 500) {
            setPointsError(`Insufficient points. You have ${mockPointsBalance} points, but need 500 points.`);
            return;
        }
        setPointsError('');
        setPointsRedeemed(!pointsRedeemed);
    };

    // Coupon Application Logic
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

    // Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.street_address || !formData.city || !formData.zip_code) {
            setErrorMessage('Please fill in all required address fields.');
            return;
        }

        if (paymentMethod === 'esewa') {
            handleEsewaCheckout();
        } else {
            handleCODCheckout();
        }
    };

    const handleCODCheckout = () => {
        setProcessing(true);
        setErrorMessage('');

        const orderData = {
            user_id: user?.id || 1, 
            total_amount: finalTotal,
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            email: formData.email,
            payment_method: 'cod',
            address: `${formData.street_address}, ${formData.city}, ${formData.state_province}, ${formData.zip_code}, ${formData.country}`,
            items: cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        fetch(`${API_BASE_URL}/orders/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error placing order');
            return data;
        })
        .then(data => {
            setProcessing(false);
            clearCart();
            navigate('/order-confirmation', { state: { orderData: formData, total: getCartTotal() } });
        })
        .catch(err => {
            setProcessing(false);
            setErrorMessage('Error placing order. Please try again.');
        });
    };

    const handleEsewaCheckout = () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `${API_BASE_URL}/checkout/esewa_init.php`;

        const data = {
            user_id: user?.id || 1,
            total_amount: finalTotal,
            email: formData.email,
            items: cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        
        // Clear the cart on the frontend before redirecting to eSewa.
        // The order is already being created in the backend, so the cart session is technically finished.
        clearCart();
        
        form.submit();
    };

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
                <Link to="/shop" className="text-[#f9b17a] hover:underline font-bold">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-black mb-8 text-gray-900">Checkout</h2>

            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl font-medium flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <span className="text-xl">⚠️</span> {errorMessage}
                    </span>
                    <button type="button" onClick={() => setErrorMessage('')} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                        ✕
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Forms */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <MapPin size={20} className="text-gray-500" /> Shipping Address
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">Street Address</label>
                                <input
                                    type="text"
                                    name="street_address"
                                    value={formData.street_address}
                                    onChange={handleChange}
                                    placeholder="Enter street address"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">State/Province</label>
                                    <input
                                        type="text"
                                        name="state_province"
                                        value={formData.state_province}
                                        onChange={handleChange}
                                        placeholder="State"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">ZIP Code</label>
                                    <input
                                        type="text"
                                        name="zip_code"
                                        value={formData.zip_code}
                                        onChange={handleChange}
                                        placeholder="ZIP Code"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        placeholder="Nepal"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coupon Code Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <Tag size={20} className="text-gray-500" /> Coupon Code
                        </h3>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">Trend Points</p>
                                    <p className="text-gray-500 text-xs">Balance: {mockPointsBalance} points</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleRedeemClick}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
                                        pointsRedeemed 
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                        : 'bg-black hover:bg-gray-800 text-white'
                                    }`}
                                >
                                    {pointsRedeemed ? 'Cancel' : 'Redeem 500 Points for Rs.50'}
                                </button>
                            </div>
                            {pointsError && (
                                <p className="text-red-500 text-xs mt-2 font-medium">{pointsError}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="ENTER COUPON CODE"
                                className="flex-grow border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-colors uppercase"
                            />
                            <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={isApplying || !couponCode.trim()}
                                className={`px-6 py-2.5 rounded-lg font-bold transition-colors ${
                                    isApplying || !couponCode.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-black hover:bg-gray-800 text-white'
                                }`}
                            >
                                Apply
                            </button>
                        </div>
                        
                        {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                        {couponSuccess && <p className="text-green-600 text-xs mt-2 font-medium">{couponSuccess}</p>}

                        {appliedCoupon && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block">Applied</span>
                                    <span className="font-bold text-gray-900">{appliedCoupon.code}</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => { removeCoupon(); setCouponSuccess(''); }}
                                    className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold"
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <CreditCard size={20} className="text-gray-500" /> Payment Method
                        </h3>
                        
                        <div className="space-y-4">
                            <label 
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                                    paymentMethod === 'esewa' 
                                    ? 'border-[#60bb46] bg-[#60bb46]/5' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="mr-4 text-[#60bb46]">
                                    {paymentMethod === 'esewa' ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-gray-300" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-6">
                                        <img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="h-4 object-contain" />
                                        <p className="font-bold text-sm text-gray-900">eSewa</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Pay securely with eSewa</p>
                                </div>
                                <input 
                                    type="radio" name="paymentMethod" value="esewa" 
                                    checked={paymentMethod === 'esewa'} 
                                    onChange={(e) => setPaymentMethod(e.target.value)} 
                                    className="hidden" 
                                />
                            </label>

                            <label 
                                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                                    paymentMethod === 'cod' 
                                    ? 'border-gray-900 bg-gray-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="mr-4 text-gray-900">
                                    {paymentMethod === 'cod' ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-gray-300" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">Cash on Delivery</p>
                                    <p className="text-xs text-gray-500 mt-1">Pay when you receive your order</p>
                                </div>
                                <input 
                                    type="radio" name="paymentMethod" value="cod" 
                                    checked={paymentMethod === 'cod'} 
                                    onChange={(e) => setPaymentMethod(e.target.value)} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                    </div>

                </div>

                {/* Right Column - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-6 text-gray-900">Order Summary</h3>
                        
                        <div className="space-y-4 mb-6">
                            {cartItems.filter(item => !item.is_flagged).map(item => (
                                <div key={item.id} className="flex justify-between items-start gap-4">
                                    <p className="text-sm text-gray-600 line-clamp-2 pr-4 flex-grow">
                                        {item.name} <span className="text-gray-400">x {item.quantity}</span>
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                        Rs.{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t border-gray-100 pt-4 space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-900 font-medium">Rs.{getCartTotal().toFixed(2)}</span>
                            </div>
                            
                            {appliedCoupon && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Discount ({appliedCoupon.code})</span>
                                    <span className="text-green-600 font-medium">-Rs.{calculateDiscount().toFixed(2)}</span>
                                </div>
                            )}
                            
                            {pointsRedeemed && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-indigo-600">Trend Points Discount</span>
                                    <span className="text-indigo-600 font-medium">-Rs.50.00</span>
                                </div>
                            )}

                            <div className="flex justify-between text-lg font-black pt-2 border-t border-gray-100 text-gray-900 mt-2">
                                <span>Total</span>
                                <span>Rs.{finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className={`w-full py-3.5 rounded-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                                processing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-lg'
                            } ${
                                paymentMethod === 'esewa'
                                ? 'bg-[#21a64c] hover:bg-[#1a8c3d] text-white'
                                : 'bg-gray-900 hover:bg-black text-white'
                            }`}
                        >
                            {processing ? (
                                'Processing...'
                            ) : paymentMethod === 'esewa' ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    Pay with eSewa
                                </>
                            ) : (
                                'Place Order'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
