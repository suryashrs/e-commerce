import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { ShoppingBag, Store, ShieldCheck, Repeat } from "lucide-react";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState(null);
    const [modeNotification, setModeNotification] = useState(null);

    useEffect(() => {
        // Load user and viewMode from localStorage on mount
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const storedViewMode = localStorage.getItem("viewMode");
            setViewMode(storedViewMode || parsedUser.role);
        }
        setLoading(false);
    }, []);

    const toggleViewMode = () => {
        if (user && (user.role === 'seller' || user.role === 'admin')) {
            const newMode = viewMode === 'buyer' ? user.role : 'buyer';
            setViewMode(newMode);
            localStorage.setItem("viewMode", newMode);
            setModeNotification(newMode);
            setTimeout(() => setModeNotification(null), 2000);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                setViewMode(data.user.role);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("viewMode", data.user.role);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "An error occurred during login" };
        }
    };

    const signup = async (name, email, password, role, shopDetails = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password, role, ...shopDetails }),
            });

            const data = await response.json();

            if (response.ok) {
                // Auto-login after signup
                return await login(email, password);
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "An error occurred during signup" };
        }
    };

    const sendOtp = async (name, email, password, role) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "Failed to send OTP." };
        }
    };

    const verifyOtp = async (name, email, password, role, otp, shopDetails = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role, otp, ...shopDetails }),
            });
            const data = await response.json();
            if (response.ok) {
                return await login(email, password);
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "Verification failed." };
        }
    };

    const logout = () => {
        setUser(null);
        setViewMode(null);
        localStorage.removeItem("user");
        localStorage.removeItem("viewMode");
    };

    const updateUser = (userData) => {
        setUser((prevUser) => {
            const updatedUser = { ...prevUser, ...userData };
            localStorage.setItem("user", JSON.stringify(updatedUser)); // Persist locally
            return updatedUser;
        });
    };

    const value = {
        user,
        viewMode,
        toggleViewMode,
        login,
        signup,
        sendOtp,
        verifyOtp,
        logout,
        updateUser,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            
            {/* Mode Switch Notification Overlay */}
            {modeNotification && (
                <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-300"></div>
                    <div className="relative bg-white p-14 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] text-center border border-gray-100 animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 pointer-events-auto">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner ${
                            modeNotification === 'buyer' ? 'bg-indigo-50 text-indigo-600' : 
                            modeNotification === 'seller' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                            {modeNotification === 'buyer' ? <ShoppingBag size={56} strokeWidth={2.5} /> :
                             <Store size={56} strokeWidth={2.5} />}
                        </div>
                        <p className="text-[11px] font-black tracking-[0.3em] uppercase text-gray-500 mb-4 animate-pulse">Switching View</p>
                        <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 uppercase">
                            {modeNotification === 'buyer' ? 'Buyer Mode' : 'Seller Mode'}
                        </h3>
                        <p className="text-gray-900 text-sm font-bold max-w-[240px] mx-auto opacity-70">
                            Your dashboard has been updated to {modeNotification} view.
                        </p>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
