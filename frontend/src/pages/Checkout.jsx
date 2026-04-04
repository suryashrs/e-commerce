import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
    const { cartItems, getCartTotal, clearCart, appliedCoupon } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        zip: '',
        phone: ''
    });
    const [processing, setProcessing] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        // Prepare order data
        const orderData = {
            user_id: user?.id || 1, // Use actual user ID
            total_amount: finalTotal,
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            items: cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        // Submit to API
        fetch(`${API_BASE_URL}/orders/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        })
            .then(res => res.json())
            .then(data => {
                setProcessing(false);
                clearCart();
                navigate('/order-confirmation', { state: { orderData: formData, total: getCartTotal() } });
            })
            .catch(err => {
                setProcessing(false);
                alert('Error placing order. Please try again.');
            });
    };

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">No items in cart</h2>
                <Link to="/shop" className="text-accent hover:underline">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Checkout</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Shipping Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-bold mb-6">Shipping Information</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Address *</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">ZIP Code *</label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Phone *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:bg-gray-400"
                        >
                            {processing ? 'Processing...' : 'Place Order'}
                        </button>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-4">
                    <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                    <div className="space-y-4 mb-6">
                        {cartItems.filter(item => !item.is_flagged).map(item => (
                            <div key={item.id} className="flex gap-4">
                                <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-sm">{item.name}</h4>
                                    <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <span className="font-semibold">Rs {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>Rs {getCartTotal().toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount ({appliedCoupon.code}):</span>
                                <span>-Rs {calculateDiscount().toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span>Rs {finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
