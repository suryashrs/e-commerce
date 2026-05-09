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
        <div className="max-w-2xl mx-auto text-center mt-10">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-xl font-black tracking-tight mb-2">Order Confirmed!</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                    Thank you for your purchase, {orderData.name}!
                </p>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 text-sm">
                    <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500 mb-4 text-left">Shipping Details</h3>
                    <div className="text-left space-y-2 text-gray-700">
                        <p><span className="font-bold">Address:</span> {orderData.address}</p>
                        <p><span className="font-bold">City:</span> {orderData.city}, {orderData.zip}</p>
                        <p><span className="font-bold">Phone:</span> {orderData.phone}</p>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-8">
                    <p className="text-sm font-black uppercase tracking-widest text-green-700">Total Paid: Rs {total?.toFixed(2)}</p>
                </div>

                {/* Return Policy Section - Compliant with Nepalese Consumer Law */}
                <div className="border-t border-gray-100 pt-8 mb-8 text-left">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="font-black uppercase tracking-widest text-[10px] text-gray-500">Return Policy</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                In accordance with our <span className="text-red-600 font-black">No Refund Policy</span>, all purchases are final. However, in compliance with the <span className="text-black font-black">Consumer Protection Act, 2075 (Nepal)</span>, you are eligible for an exchange or store credit within <span className="text-indigo-600 font-black">7 days</span> of delivery if:
                            </p>
                            <ul className="mt-3 space-y-2">
                                {[
                                    "The product is defective or damaged upon arrival.",
                                    "The product does not match the description or image.",
                                    "The size or color is different from what was ordered."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-gray-500">
                                        <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <p className="text-[9px] text-gray-400 italic px-2">
                            * Note: Items must be in original packaging with tags intact. Please note that we do not offer cash refunds for any purchases. Approved returns will be issued as store credit or direct exchanges.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link to="/shop" className="bg-black text-white px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition shadow-lg">
                        Continue Shopping
                    </Link>
                    <Link to="/" className="bg-gray-100 text-gray-500 px-5 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
