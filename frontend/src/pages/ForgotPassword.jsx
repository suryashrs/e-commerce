import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { CheckCircle2, ArrowRight, ShieldCheck, Mail } from "lucide-react";

const loginImage = "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot_password_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessage(data.message);
                setStep(2);
            } else {
                setError(data.message || "Failed to process request");
            }
        } catch (err) {
            setError("Server connection error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset_password.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, new_password: newPassword })
            });
            const data = await res.json();
            
            if (res.ok) {
                setStep(3);
            } else {
                setError(data.message || "Invalid OTP code or request.");
            }
        } catch (err) {
            setError("Server connection error. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                
                {/* Left Side - Image */}
                <div className="hidden md:block w-1/2 relative bg-gray-900">
                    <img
                        src={loginImage}
                        alt="Fashion Model"
                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black flex items-center justify-center">
                        <div className="text-white text-center p-8 mt-auto mb-10 w-full">
                            <h2 className="text-4xl font-extrabold mb-4">WearItNow</h2>
                            <p className="text-xl font-light">Secure Password Recovery Protocol</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Forms */}
                <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
                    
                    {error && (
                        <div className="absolute top-8 left-8 right-8 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm" role="alert">
                            <p className="font-bold text-sm">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    
                    {message && step === 2 && !error && (
                        <div className="absolute top-8 left-8 right-8 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-sm" role="alert">
                            <p className="font-bold text-sm">Success</p>
                            <p className="text-sm">{message}</p>
                        </div>
                    )}

                    {/* Step 1: Request OTP */}
                    {step === 1 && (
                        <div className="animate-fade-in-up">
                            <div className="text-center md:text-left mb-10">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-800">
                                    <ShieldCheck size={28} />
                                </div>
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Forgot Password</h1>
                                <p className="text-gray-500 font-medium">No worries! Enter your associated email and we will send you a reset code securely.</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none text-lg bg-gray-50 hover:bg-white"
                                        placeholder="suryashrestha@gmail.com"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                                >
                                    {isLoading ? 'Processing...' : (
                                        <>
                                            Send Reset Code <ArrowRight className="ml-2" size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                <Link to="/login" className="font-bold text-gray-600 hover:text-black transition-colors">
                                    ← Return to Sign In
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verify OTP and set New Password */}
                    {step === 2 && (
                        <div className="animate-fade-in-up">
                            <div className="text-center md:text-left mb-10">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                                    <Mail size={28} />
                                </div>
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Verify Identity</h1>
                                <p className="text-gray-500 font-medium">Please check your inbox. Enter the securely generated code and select your new password.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                        Reset Code (OTP)
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none text-2xl tracking-[0.5em] font-black text-center bg-gray-50 placeholder:text-gray-300 hover:bg-white"
                                        placeholder="000000"
                                        maxLength="6"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none text-lg bg-gray-50 hover:bg-white"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-xl text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                                >
                                    {isLoading ? 'Verifying...' : (
                                        <>
                                            Secure & Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                            
                            <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl text-sm">
                                <p className="text-gray-500 mb-2">Didn't receive the code?</p>
                                <button 
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                    className="font-bold text-black border-b border-black hover:opacity-70 transition-opacity disabled:opacity-50"
                                >
                                    Resend Security Code
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success Screen */}
                    {step === 3 && (
                        <div className="text-center py-10 animate-fade-in-up">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle2 className="text-green-500" size={56} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Password Recovered!</h2>
                            <p className="text-gray-500 font-medium mb-10 text-lg leading-relaxed max-w-sm mx-auto">
                                Your account has been officially secured. Return to the portal and authenticate using your newly minted credentials.
                            </p>
                            
                            <Link
                                to="/login"
                                className="inline-block bg-black text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition duration-300 shadow-xl hover:-translate-y-1 w-full"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
