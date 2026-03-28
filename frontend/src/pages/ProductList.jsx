import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const { toggleWishlist, isInWishlist } = useWishlist();

  const categoryParam = searchParams.get("category");
  // Only use search query param if we don't have local search input
  const queryToUse = searchInput !== "" ? searchInput : searchParams.get("search");
  // Initialize category and search from URL params if present
  useEffect(() => {
    if (searchParams.get("search")) {
        setSearchInput(searchParams.get("search"));
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        const mainProducts = data.filter(p => !p.is_try_on_only);
        setProducts(mainProducts);
        setFilteredProducts(mainProducts);
      } catch (error) {
        console.error("Failed to load products", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    // Category filter
    // If URL has category Param, but local selection isn't "All Categories", rely on the local param? 
    // Wait, let's keep it simple: category is handled by URL param or we introduce a local category state.
    // The user screenshot shows "Category" dropdown. Let's filter by categoryParam if exists.
    if (categoryParam) {
      filtered = filtered.filter((p) => p.category === categoryParam);
    }

    // Search filter
    if (queryToUse) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(queryToUse.toLowerCase()) ||
          p.description.toLowerCase().includes(queryToUse.toLowerCase())
      );
    }

    // Size filter
    if (selectedSize) {
      filtered = filtered.filter((p) => {
          if (!p.sizes) return false;
          // Sizes are usually stored as comma-separated string from our earlier implementation
          const sizesArray = p.sizes.split(',').map(s => s.trim().toUpperCase());
          return sizesArray.includes(selectedSize.toUpperCase());
      });
    }

    // Collection filter (Mock implementation - could be based on condition or tags if DB supports)
    if (selectedCollection && selectedCollection !== "All Products") {
        if (selectedCollection === "New Arrivals") {
            // Sort by newest, or filter by date. Fake it for now or rely on a DB field.
            // Assuming default sort is newest, we just don't filter out, but maybe it only shows last 10?
            // Will leave as mostly a placeholder filter for now, matching the UI requirement.
        } else if (selectedCollection === "Thrift Finds") {
             // Let's assume Thrift finds have "Fair" or "Good" condition. This depends on backend data.
        }
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
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredProducts(filtered);
  }, [categoryParam, queryToUse, products, sortBy, priceRange, selectedSize, selectedCollection]);

  if (loading)
    return <div className="text-center py-10">Loading products...</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-black">
            {queryToUse
              ? `Search: "${queryToUse}"`
              : categoryParam
                ? `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)}`
                : "All Products"}
          </h2>
          <p className="text-gray-600 text-lg">
            {filteredProducts.length} products found
          </p>
        </div>
        {(categoryParam || queryToUse || selectedSize || selectedCollection || searchInput) && (
          <Link
            to="/shop"
            onClick={() => {
                setSearchInput("");
                setSelectedSize("");
                setSelectedCollection("");
                setSortBy("");
            }}
            className="text-black hover:text-gray-600 font-semibold mt-2"
          >
            Clear Filters
          </Link>
        )}
      </div>

      {/* Horizontal Filter Bar */}
      <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-6 justify-between lg:justify-start">
              
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Search</label>
                  <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 opacity-50">
                          🔍
                      </span>
                      <input 
                          type="text" 
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          placeholder="Search products..."
                          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none transition-colors text-sm"
                      />
                  </div>
              </div>

              {/* Category Dropdown */}
              <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select
                      value={categoryParam || ""}
                      onChange={(e) => {
                          if (e.target.value) {
                              setSearchParams({ category: e.target.value });
                          } else {
                              setSearchParams({});
                          }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white text-sm appearance-none"
                  >
                      <option value="">All Categories</option>
                      <option value="tops">Tops</option>
                      <option value="bottoms">Bottoms</option>
                      <option value="outerwear">Outerwear</option>
                      <option value="dresses">Dresses</option>
                      <option value="accessories">Accessories</option>
                      <option value="footwear">Footwear</option>
                      <option value="thrift">Thrift ♻️</option>
                  </select>
              </div>

              {/* Size Dropdown */}
              <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Size</label>
                  <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white text-sm appearance-none"
                  >
                      <option value="">All Sizes</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                      <option value="XXXL">XXXL</option>
                  </select>
              </div>

              {/* Collection Dropdown */}
              <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Collection</label>
                  <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white text-sm appearance-none"
                  >
                      <option value="">All Products</option>
                      <option value="New Arrivals">New Arrivals</option>
                      <option value="Thrift Finds">Thrift Finds</option>
                  </select>
              </div>

              {/* Sort Dropdown - Added for completeness based on old UI */}
              <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sort By</label>
                  <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none bg-white text-sm appearance-none"
                  >
                      <option value="">Default</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A-Z</option>
                  </select>
              </div>
          </div>
      </div>

      <div className="w-full">
        {/* Products Grid - Full Width Now */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group relative">
                <Link
                  to={`/product/${product.id}`}
                  className="block"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-black hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${product.stock <= 0 ? 'opacity-50 grayscale-[0.5]' : ''}`}
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <span className="bg-black/80 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-2xl">
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
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-1 text-gray-800">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 font-medium">
                        {product.category}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-black">
                          Rs {product.price}
                        </span>
                        <span className="text-gray-600 text-sm font-semibold group-hover:underline">
                          View Details &rarr;
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
              <p className="text-gray-500 text-lg">
                No products found matching your criteria.
              </p>
              <Link
                to="/shop"
                className="text-accent hover:underline mt-4 inline-block"
              >
                Clear Filters
              </Link>
            </div>
          )}
        </div>
    </div>
  );
};

export default ProductList;
