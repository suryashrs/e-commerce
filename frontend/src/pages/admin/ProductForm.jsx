import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../config";
import axios from "axios";

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        image_url: "",
        stock: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products/single.php?id=${id}`);
            const { name, price, category, description, image_url, stock } = response.data;
            setFormData({ name, price, category, description, image_url, stock: stock?.toString() || "" });
        } catch (err) {
            console.error("Error fetching product:", err);
            setError("Failed to load product details.");
        }
    };

    const [imageFile, setImageFile] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image") {
            setImageFile(files[0]);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("price", formData.price);
            data.append("category", formData.category);
            data.append("description", formData.description);
            data.append("stock", formData.stock);
            // If editing, only send image if new file selected or using existing URL
            if (imageFile) {
                data.append("image", imageFile);
            } else if (formData.image_url) {
                data.append("image_url", formData.image_url);
            }
            if (isEditMode) {
                data.append("id", id);
                data.append("_method", "PUT"); // PHP doesn't parse multipart PUT well, so we simulate it
            }

            // Always POST for multipart/form-data
            await axios.post(`${API_BASE_URL}/products/manage.php`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate("/admin/products");
        } catch (err) {
            console.error("Error saving product:", err);
            setError("Failed to save product. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{isEditMode ? "Edit Product" : "Add New Product"}</h1>
                <Link to="/admin/products" className="text-gray-400 hover:text-white transition">
                    &larr; Back to Products
                </Link>
            </div>

            {error && (
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Product Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        placeholder="e.g. Classic Leather Jacket"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Price (Rs)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                            placeholder="2500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        >
                            <option value="">Select Category</option>
                            <option value="Tops">Tops</option>
                            <option value="Bottoms">Bottoms</option>
                            <option value="Outerwear">Outerwear</option>
                            <option value="Dresses">Dresses</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Footwear">Footwear</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Stock Quantity</label>
                        <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                            placeholder="50"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Product Image</label>
                    <input
                        type="file"
                        name="image"
                        onChange={handleChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        accept="image/*"
                    />
                    {imageFile ? (
                        <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden bg-gray-700">
                            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : formData.image_url && (
                        <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden bg-gray-700">
                            <img src={formData.image_url} alt="Current" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                        placeholder="Detailed description of the product..."
                    ></textarea>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
