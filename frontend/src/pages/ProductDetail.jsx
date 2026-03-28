import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import AuthGuardModal from "../components/AuthGuardModal";
import { fetchProduct } from "../services/api";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, cartError, clearCartError, cartSuccess, clearCartSuccess } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWishlistSuccess, setShowWishlistSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userImage, setUserImage] = useState(null);
  const [showTryOn, setShowTryOn] = useState(false);
  const [productScale, setProductScale] = useState(0.35);
  const [productPositionY, setProductPositionY] = useState(0.3);
  const [opacity, setOpacity] = useState(0.8);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const sizes = ["M", "L", "XL", "XXL", "4XL"];

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProduct(id);
        setProduct(data);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
    return () => {
      clearCartError();
      clearCartSuccess();
    };
  }, [id, clearCartError, clearCartSuccess]);

  useEffect(() => {
    if (userImage && product && showTryOn) {
      drawCanvas(userImage);
    }
  }, [productScale, productPositionY, opacity]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setUserImage(img);
          setShowTryOn(true);
          setTimeout(() => drawCanvas(img), 100);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = (bgImage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const scale = Math.min(600 / bgImage.width, 500 / bgImage.height, 1);
    canvas.width = bgImage.width * scale;
    canvas.height = bgImage.height * scale;

    // Draw user image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

    // Draw product overlay
    if (product && product.image_url) {
      const productImg = new Image();
      productImg.crossOrigin = "Anonymous";
      productImg.onload = () => {
        ctx.globalAlpha = opacity;
        const pWidth = canvas.width * productScale;
        const pHeight = (productImg.height / productImg.width) * pWidth;
        const x = (canvas.width - pWidth) / 2;
        const y = canvas.height * productPositionY - pHeight / 2;

        ctx.drawImage(productImg, x, y, pWidth, pHeight);
        ctx.globalAlpha = 1.0;
      };
      productImg.src = product.image_url;
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const success = addToCart(product, quantity, selectedSize);
    if (success) {
      setShowSuccess(true);
    }
  };

  const handleWishlistToggle = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const inWishlist = isInWishlist(product.id);
    console.log('Toggling wishlist. Currently in wishlist:', inWishlist);
    toggleWishlist(product);
    if (!inWishlist) {
      console.log('Item was not in wishlist. Showing success popup.');
      setShowWishlistSuccess(true);
    } else {
      console.log('Item was in wishlist. Removing.');
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `tryon-${product.name}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (!product) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        to="/shop"
        className="text-black hover:text-gray-600 mb-4 inline-block font-semibold"
      >
        &larr; Back to Shop
      </Link>

      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 transform transition-all scale-100">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2 text-black">Added to Cart!</h3>
            <p className="text-gray-600 mb-6">
              {product.name} (Size: {selectedSize}) is now in your cart.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/cart"
                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
              >
                View Cart
              </Link>
              <button
                onClick={() => setShowSuccess(false)}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {showWishlistSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 transform transition-all scale-100">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-2xl font-bold mb-2 text-black">Added to Wishlist!</h3>
            <p className="text-gray-600 mb-6">
              {product.name} is saved for later.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/wishlist"
                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
              >
                View Wishlist
              </Link>
              <button
                onClick={() => setShowWishlistSuccess(false)}
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthGuardModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Please log in to add items to your cart or wishlist."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full rounded-xl shadow-md"
            />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-black">
            {product.name}
          </h1>
          <p className="text-gray-600 mb-6 text-lg">{product.description}</p>
          <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
            <span className="text-4xl font-bold text-black">
              Rs {product.price}
            </span>
            <span className="text-sm text-white bg-black px-4 py-2 rounded-full font-semibold shadow-md">
              {product.category}
            </span>
          </div>

          <div className="mb-6">
            {product.stock > 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-700 font-bold">
                  In Stock ({product.stock} available)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-red-700 font-bold text-lg uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block font-bold text-lg mb-4">Select Size:</label>
            <div className="flex flex-wrap gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${
                    selectedSize === size
                      ? "bg-black text-white border-black shadow-md scale-105"
                      : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <label className="font-bold text-lg">Quantity:</label>
            <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-black"
              >
                -
              </button>
              <span className="px-6 py-2 bg-white font-bold text-lg">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-black disabled:opacity-50"
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          {cartError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm font-bold flex justify-between items-center animate-shake">
              <span>⚠️ {cartError}</span>
              <button onClick={clearCartError} className="hover:scale-110 transition-transform">✕</button>
            </div>
          )}

          {cartSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm font-bold flex justify-between items-center animate-bounce-in">
              <span>✅ {cartSuccess}</span>
              <button onClick={clearCartSuccess} className="hover:scale-110 transition-transform">✕</button>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                product.stock > 0 
                  ? "bg-black text-white hover:bg-gray-800" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {product.stock > 0 ? "🛒 Add to Cart" : "🚫 Out of Stock"}
            </button>
            <button
              onClick={handleWishlistToggle}
              className="px-6 py-4 bg-white border-2 border-black rounded-xl hover:bg-gray-50 transition shadow-lg"
              title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
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
          </div>
        </div>

        {/* Virtual Try-On */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-300">
          <h2 className="text-3xl font-bold mb-6 text-black flex items-center gap-2">
            🎨 Virtual Try-On
          </h2>

          {!showTryOn ? (
            <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-12">
              <div className="text-6xl mb-6">👗</div>
              <p className="text-gray-600 mb-6 text-lg font-medium">
                Upload your photo to see how this item looks on you!
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
              >
                📸 Upload Photo
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  className="max-w-full rounded-xl shadow-lg mx-auto"
                />
              </div>

              {/* Controls */}
              <div className="space-y-4 mb-4 bg-gray-50 p-4 rounded-xl">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    Size: {Math.round(productScale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.7"
                    step="0.05"
                    value={productScale}
                    onChange={(e) =>
                      setProductScale(parseFloat(e.target.value))
                    }
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    Position
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.01"
                    value={productPositionY}
                    onChange={(e) =>
                      setProductPositionY(parseFloat(e.target.value))
                    }
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-700">
                    Opacity: {Math.round(opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="1"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-black"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={downloadImage}
                  className="flex-1 bg-black text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-md"
                >
                  💾 Download
                </button>
                <button
                  onClick={() => {
                    setShowTryOn(false);
                    setUserImage(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
                >
                  🔄 Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default ProductDetail;
