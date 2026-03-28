import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [cartError, setCartError] = useState(null);
    const [cartSuccess, setCartSuccess] = useState(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('everbody_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('everbody_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, quantity = 1, size = 'M') => {
        const cartItemId = `${product.id}-${size}`;
        setCartError(null);
        setCartSuccess(null);
        let success = true;
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.cartItemId === cartItemId);
            if (existingItem) {
                if (existingItem.quantity + quantity > product.stock) {
                    setCartError(`Cannot add more of this item. Only ${product.stock} in stock.`);
                    success = false;
                    const newQuantity = product.stock;
                    return prevItems.map(item =>
                        item.cartItemId === cartItemId
                            ? { ...item, quantity: newQuantity }
                            : item
                    );
                }
                const newQuantity = existingItem.quantity + quantity;
                setCartSuccess(`"${product.name}" quantity updated in cart!`);
                return prevItems.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            if (quantity > product.stock) {
                setCartError(`Only ${product.stock} units available.`);
                success = false;
                return [...prevItems, { ...product, quantity: product.stock, size, cartItemId }];
            }
            setCartSuccess(`"${product.name}" added to cart!`);
            return [...prevItems, { ...product, quantity, size, cartItemId }];
        });
        return success;
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
        clearCartSuccess
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
