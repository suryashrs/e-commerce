import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

// Thrift-themed hero slides
const heroSlides = [
    {
        image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2074&auto=format&fit=crop",
        tag: "Sustainable Fashion",
        headline: "Preloved.\nPerfect.",
        sub: "Give clothes a second life. Save money, save the planet.",
        cta: { label: "Browse Thrift", anchor: "#products" },
        badge: "♻️ Eco-Friendly",
    },
    {
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop",
        tag: "Up to 70% Off",
        headline: "Hidden Gems\nAwaiting You",
        sub: "One-of-a-kind vintage finds you won't see anywhere else.",
        cta: { label: "Shop Now", anchor: "#products" },
        badge: "⭐ Quality Checked",
    },
    {
        image: "https://images.unsplash.com/photo-1467043237213-65f2da53396f?q=80&w=2070&auto=format&fit=crop",
        tag: "Circular Fashion",
        headline: "Style the\nEarth Loves",
        sub: "Every purchase reduces waste and supports a greener future.",
        cta: { label: "Explore Finds", anchor: "#products" },
        badge: "💚 Planet-First",
    },
];

const Thrift = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToSlide = useCallback((index) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentSlide(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        goToSlide((currentSlide + 1) % heroSlides.length);
    }, [currentSlide, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
    }, [currentSlide, goToSlide]);

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    const slide = heroSlides[currentSlide];


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
            {/* ── Hero Carousel ── */}
            <section
                className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-12 shadow-2xl"
                style={{ height: 'clamp(320px, 55vh, 580px)' }}
            >
                {heroSlides.map((s, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 transition-opacity duration-700"
                        style={{ opacity: i === currentSlide ? 1 : 0, zIndex: i === currentSlide ? 1 : 0 }}
                    >
                        <img src={s.image} alt={s.tag} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
                    </div>
                ))}

                {/* Content */}
                <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 sm:px-16">
                    <span
                        key={`tag-${currentSlide}`}
                        className="inline-block text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-emerald-400 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >
                        {slide.tag}
                    </span>
                    <h1
                        key={`h-${currentSlide}`}
                        className="text-4xl sm:text-7xl font-black text-white leading-none tracking-tighter mb-5 whitespace-pre-line animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        {slide.headline}
                    </h1>
                    <p
                        key={`p-${currentSlide}`}
                        className="text-sm sm:text-lg text-white/75 mb-7 max-w-sm font-medium animate-in fade-in slide-in-from-bottom-6 duration-500"
                    >
                        {slide.sub}
                    </p>
                    <div className="flex flex-wrap gap-3 items-center">
                        <a
                            href="#thrift-products"
                            className="bg-white text-black px-7 py-3.5 rounded-full font-black hover:bg-gray-100 transition shadow-xl text-sm sm:text-base"
                        >
                            {slide.cta.label}
                        </a>
                        <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 px-5 py-3 rounded-full text-xs sm:text-sm font-bold">
                            {slide.badge}
                        </span>
                    </div>
                </div>

                {/* Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {heroSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goToSlide(i)}
                            className={`transition-all duration-300 rounded-full ${
                                i === currentSlide
                                    ? 'w-8 h-2 bg-emerald-400'
                                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>

                {/* Counter */}
                <div className="absolute bottom-6 right-6 z-20 text-white/50 text-xs font-black tabular-nums">
                    {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
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
                                            className="absolute top-3 right-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-md hover:scale-110 transition z-10"
                                        >
                                            <Heart size={16} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-rose-500" : "text-black"} />
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
