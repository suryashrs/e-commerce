import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
const heroImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        const visibleProducts = data.filter(p => !p.is_try_on_only);
        setFeaturedProducts(visibleProducts.slice(0, 6));
      } catch (error) {
        console.error("Failed to load products", error);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="space-y-12">
      <section className="relative text-center py-24 bg-gradient-to-r from-black via-gray-800 to-gray-600 rounded-3xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src={heroImage}
            alt="Fashion Hero"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10">
          <h1 className="text-6xl font-bold mb-6 text-white drop-shadow-lg">
            WearItNow
          </h1>
          <p className="text-2xl text-white mb-8 font-light drop-shadow-md">
            Discover the latest trends and try them on virtually
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-white text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition inline-block shadow-lg"
            >
              Shop Now
            </Link>
            <Link
              to="/thrift"
              className="bg-gray-700 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-800 transition inline-block shadow-lg"
            >
              ♻️ Thrift Shop
            </Link>
            <Link
              to="/try-on"
              className="bg-black text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-900 transition inline-block shadow-lg"
            >
              Try Virtual Try-On
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-4xl font-bold mb-8 text-center text-black">
          Featured Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {featuredProducts.map((product) => (
            <div key={product.id} className="group relative">
              <Link
                to={`/product/${product.id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-black hover:shadow-2xl transition-all duration-300">
                  <div className="aspect-square overflow-hidden bg-gray-100 relative">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${product.stock <= 0 ? 'opacity-50 grayscale-[0.5]' : ''}`}
                    />
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                          Out of Stock
                        </span>
                      </div>
                    )}
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
                        className="h-6 w-6"
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
                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-1 text-gray-800">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 font-medium">
                      {product.category}
                    </p>
                    <span className="text-2xl font-bold text-black">
                      Rs {product.price}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/shop" className="text-accent hover:underline text-lg">
            View All Products &rarr;
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-4xl font-bold mb-8 text-center text-black">
          Shop by Category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["Tops", "Bottoms", "Outerwear", "Accessories"].map((category) => (
            <Link
              key={category}
              to={`/shop?category=${category}`}
              className="bg-gradient-to-br from-black to-gray-700 p-8 rounded-2xl shadow-lg text-center hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <h3 className="text-2xl font-bold mb-2 text-white">{category}</h3>
              <span className="text-white font-medium">Explore &rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
