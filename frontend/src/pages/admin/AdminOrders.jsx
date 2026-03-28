import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            // We reuse the stats endpoint or create a specific one. 
            // Let's create a specific one for reading all orders, but for now we can read from a new endpoint.
            // I'll create `orders/read_all.php` next.
            const response = await axios.get(`${API_BASE_URL}/orders/read_all.php`);
            setOrders(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="text-white">Loading orders...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Order Management</h1>

            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Order ID</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Customer</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Total</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-750 transition">
                                <td className="p-4 text-white font-medium">#{order.id}</td>
                                <td className="p-4 text-gray-300">{order.name}</td>
                                <td className="p-4 text-white font-bold">Rs {parseFloat(order.total_amount).toFixed(2)}</td>
                                <td className="p-4">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">{new Date(order.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No orders found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
