import React, { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config";

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

    useEffect(() => {
        // Load user from localStorage on mount
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

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
                localStorage.setItem("user", JSON.stringify(data.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "An error occurred during login" };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password, role }),
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

    // Step 1: Send OTP to email (does NOT create account yet)
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
            return { success: false, error: "Failed to send OTP. Please check your connection." };
        }
    };

    // Step 2: Verify OTP and create the account, then auto-login
    const verifyOtp = async (name, email, password, role, otp) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role, otp }),
            });
            const data = await response.json();
            if (response.ok) {
                // Auto-login after account creation
                return await login(email, password);
            } else {
                return { success: false, error: data.message };
            }
        } catch (error) {
            return { success: false, error: "Verification failed. Please try again." };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
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
        login,
        signup,
        sendOtp,
        verifyOtp,
        logout,
        updateUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
