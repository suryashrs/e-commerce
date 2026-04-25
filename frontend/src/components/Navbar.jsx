import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { 
  User, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  Heart, 
  Search,
  LayoutDashboard,
  Store,
  ShieldCheck,
  Repeat,
  Bell,
  Menu,
  X
} from "lucide-react";

const Navbar = () => {
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { user, viewMode, toggleViewMode, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      const handleSync = () => fetchNotifications();
      window.addEventListener('notificationsUpdated', handleSync);
      return () => {
        clearInterval(interval);
        window.removeEventListener('notificationsUpdated', handleSync);
      };
    }
  }, [user]);

  // Close menus on route change and sync search query with URL
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMobileSearch(false);

    // Sync search bar with URL
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      // Only clear if we are not actively typing or if we've moved to a non-shop page
      if (!location.pathname.includes('/shop')) {
        setSearchQuery("");
      }
    }
  }, [location.pathname, location.search]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/user_notifications.php?user_id=${user.id}`);
      const data = await res.json();
      if (data.status === 200) {
          setNotifications(data.body || []);
          setUnreadCount(data.unread_count || 0);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/");
  };

  const handleNotificationClick = async (notifId, isRead) => {
    setShowNotifications(false);
    if (!isRead) {
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await fetch(`${API_BASE_URL}/notifications/mark_read.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notifId })
        });
      } catch(e) {
        console.error("Failed to mark notification as read", e);
      }
    }
  };

  const handleMarkAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_BASE_URL}/notifications/mark_all_read.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id })
      });
      window.dispatchEvent(new Event('notificationsUpdated'));
    } catch(e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-black via-gray-900 to-gray-800 shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Header Row */}
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white hover:text-gray-300 transition"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <Link
              to="/"
              className="text-2xl font-black text-white hover:text-gray-200 transition tracking-tighter italic flex items-center gap-2"
            >
              ✨ <span className="hidden sm:inline">WearItNow</span>
              <span className="sm:hidden text-lg">WIN</span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium collections..."
                className="w-full px-5 py-2.5 bg-white/10 text-white placeholder-gray-400 border border-white/20 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md backdrop-blur-md transition-all text-sm"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Actions Area */}
          <div className="flex items-center space-x-3 sm:space-x-5 lg:space-x-6">
            
            {/* Mobile Search Toggle */}
            <button 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="lg:hidden text-white/80 hover:text-white transition"
            >
              <Search size={22} />
            </button>

            {/* Role Specific Quick Links (Desktop) */}
            {user && viewMode === 'seller' && (
              <Link to="/seller" className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg text-xs uppercase tracking-widest">
                <Store size={14} /> Portal
              </Link>
            )}
            {/* Utility Icons (Shared Mobile/Desktop) */}
            <div className="flex items-center gap-5 sm:gap-6">
              <Link to="/wishlist" className="text-white/80 hover:text-white transition relative flex items-center">
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black shadow-lg">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              
              <Link to="/cart" className="text-white/80 hover:text-white transition relative flex items-center">
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black shadow-lg">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user && (
                <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="text-white/80 hover:text-white transition relative block">
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-black shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {/* Notifications Dropdown (Shared logic from existing but positioned better) */}
                  {showNotifications && (
                    <div className="absolute right-[-80px] sm:right-0 mt-6 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl py-2 z-50 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                       {/* ... Existing Notification Content ... */}
                       <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Activity</h3>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAll} className="text-[9px] font-black text-indigo-600 uppercase hover:text-indigo-800 transition">Mark All</button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 5).map(notif => (
                            <Link key={notif.id} to={viewMode === 'seller' ? '/seller' : '/buyer'} className="block px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition">
                              <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">{notif.type}</p>
                              <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                            </Link>
                          ))
                        ) : (
                          <div className="py-8 text-center text-gray-400 text-xs">No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile / Sign In */}
            {user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center group">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white/30 group-hover:border-white transition overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-2xl py-3 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-5 py-3 border-b border-gray-50 mb-2">
                       <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{viewMode} Mode</p>
                    </div>
                    <Link to={viewMode === 'seller' ? "/seller?tab=profile" : "/profile/edit"} className="flex items-center px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
                      <User size={14} className="mr-3 opacity-60" /> {viewMode === 'seller' ? 'Merchant Profile' : 'Profile Settings'}
                    </Link>
                    {(user.role === 'seller' || user.role === 'admin') && (
                      <button onClick={toggleViewMode} className="w-full flex items-center px-5 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition">
                        <Repeat size={14} className="mr-3" /> Switch to {viewMode === 'buyer' ? 'Seller' : 'Buyer'}
                      </button>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center px-5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-gray-50 mt-2">
                      <LogOut size={14} className="mr-3" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-white text-black px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold hover:bg-gray-100 transition shadow-lg text-xs sm:text-sm whitespace-nowrap">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <form onSubmit={handleSearch} className="lg:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-5 py-3 bg-white/10 text-white border border-white/20 rounded-2xl focus:outline-none backdrop-blur-md"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
                <Search size={20} />
              </button>
            </div>
          </form>
        )}

        {/* Desktop Bottom Links (Hidden on Mobile, moved to Sidebar) */}
        <div className="hidden lg:flex justify-center space-x-12 pb-4">
          {['Home', 'Shop', 'Thrift', 'Try-On'].map((item) => (
            <Link
              key={item}
              to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
              className={`text-white/70 hover:text-white transition text-[11px] font-black uppercase tracking-[0.25em] relative group py-2 ${location.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`) ? 'text-white' : ''}`}
            >
              {item}
              <span className={`absolute bottom-0 left-0 h-0.5 bg-white transition-all ${location.pathname === (item === 'Home' ? '/' : `/${item.toLowerCase()}`) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-3/4 max-w-[300px] bg-white z-50 p-8 shadow-2xl lg:hidden animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black italic">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-black">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                { name: 'Home', path: '/' },
                { name: 'Collections', path: '/shop' },
                { name: 'Thrift Shop', path: '/thrift' },
                { name: 'Virtual Try-On', path: '/try-on' },
                { name: 'My Wishlist', path: '/wishlist' }
              ].map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block text-lg font-bold text-gray-800 hover:text-black transition flex items-center justify-between group"
                >
                  {item.name}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              ))}
            </div>

            {user && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">User Actions</p>
                <div className="space-y-4">
                   {user.role !== 'buyer' && (
                     <div className="space-y-4">
                        {viewMode === 'seller' && (
                          <Link to="/seller" className="w-full text-left font-bold text-indigo-600 flex items-center gap-3">
                            <LayoutDashboard size={18} /> Merchant Dashboard
                          </Link>
                        )}
                        <button onClick={toggleViewMode} className="w-full text-left font-bold text-gray-600 flex items-center gap-3">
                            <Repeat size={18} /> Switch to {viewMode === 'buyer' ? 'Seller' : 'Buyer'}
                        </button>
                     </div>
                   )}
                   <Link to={viewMode === 'seller' ? "/seller?tab=profile" : "/profile/edit"} className="flex items-center gap-3 font-bold text-gray-600">
                      <User size={18} /> {viewMode === 'seller' ? 'Merchant Profile' : 'My Profile'}
                   </Link>
                   <button onClick={handleLogout} className="flex items-center gap-3 font-bold text-rose-600">
                      <LogOut size={18} /> Sign Out
                   </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
