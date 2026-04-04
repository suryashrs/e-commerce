import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "lucide-react";

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
      filtered = filtered.filter((p) => p.category.toLowerCase() === categoryParam.toLowerCase());
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
                      <option value="Tops">Tops</option>
                      <option value="Bottoms">Bottoms</option>
                      <option value="Outerwear">Outerwear</option>
                      <option value="Dresses">Dresses</option>
                      <option value="Best Selling">Best Selling</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Thrift">Thrift ♻️</option>
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
        {/* Products Grid - Fluid Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group relative">
                <Link
                  to={`/product/${product.id}`}
                  className="block h-full"
                >
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm sm:shadow-lg overflow-hidden border border-gray-100 hover:border-black transition-all duration-500 h-full flex flex-col">
                    <div className="aspect-[4/5] sm:aspect-square overflow-hidden bg-gray-50 relative">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 p-2">
                          <span className="bg-black/90 text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter">
                            Sold Out
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(product);
                        }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-md hover:scale-110 transition z-10"
                      >
                        <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-rose-500" : "text-black"} />
                      </button>
                    </div>
                    <div className="p-3 sm:p-5 flex-grow flex flex-col">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        {product.category}
                      </p>
                      <h3 className="text-xs sm:text-lg font-bold text-gray-900 line-clamp-1 mb-2">
                        {product.name}
                      </h3>
                      <div className="mt-auto flex justify-between items-end">
                        <span className="text-sm sm:text-2xl font-black text-black">
                          Rs {product.price}
                        </span>
                        <span className="hidden sm:block text-gray-400 text-xs font-black uppercase tracking-widest group-hover:text-black transition">
                          View →
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
