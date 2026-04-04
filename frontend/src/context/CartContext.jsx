import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { user, viewMode } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [cartError, setCartError] = useState(null);
    const [cartSuccess, setCartSuccess] = useState(null);
    const [appliedCoupon, setAppliedCoupon] = useState(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('everbody_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    setCartItems(parsed);
                } else {
                    console.warn("Cart ignored as it's not an array");
                    localStorage.removeItem('everbody_cart');
                }
            } catch (e) {
                console.error("Failed to parse cart storage", e);
                localStorage.removeItem('everbody_cart');
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('everbody_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1, size = 'M') => {
        if (viewMode === 'seller' || viewMode === 'admin') {
            setCartError("Operation Denied: Purchases are restricted while in Merchant or Admin mode. Please switch to Buyer view to shop.");
            return false;
        }

        const cartItemId = `${product.id}-${size}`;
        setCartError(null);
        setCartSuccess(null);

        // Pre-check for stock availability based on current cart state
        const existingInCart = cartItems.find(item => item.cartItemId === cartItemId);
        const currentQty = existingInCart ? existingInCart.quantity : 0;
        
        if (currentQty + quantity > product.stock) {
            setCartError(`Insufficient Stock: Cannot add more. Only ${product.stock} units in global inventory.`);
            return false;
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                // We've already checked stock above, so we can safely update
                return prevItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity, size, cartItemId }];
        });

        setCartSuccess(`Success! "${product.name}" added to your secure cart.`);
        return true;
    };

    const removeFromCart = (cartItemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, quantity) => {
        setCartError(null);
        if (quantity <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cartItemId === cartItemId) {
                    if (quantity > item.stock) {
                        setCartError(`Only ${item.stock} units available in stock.`);
                        return { ...item, quantity: item.stock };
                    }
                    return { ...item, quantity };
                }
                return item;
            })
        );
        // Only set success if no error was set
        if (!cartError) {
             // We don't usually show success for just quantity updates in detail page, but could.
             // For now, let's keep it simple for addToCart.
        }
    };

    const clearCartError = () => setCartError(null);
    const clearCartSuccess = () => setCartSuccess(null);

    const clearCart = () => {
        setCartItems([]);
        setAppliedCoupon(null);
    };

    const applyCoupon = (coupon) => {
        setAppliedCoupon(coupon);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        cartError,
        clearCartError,
        cartSuccess,
        clearCartSuccess,
        appliedCoupon,
        applyCoupon,
        removeCoupon
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
