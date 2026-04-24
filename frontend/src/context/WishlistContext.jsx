import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};

// Helper to get storage key based on user login status
const getStorageKey = (userId) => userId ? `wearit_wishlist_user_${userId}` : 'wearit_wishlist_guest';

export const WishlistProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    
    // Initial state
    const [wishlistItems, setWishlistItems] = useState([]);

    // Refs to track state and prevent race conditions
    const lastLoadedUserRef = useRef(undefined);

    // 1. Sync State with LocalStorage whenever User changes
    useEffect(() => {
        if (authLoading) return;

        const currentUserId = user?.id || null;

        if (lastLoadedUserRef.current !== currentUserId) {
            const key = getStorageKey(currentUserId);
            const saved = localStorage.getItem(key);
            try {
                const parsed = saved ? JSON.parse(saved) : [];
                setWishlistItems(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setWishlistItems([]);
            }
            lastLoadedUserRef.current = currentUserId;
        }
    }, [user, authLoading]);

    // 2. Persist State to LocalStorage whenever Wishlist changes
    useEffect(() => {
        if (authLoading || lastLoadedUserRef.current === undefined) return;

        const currentUserId = user?.id || null;
        const key = getStorageKey(currentUserId);
        
        localStorage.setItem(key, JSON.stringify(wishlistItems));
    }, [wishlistItems, user, authLoading]);

    const addToWishlist = (product) => {
        setWishlistItems(prevItems => {
            const exists = prevItems.find(item => item.id === product.id);
            if (!exists) {
                return [...prevItems, product];
            }
            return prevItems;
        });
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const toggleWishlist = (product) => {
        setWishlistItems(prevItems => {
            const exists = prevItems.find(item => item.id === product.id);
            if (exists) {
                return prevItems.filter(item => item.id !== product.id);
            }
            return [...prevItems, product];
        });
    };

    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    const clearWishlist = () => setWishlistItems([]);

    const value = {
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount: () => wishlistItems.length
    };

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
