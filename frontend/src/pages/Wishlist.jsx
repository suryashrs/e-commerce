import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const Wishlist = () => {
    const { wishlistItems, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product) => {
        addToCart(product);
    };

    const handleRemove = (productId) => {
        removeFromWishlist(productId);
    };

    return (
        <div className="space-y-8">
            <section className="text-center py-12 bg-gradient-to-r from-black via-gray-800 to-gray-600 rounded-3xl shadow-2xl">
                <h1 className="text-5xl font-bold mb-4 text-white">❤️ My Wishlist</h1>
                <p className="text-xl text-white">
                    {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
                </p>
            </section>

            {wishlistItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                    <div className="text-6xl mb-6">💔</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">
                        Your Wishlist is Empty
                    </h2>
                    <p className="text-gray-600 mb-8 text-lg">
                        Start adding products you love to your wishlist!
                    </p>
                    <Link
                        to="/shop"
                        className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition inline-block shadow-lg"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {wishlistItems.filter(p => !p.is_flagged).map((product) => (
                        <div
                            key={product.id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-black transition-all duration-300 group"
                        >
                            <Link to={`/product/${product.id}`} className="block">
                                <div className="aspect-square overflow-hidden bg-gray-100">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            </Link>
                            <div className="p-5">
                                <Link to={`/product/${product.id}`}>
                                    <h3 className="text-lg font-bold mb-1 text-gray-800 hover:text-gray-600 transition">
                                        {product.name}
                                    </h3>
                                </Link>
                                <p className="text-gray-600 text-sm mb-2 font-medium">
                                    {product.category}
                                </p>
                                <p className="text-2xl font-bold text-black mb-4">
                                    Rs {product.price}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="flex-1 bg-black text-white px-4 py-2 rounded-full font-bold hover:bg-gray-800 transition"
                                    >
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => handleRemove(product.id)}
                                        className="px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                                        title="Remove from wishlist"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <section className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-12 shadow-lg text-center">
                <h2 className="text-3xl font-bold mb-4 text-black">
                    💡 Wishlist Tips
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                        <div className="text-4xl mb-3">👁️</div>
                        <h4 className="font-bold text-lg mb-2">Keep Track</h4>
                        <p className="text-gray-600 text-sm">
                            Save items you're interested in and come back to them later
                        </p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">🔔</div>
                        <h4 className="font-bold text-lg mb-2">Get Notified</h4>
                        <p className="text-gray-600 text-sm">
                            We'll notify you when wishlist items go on sale (coming soon)
                        </p>
                    </div>
                    <div>
                        <div className="text-4xl mb-3">🎁</div>
                        <h4 className="font-bold text-lg mb-2">Share</h4>
                        <p className="text-gray-600 text-sm">
                            Share your wishlist with friends and family (coming soon)
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Wishlist;
