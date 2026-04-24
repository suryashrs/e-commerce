import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

// Helper to get the correct storage key based on user login status
const getStorageKey = (userId) => userId ? `everbody_cart_user_${userId}` : 'everbody_cart_guest';

export const CartProvider = ({ children }) => {
    const { user, viewMode, loading: authLoading } = useAuth();
    
    // Initial state is empty. We will load data in an effect.
    const [cartItems, setCartItems] = useState([]);
    const [cartError, setCartError] = useState(null);
    const [cartSuccess, setCartSuccess] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    // Refs to track state and prevent race conditions
    const lastLoadedUserRef = useRef(undefined);
    const isFirstRender = useRef(true);

    // 1. Sync State with LocalStorage whenever User changes (Login/Logout/Refresh)
    useEffect(() => {
        // Wait for Auth to figure out who the user is
        if (authLoading) return;

        const currentUserId = user?.id || null;

        // Avoid infinite loops: only load if the user actually switched
        if (lastLoadedUserRef.current !== currentUserId) {
            const key = getStorageKey(currentUserId);
            const saved = localStorage.getItem(key);
            try {
                const parsed = saved ? JSON.parse(saved) : [];
                setCartItems(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setCartItems([]);
            }
            lastLoadedUserRef.current = currentUserId;
        }
    }, [user, authLoading]);

    // 2. Persist State to LocalStorage whenever Cart changes
    useEffect(() => {
        // Don't save before we've had a chance to load the real data
        if (authLoading || lastLoadedUserRef.current === undefined) return;

        const currentUserId = user?.id || null;
        const key = getStorageKey(currentUserId);
        
        localStorage.setItem(key, JSON.stringify(cartItems));
    }, [cartItems, user, authLoading]);

    const addToCart = (product, quantity = 1, size = 'M') => {
        if (viewMode === 'seller' || viewMode === 'admin') {
            setCartError("Operation Denied: Purchases are restricted while in Merchant or Admin mode.");
            return false;
        }

        const cartItemId = `${product.id}-${size}`;
        setCartError(null);
        setCartSuccess(null);

        const existingInCart = cartItems.find(item => item.cartItemId === cartItemId);
        const currentQty = existingInCart ? existingInCart.quantity : 0;

        if (currentQty + quantity > product.stock) {
            setCartError(`Only ${product.stock} units available.`);
            return false;
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                return prevItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity, size, cartItemId }];
        });

        setCartSuccess(`"${product.name}" added to cart!`);
        return true;
    };

    const removeFromCart = (cartItemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, quantity) => {
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cartItemId === cartItemId) {
                    const newQty = Math.max(0, Math.min(quantity, item.stock));
                    return { ...item, quantity: newQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => setCartItems([]);

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal: () => cartItems.reduce((t, i) => t + (parseFloat(i.price) * i.quantity), 0),
        getCartCount: () => cartItems.reduce((c, i) => c + i.quantity, 0),
        cartError,
        clearCartError: () => setCartError(null),
        cartSuccess,
        clearCartSuccess: () => setCartSuccess(null)
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
