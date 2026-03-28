import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/read.php`);
            setProducts(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await axios.delete(`${API_BASE_URL}/products/manage.php`, { data: { id } });
                setProducts(products.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product.");
            }
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Product Management</h1>
                <Link
                    to="/admin/products/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
                >
                    + Add Product
                </Link>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Image</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Name</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Category</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Price</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Stock</th>
                            <th className="p-4 text-sm font-semibold text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-750 transition">
                                <td className="p-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    </div>
                                </td>
                                <td className="p-4 text-white font-medium">{product.name}</td>
                                <td className="p-4 text-gray-400">{product.category}</td>
                                <td className="p-4 text-white font-bold">Rs {product.price}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                        product.stock <= 0 ? 'bg-red-500/20 text-red-500' : 
                                        product.stock < 10 ? 'bg-yellow-500/20 text-yellow-500' : 
                                        'bg-green-500/20 text-green-500'
                                    }`}>
                                        {product.stock}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex space-x-3">
                                        <Link
                                            to={`/admin/products/edit/${product.id}`}
                                            className="text-blue-400 hover:text-blue-300 font-medium"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-400 hover:text-red-300 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No products found. Add one to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
