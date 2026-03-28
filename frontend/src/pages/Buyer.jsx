import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";

const Buyer = () => {
    const { user } = useAuth();
    const [pointsData, setPointsData] = useState({ balance: 0, nextTier: 2000 });
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [redeemingId, setRedeemingId] = useState(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Firestore TrendPoints
            const pointsRes = await fetch(`${API_BASE_URL}/points/balance.php?user_id=${user.id}`);
            const pointsJson = await pointsRes.json();
            if (pointsJson.status === 200) {
                setPointsData({ 
                    balance: pointsJson.body.pointsBalance, 
                    nextTier: pointsJson.body.nextTierAt 
                });
            }

            // Fetch Global Valid Coupons
            const couponsRes = await fetch(`${API_BASE_URL}/coupons/read.php`);
            const couponsJson = await couponsRes.json();
            if (couponsRes.ok && couponsJson.body) {
                setAvailableCoupons(couponsJson.body);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (coupon) => {
        const cost = coupon.discount_type === 'percentage' 
            ? Math.floor(coupon.discount_value * 20) // e.g., 20% off = 400 pts
            : Math.floor(coupon.discount_value * 2); // e.g., 500 Rs off = 1000 pts
            
        if (pointsData.balance < cost) {
            setMessage({ type: 'error', text: `You need ${cost} TrendPoints to unlock this reward.` });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            return;
        }

        setRedeemingId(coupon.id);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/points/redeem.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    coupon_id: coupon.id,
                    cost: cost
                })
            });
            const result = await response.json();

            if (response.ok && result.status === 200) {
                setMessage({ type: 'success', text: `Success! You unlocked coupon: ${coupon.code}` });
                setPointsData(prev => ({ ...prev, balance: result.body.newBalance }));
                setTimeout(() => setMessage({ type: '', text: '' }), 6000);
            } else {
                setMessage({ type: 'error', text: result.body?.message || 'Failed to redeem reward.' });
                setTimeout(() => setMessage({ type: '', text: '' }), 4000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error connecting to server.' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } finally {
            setRedeemingId(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-12 text-center max-w-lg mx-auto hover:-translate-y-2 transition-transform duration-500">
                    <div className="text-6xl mb-6">🔒</div>
                    <h3 className="text-3xl font-bold mb-4 text-gray-800">Please Sign In</h3>
                    <p className="text-gray-500 mb-8 font-light">Join WearIt Now to start earning TrendPoints!</p>
                    <a href="/login" className="bg-black text-white px-10 py-4 rounded-full font-bold hover:bg-gray-800 transition shadow-lg inline-block">Login Now</a>
                </div>
            </div>
        );
    }

    const progressPercentage = Math.min(100, Math.max(0, (pointsData.balance / pointsData.nextTier) * 100));

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-hidden font-sans text-gray-900">
            {/* Soft background blobs */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none"></div>
            <div className="absolute top-[20%] left-[-10%] w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob pointer-events-none" style={{ animationDelay: "2s" }}></div>

            <div className="max-w-6xl mx-auto px-6 pt-16 relative z-10 space-y-12">
                
                {/* Header Profile Section */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">WearIt Now</h1>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 tracking-widest uppercase ml-1">Style Profile</span>
                    </div>
                    
                    <div className="flex items-center space-x-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white/50">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-bold text-lg leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-500 font-medium">WearIt Explorer</p>
                        </div>
                    </div>
                </header>

                {/* Hero Feature: TrendPoints Card */}
                <section>
                    <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-8 md:p-12 border border-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden">
                        
                        {/* Decorative background element inside card */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-full opacity-60"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="w-full md:w-1/2">
                                <h2 className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                                    Current Balance
                                </h2>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow-sm">
                                        {pointsData.balance}
                                    </span>
                                    <span className="text-2xl font-bold text-gray-400">TP</span>
                                </div>
                                <p className="text-gray-500 text-lg font-medium">
                                    TrendPoints unlock exclusive rewards and discounts.
                                </p>
                            </div>
                            
                            <div className="w-full md:w-1/2 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 shadow-inner">
                                <div className="flex justify-between text-sm font-bold text-gray-600 mb-3">
                                    <span>Explorer Tier</span>
                                    <span>{pointsData.nextTier} TP to Elite</span>
                                </div>
                                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-stripes"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-center font-medium text-gray-400">
                                    {pointsData.nextTier - pointsData.balance} points away from your next rank up!
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Status Message */}
                {message.text && (
                    <div className={`p-5 rounded-2xl shadow-xl backdrop-blur-md border animate-fade-in-up font-bold flex items-center ${
                        message.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-200' : 'bg-green-50/90 text-green-700 border-green-200'
                    }`}>
                        <span className="mr-3 text-2xl">{message.type === 'error' ? '⚠️' : '🎉'}</span>
                        {message.text}
                    </div>
                )}

                {/* Sub-Navigation Grid (Thrift, Cart, etc.) combined into a smaller dock */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { to: '/shop', icon: '🛍️', label: 'Shop Now' },
                        { to: '/cart', icon: '🛒', label: 'My Cart' },
                        { to: '/try-on', icon: '🎨', label: 'Virtual Try-On' },
                        { to: '/thrift', icon: '♻️', label: 'Thrift Hub' }
                    ].map((item, i) => (
                        <Link key={i} to={item.to} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group flex items-center justify-between">
                            <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{item.label}</span>
                            <span className="text-2xl group-hover:scale-110 transition-transform origin-center">{item.icon}</span>
                        </Link>
                    ))}
                </section>

                {/* Rewards Center */}
                <section className="pt-8">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rewards Center</h2>
                            <p className="text-gray-500 font-medium mt-1">Exchange your TrendPoints for merchant coupons.</p>
                        </div>
                        <span className="text-5xl opacity-20">🎁</span>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-64 bg-white/50 rounded-[2rem] border border-gray-100"></div>
                            ))}
                        </div>
                    ) : availableCoupons.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {availableCoupons.map((coupon) => {
                                // Dynamic formula for point cost based on requested logic
                                const costPoints = coupon.discount_type === 'percentage' 
                                    ? Math.floor(coupon.discount_value * 20) 
                                    : Math.floor(coupon.discount_value * 2);
                                
                                const canAfford = pointsData.balance >= costPoints;
                                const isRedeeming = redeemingId === coupon.id;

                                return (
                                    <div key={coupon.id} className="bg-white shadow-xl rounded-[2rem] p-1 border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative group overflow-hidden flex flex-col">
                                        
                                        {/* Colored header area of coupon */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-t-[1.8rem] rounded-b-3xl p-6 relative overflow-hidden flex-grow">
                                            
                                            {/* decorative circle */}
                                            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white opacity-40"></div>
                                            
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <span className="bg-white text-indigo-600 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm">
                                                    EXCLUSIVE
                                                </span>
                                                <span className="text-xl">🎟️</span>
                                            </div>

                                            <div className="mb-2 relative z-10">
                                                <h3 className="text-3xl font-extrabold text-gray-900 leading-tight">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `Rs ${coupon.discount_value} OFF`}
                                                </h3>
                                                <p className="text-sm font-medium text-gray-500 mt-1">
                                                    Valid until {new Date(coupon.expiry_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action area of coupon */}
                                        <div className="p-5 flex items-center justify-between bg-white rounded-b-[2rem]">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cost</span>
                                                <span className={`text-lg font-extrabold ${canAfford ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                    {costPoints} TP
                                                </span>
                                            </div>
                                            
                                            <button 
                                                disabled={!canAfford || isRedeeming}
                                                onClick={() => handleRedeem(coupon)}
                                                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
                                                    isRedeeming ? 'bg-indigo-400 text-white cursor-wait' :
                                                    canAfford 
                                                        ? 'bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5' 
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {isRedeeming ? 'Unlocking...' : canAfford ? 'Redeem Now' : 'Need More TP'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-[2rem] p-16 text-center border border-white/50 hover:-translate-y-1 transition-transform">
                            <div className="text-6xl mb-4 opacity-70">🏜️</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Rewards Available</h3>
                            <p className="text-gray-500">Check back later for new exclusive merchant coupons!</p>
                        </div>
                    )}
                </section>
            </div>
            
            <style jsx>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                @keyframes stripes {
                    from { background-position: 1rem 0; }
                    to { background-position: 0 0; }
                }
                .animate-stripes {
                    animation: stripes 1s linear infinite;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Buyer;
