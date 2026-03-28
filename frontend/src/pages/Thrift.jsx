import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";

const Thrift = () => {
    const [thriftProducts, setThriftProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCondition, setSelectedCondition] = useState("all");
    const [sortBy, setSortBy] = useState("");
    const [priceRange, setPriceRange] = useState([0, 10000]);
    const { toggleWishlist, isInWishlist } = useWishlist();

    // Product conditions for thrift items
    const conditions = [
        { value: "all", label: "All Conditions" },
        { value: "like-new", label: "Like New" },
        { value: "excellent", label: "Excellent" },
        { value: "good", label: "Good" },
        { value: "fair", label: "Fair" },
    ];

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                // Only show products explicitly listed as 'thrift' category
                const thriftItems = data
                    .filter(p => p.category?.toLowerCase() === 'thrift')
                    .map(product => ({
                        ...product,
                        condition: 'good', // Default condition for uploaded thrift items
                    }));

                setThriftProducts(thriftItems);
                setFilteredProducts(thriftItems);
            } catch (error) {
                console.error("Failed to load products", error);
            }
        };
        loadProducts();
    }, []);

    useEffect(() => {
        let filtered = [...thriftProducts];

        // Condition filter
        if (selectedCondition !== "all") {
            filtered = filtered.filter((p) => p.condition === selectedCondition);
        }

        // Price filter
        filtered = filtered.filter((p) => {
            const price = parseFloat(p.price);
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Sort
        if (sortBy === "price-low") {
            filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sortBy === "price-high") {
            filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        }

        setFilteredProducts(filtered);
    }, [selectedCondition, sortBy, priceRange, thriftProducts]);

    const getConditionBadgeColor = (condition) => {
        switch (condition) {
            case "like-new":
                return "bg-green-100 text-green-700 border-green-300";
            case "excellent":
                return "bg-blue-100 text-blue-700 border-blue-300";
            case "good":
                return "bg-yellow-100 text-yellow-700 border-yellow-300";
            case "fair":
                return "bg-orange-100 text-orange-700 border-orange-300";
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    return (
        <div>
            {/* Hero Section */}
            <section className="relative mb-12 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] animate-pulse"></div>
                </div>
                <div className="relative z-10 py-16 px-8 text-center">
                    <div className="inline-block mb-4">
                        <span className="text-6xl">♻️</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
                        Thrift Shop
                    </h1>
                    <p className="text-xl text-white mb-6 font-light drop-shadow-md max-w-2xl mx-auto">
                        Discover sustainable fashion with pre-loved treasures. Save money,
                        save the planet, and look fabulous doing it! 🌍✨
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold">
                            💚 Eco-Friendly
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold">
                            💰 Up to 70% Off
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-semibold">
                            ⭐ Quality Checked
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <div className="grid grid-cols-1 gap-6 mb-12 max-w-md mx-auto">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-6 text-center shadow-lg">
                    <div className="text-4xl font-bold text-black mb-2">
                        {filteredProducts.length}
                    </div>
                    <div className="text-gray-700 font-medium">Items Available</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 p-6 sticky top-4">
                        <h3 className="font-bold text-xl mb-6 text-black">
                            Filters
                        </h3>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2 text-gray-700">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-black bg-white"
                            >
                                <option value="">Default</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="savings">Best Savings</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2 text-gray-700">
                                Condition
                            </label>
                            <div className="space-y-2">
                                {conditions.map((cond) => (
                                    <button
                                        key={cond.value}
                                        onClick={() => setSelectedCondition(cond.value)}
                                        className={`block w-full text-left px-3 py-2 rounded-lg font-medium transition ${selectedCondition === cond.value
                                            ? "bg-black text-white shadow-md"
                                            : "hover:bg-gray-100"
                                            }`}
                                    >
                                        {cond.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2 text-gray-700">
                                Price Range
                            </label>
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    type="text"
                                    value={priceRange[0]}
                                    onChange={(e) =>
                                        setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
                                    }
                                    className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 focus:border-black focus:outline-none"
                                />
                                <span className="font-bold">-</span>
                                <input
                                    type="text"
                                    value={priceRange[1]}
                                    onChange={(e) =>
                                        setPriceRange([priceRange[0], parseInt(e.target.value) || 0])
                                    }
                                    className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 focus:border-black focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 mt-6">
                            <h4 className="font-bold text-black mb-2">
                                🌱 Why Buy Thrift?
                            </h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✓ Reduce waste</li>
                                <li>✓ Save money</li>
                                <li>✓ Unique finds</li>
                                <li>✓ Support sustainability</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="lg:col-span-3">
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-black">
                            Pre-Loved Treasures
                        </h2>
                        <p className="text-gray-600 mt-2">
                            {filteredProducts.length} sustainable style{filteredProducts.length !== 1 ? "s" : ""} waiting for you
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="group relative">
                                <Link
                                    to={`/product/${product.id}`}
                                    className="block"
                                >
                                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-black hover:shadow-2xl transition-all duration-300 relative">
                                        {/* Pre-loved Badge */}
                                        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                            ♻️ Pre-loved
                                        </div>

                                        {/* Wishlist Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleWishlist(product);
                                            }}
                                            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform z-10"
                                            title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill={isInWishlist(product.id) ? "currentColor" : "none"}
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                style={{ color: isInWishlist(product.id) ? "#ef4444" : "#000" }}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                />
                                            </svg>
                                        </button>

                                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>

                                        <div className="p-5">
                                            <h3 className="text-lg font-bold mb-1 text-gray-800">
                                                {product.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2 font-medium">
                                                {product.category}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-black">
                                                    Rs {product.price}
                                                </span>
                                                <span className="text-gray-600 text-sm font-semibold group-hover:underline">
                                                    Buy Now →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-gray-500 text-lg mb-2">
                                No thrift items found matching your criteria.
                            </p>
                            <p className="text-gray-400">
                                Try adjusting your filters to see more items.
                            </p>
                            <button
                                onClick={() => {
                                    setSelectedCondition("all");
                                    setPriceRange([0, 100]);
                                    setSortBy("");
                                }}
                                className="mt-4 bg-black text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <section className="mt-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-8">
                <h2 className="text-3xl font-bold mb-6 text-center text-black">
                    About Our Thrift Shop
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-4xl mb-3">🌍</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">
                            Sustainable Fashion
                        </h3>
                        <p className="text-gray-600">
                            Every purchase helps reduce textile waste and supports circular
                            fashion economy.
                        </p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">✨</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">
                            Quality Assured
                        </h3>
                        <p className="text-gray-600">
                            All items are carefully inspected and rated by condition for your
                            confidence.
                        </p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">💝</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">
                            Unique Finds
                        </h3>
                        <p className="text-gray-600">
                            Discover one-of-a-kind pieces and vintage treasures you won't
                            find anywhere else.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Thrift;
