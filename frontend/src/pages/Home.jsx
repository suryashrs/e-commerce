import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { useWishlist } from "../context/WishlistContext";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

// Hero carousel slides with curated fashion imagery
const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop",
    tag: "New Arrivals",
    headline: "Dress to\nImpress",
    sub: "AI-powered virtual try-on. Style without limits.",
    cta: { label: "Shop Now", to: "/shop" },
  },
  {
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2070&auto=format&fit=crop",
    tag: "Virtual Try-On",
    headline: "See It On\nYou First",
    sub: "Try before you buy — no returns, just confidence.",
    cta: { label: "Try It Now", to: "/try-on" },
  },
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    tag: "Thrift Finds",
    headline: "Preloved.\nPerfect.",
    sub: "Sustainable fashion at its finest — curated vintage pieces.",
    cta: { label: "Shop Thrift", to: "/thrift" },
  },
];

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <div className="space-y-8 sm:space-y-16">

      {/* ── Hero Carousel ── */}
      <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden mx-[-1rem] sm:mx-0 shadow-2xl" style={{ height: 'clamp(360px, 60vh, 620px)' }}>

        {/* Slides */}
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === currentSlide ? 1 : 0, zIndex: i === currentSlide ? 1 : 0 }}
          >
            <img src={s.image} alt={s.tag} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 sm:px-16">
          <span
            key={`tag-${currentSlide}`}
            className="inline-block text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {slide.tag}
          </span>
          <h1
            key={`h-${currentSlide}`}
            className="text-4xl sm:text-7xl font-black text-white leading-none tracking-tighter mb-6 whitespace-pre-line animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {slide.headline}
          </h1>
          <p
            key={`p-${currentSlide}`}
            className="text-sm sm:text-lg text-white/75 mb-8 max-w-sm font-medium animate-in fade-in slide-in-from-bottom-6 duration-500"
          >
            {slide.sub}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={slide.cta.to}
              className="bg-white text-black px-7 py-3.5 rounded-full font-black hover:bg-gray-100 transition shadow-xl text-sm sm:text-base"
            >
              {slide.cta.label}
            </Link>
            <Link
              to="/try-on"
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-7 py-3.5 rounded-full font-black hover:bg-white hover:text-black transition text-sm sm:text-base"
            >
              Virtual Try-On ✨
            </Link>
          </div>
        </div>

        {/* Prev / Next Arrows */}
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

        {/* Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute bottom-6 right-6 z-20 text-white/50 text-xs font-black tabular-nums">
          {String(currentSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </div>
      </section>

      {/* ── Featured Styles ── */}
      <section className="px-1 sm:px-0">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
            Featured Styles
          </h2>
          <Link to="/shop" className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 hover:text-black transition flex items-center gap-2 mb-1">
            View All <span>→</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 mb-8">
          {featuredProducts.map((product) => (
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
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-md hover:scale-110 transition z-10"
                    >
                      <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-rose-500" : "text-black"} />
                    </button>
                    {product.has_tryon === 1 && (
                      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-gray-100 hidden sm:block">
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1">✨ VTO Ready</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-5 flex-grow flex flex-col">
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                      {product.category}
                    </p>
                    <h3 className="text-xs sm:text-lg font-bold text-gray-900 line-clamp-1 mb-2">
                      {product.name}
                    </h3>
                    <div className="mt-auto">
                      <span className="text-sm sm:text-2xl font-black text-black">
                        Rs {product.price}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category Grid ── */}
      <section className="px-1 sm:px-0 pb-12">
        <h2 className="text-2xl sm:text-4xl font-black mb-8 text-center text-black tracking-tight">
          Explore Essentials
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {["Tops", "Bottoms", "Outerwear", "Best Selling"].map((category) => (
            <Link
              key={category}
              to={`/shop?category=${category}`}
              className="group relative h-32 sm:h-48 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900 shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent z-10" />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 transition-transform group-hover:scale-105 duration-300">
                <h3 className="text-sm sm:text-xl font-black text-white uppercase tracking-widest text-center">{category}</h3>
                <span className="text-[10px] sm:text-xs font-bold text-white/60 group-hover:text-white transition uppercase mt-2">Browse →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
