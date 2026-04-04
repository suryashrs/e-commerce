import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import Seller from "./pages/Seller";
import Wishlist from "./pages/Wishlist";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSellers from "./pages/admin/AdminSellers";
import AdminProducts from "./pages/admin/AdminProducts";
import ProductForm from "./pages/admin/ProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminUsers from "./pages/admin/AdminUsers";
import Security from "./pages/Security";
import BuyerDashboard from "./pages/BuyerDashboard";
import BecomeSeller from "./pages/BecomeSeller";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
                  <Route index element={<AdminDashboard />} />
                  <Route path="sellers" element={<AdminSellers />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="reviews" element={<AdminReviews />} />
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
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/thrift" element={<Thrift />} />
                    <Route path="/buyer" element={<BuyerDashboard />} />
                    <Route path="/seller" element={<Seller />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/profile/edit" element={<BuyerDashboard />} />
                    <Route path="/become-seller" element={<BecomeSeller />} />
                    <Route path="/security" element={<Security />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
