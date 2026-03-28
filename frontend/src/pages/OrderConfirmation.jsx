import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const OrderConfirmation = () => {
    const location = useLocation();
    const { orderData, total } = location.state || {};

    if (!orderData) {
        return (
            <div className="text-center py-20">
                <p>No order found.</p>
                <Link to="/shop" className="text-accent hover:underline">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-3xl font-bold mb-4">Order Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                    Thank you for your purchase, {orderData.name}! We've sent a confirmation email to {orderData.email}.
                </p>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="font-bold mb-4">Shipping Details</h3>
                    <div className="text-left space-y-2 text-gray-700">
                        <p><span className="font-semibold">Address:</span> {orderData.address}</p>
                        <p><span className="font-semibold">City:</span> {orderData.city}, {orderData.zip}</p>
                        <p><span className="font-semibold">Phone:</span> {orderData.phone}</p>
                    </div>
                </div>

                <div className="bg-accent bg-opacity-10 rounded-lg p-4 mb-6">
                    <p className="text-lg"><span className="font-semibold">Order Total:</span> Rs {total?.toFixed(2)}</p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link to="/shop" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition">
                        Continue Shopping
                    </Link>
                    <Link to="/" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
