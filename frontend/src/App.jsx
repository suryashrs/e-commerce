import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import TryOn from "./pages/TryOn";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Thrift from "./pages/Thrift";
import Buyer from "./pages/Buyer";
import Seller from "./pages/Seller";
import Wishlist from "./pages/Wishlist";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import ProductForm from "./pages/admin/ProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLogin from "./pages/admin/AdminLogin";
import Security from "./pages/Security";
import EditProfile from "./pages/EditProfile";

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col">
          {/* Recursively handle layout in routes or conditionally render Navbar here. 
              For now, simple approach: The Routes decide.
           */}
          <Routes>
            {/* Admin Section - No Main Navbar */}
            <Route path="/admin/*" element={
              <Routes>
                <Route path="login" element={<AdminLogin />} />
                <Route element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>
              </Routes>
            } />

            {/* Public Section - With Main Navbar */}
            <Route path="*" element={
              <>
                <Navbar />
                <main className="flex-grow container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<ProductList />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/try-on" element={<TryOn />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/thrift" element={<Thrift />} />
                    <Route path="/buyer" element={<Buyer />} />
                    <Route path="/seller" element={<Seller />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile/edit" element={<EditProfile />} />
                    <Route path="/security" element={<Security />} />
                  </Routes>
                </main>
                <footer className="bg-gradient-to-r from-gray-900 to-gray-800 py-8 text-center text-white">
                  <div className="container mx-auto px-4">
                    <p className="text-lg font-semibold mb-2">
                      WearItNow - Wear Your Confidence
                    </p>
                    <p className="text-gray-300">
                      &copy; 2025 WearItNow. All rights reserved.
                    </p>
                  </div>
                </footer>
              </>
            } />
          </Routes>
        </div>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
