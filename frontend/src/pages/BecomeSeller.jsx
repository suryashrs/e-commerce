import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { User, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

const BecomeSeller = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    
    // New fields
    const [shopName, setShopName] = useState('');
    const [shopNumber, setShopNumber] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [shopPhone, setShopPhone] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role === 'seller' && user.shop_status === 'approved') {
            navigate('/seller');
        }
    }, [user, navigate]);

    const handleBecomeSeller = async () => {
        if (!shopName || !shopNumber || !shopAddress || !shopPhone) {
            setError('Please fill in all shop details.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/user/become_seller.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: user.id,
                    shop_name: shopName,
                    shop_number: shopNumber,
                    shop_address: shopAddress,
                    shop_phone: shopPhone
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
                setShowPopup(true);
                
                // Update local storage and context
                const updatedUser = { 
                    ...user, 
                    role: 'seller', 
                    shop_status: 'pending',
                    shop_name: shopName,
                    shop_number: shopNumber,
                    shop_address: shopAddress,
                    shop_phone: shopPhone
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                updateUser(updatedUser);
                
                // Redirect after a short delay
                setTimeout(() => {
                    navigate('/seller');
                }, 4000);
            } else {
                setError(data.message || 'Failed to submit application.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-2xl rounded-[2.5rem] border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-500">
                    {/* Header */}
                    <div className="px-10 py-10 border-b border-gray-50 flex justify-between items-center bg-white">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile Management</h1>
                        
                        <div className="flex items-center space-x-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account View:</span>
                            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
                                <button className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${!success ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}>
                                    <User size={14} />
                                    <span>Buyer</span>
                                </button>
                                <button className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${success ? 'bg-white text-black shadow-sm' : 'text-gray-400 opacity-50'}`}>
                                    <ShieldCheck size={14} />
                                    <span>Seller</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Success Banner matching the screenshot */}
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-8 py-5 rounded-[1.5rem] flex items-center space-x-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-sm font-bold antialiased">
                                    Account upgraded to Seller successfully! Redirecting to Seller Dashboard...
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-800 px-8 py-5 rounded-[1.5rem] text-sm font-bold">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Form UI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Full Name</label>
                                <input 
                                    type="text" 
                                    value={user.name} 
                                    readOnly 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.2rem] px-6 py-4 font-bold text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Email Address</label>
                                <input 
                                    type="email" 
                                    value={user.email} 
                                    readOnly 
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[1.2rem] px-6 py-4 font-bold text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Shop Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your store name"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-[1.2rem] px-6 py-4 font-bold text-gray-900 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Shop Number (Registration)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. REG-12345"
                                    value={shopNumber}
                                    onChange={(e) => setShopNumber(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-[1.2rem] px-6 py-4 font-bold text-gray-900 transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Shop Address</label>
                                <textarea 
                                    placeholder="Enter complete shop address"
                                    value={shopAddress}
                                    onChange={(e) => setShopAddress(e.target.value)}
                                    rows="3"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-[1.2rem] px-6 py-4 font-bold text-gray-900 transition-all outline-none resize-none"
                                ></textarea>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Shop Phone Number</label>
                                <input 
                                    type="tel" 
                                    placeholder="+1 (555) 000-0000"
                                    value={shopPhone}
                                    onChange={(e) => setShopPhone(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-[1.2rem] px-6 py-4 font-bold text-gray-900 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Large Action Button */}
                        {!success && (
                            <div className="pt-8 text-center">
                                <button
                                    onClick={handleBecomeSeller}
                                    disabled={loading}
                                    className={`w-full bg-black text-white px-10 py-6 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading ? 'Submitting Application...' : 'Apply as Premium Seller'}
                                </button>
                                <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Your application will be reviewed by our administration team.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Popup message as requested */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-sm mx-4 border border-gray-100 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-100/50">
                            <CheckCircle2 size={48} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter mb-4">Official Seller Status!</h3>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-10 px-4">
                            Congratulations! You are now a <span className="text-black font-black">seller type</span> account. Start listing your premium items.
                        </p>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full animate-shimmer"></div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 3s infinite;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
                    background-size: 200% 100%;
                }
            `}</style>
        </div>
    );
};

export default BecomeSeller;
