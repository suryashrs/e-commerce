import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const signupImage = "/assets/images/auth_bg.jpg";

const Signup = () => {
    // Step 1 fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("buyer");

    // Shop details for sellers
    const [shopName, setShopName] = useState("");
    const [shopNumber, setShopNumber] = useState("");
    const [shopAddress, setShopAddress] = useState("");
    const [shopPhone, setShopPhone] = useState("");

    // Step 2 – OTP
    const [step, setStep] = useState("details"); // "details" | "otp"
    const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);

    // Resend timer
    const [resendCooldown, setResendCooldown] = useState(0);
    const timerRef = useRef(null);

    const [error, setError] = useState("");
    const [conflictType, setConflictType] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    // Cleanup timer on unmount
    useEffect(() => () => clearInterval(timerRef.current), []);

    // ─── Step 1 submit: send OTP ────────────────────────────────────────────
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        
        // Strong Password Validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongPasswordRegex.test(password)) {
            setError("Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (role === "seller") {
            if (!shopName || !shopNumber || !shopAddress || !shopPhone) {
                setError("Please fill in all shop details.");
                return;
            }
        }

        setIsLoading(true);
        const result = await sendOtp(name, email, password, role);
        setIsLoading(false);

        if (result.success) {
            setStep("otp");
            setSuccessMsg(`A 6-digit code was sent to ${email}`);
            startResendTimer();
        } else {
            setError(result.error);
            if (result.conflict === 'buyer_to_seller') {
                setConflictType('buyer_to_seller');
            } else {
                setConflictType(null);
            }
        }
    };

    // ─── OTP digit input handling ────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const updated = [...otpDigits];
        updated[index] = value;
        setOtpDigits(updated);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const updated = [...otpDigits];
        for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
        setOtpDigits(updated);
        const nextFocus = Math.min(pasted.length, 5);
        otpRefs.current[nextFocus]?.focus();
    };

    // ─── Step 2 submit: verify OTP ──────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        const otp = otpDigits.join("");
        if (otp.length < 6) {
            setError("Please enter all 6 digits.");
            return;
        }
        setIsLoading(true);
        const result = await verifyOtp(name, email, password, role, otp, {
            shop_name: shopName,
            shop_number: shopNumber,
            shop_address: shopAddress,
            shop_phone: shopPhone
        });
        setIsLoading(false);

        if (result.success) {
            navigate("/");
        } else {
            setError(result.error);
        }
    };

    // ─── Resend OTP ─────────────────────────────────────────────────────────
    const startResendTimer = () => {
        setResendCooldown(60);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setError("");
        setSuccessMsg("");
        setOtpDigits(["", "", "", "", "", ""]);
        setIsLoading(true);
        const result = await sendOtp(name, email, password, role);
        setIsLoading(false);
        if (result.success) {
            setSuccessMsg("A new OTP has been sent to your email.");
            startResendTimer();
        } else {
            setError(result.error);
        }
    };

    // ════════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

                {/* Left Side – Image */}
                <div className="hidden md:block w-1/2 relative bg-gray-900">
                    <img
                        src={signupImage}
                        alt="Fashion Model"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-10">
                        <div className="text-white">
                            <h2 className="text-4xl font-bold mb-2">Join the Club</h2>
                            <p className="text-lg opacity-90">Experience the future of fashion shopping today.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side – Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

                    {/* ── STEP 1: Details form ── */}
                    {step === "details" && (
                        <>
                            <div className="text-center md:text-left mb-8">
                                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Create Account</h1>
                                <p className="text-gray-500">Start your journey with WearItNow</p>
                            </div>

                            {conflictType === 'buyer_to_seller' ? (
                                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-6 text-gray-900 animate-in fade-in zoom-in-95 duration-300 text-left">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xl">⚠️</span>
                                        <h3 className="text-lg font-black tracking-tight text-amber-800">Account Conflict</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                        This email address is already linked to an active Buyer account. To sell on our platform, you cannot create a duplicate account with the same email.
                                    </p>
                                    
                                    <div className="space-y-3 font-sans">
                                        <Link 
                                            to={`/login?email=${encodeURIComponent(email)}&redirect=/become-seller`}
                                            className="w-full flex items-center justify-center py-3.5 px-4 bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-black/20 transition duration-200 text-center"
                                        >
                                            Upgrade My Account
                                        </Link>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setConflictType(null);
                                                setError("");
                                                setEmail("");
                                            }}
                                            className="w-full flex items-center justify-center py-3.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-widest rounded-xl transition duration-200 text-center"
                                        >
                                            Use a Different Email
                                        </button>
                                    </div>
                                </div>
                            ) : error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert">
                                    <p className="font-bold">Error</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSendOtp} className="space-y-5" autoComplete="off">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                        placeholder="Full Name" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); setConflictType(null); }}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                        placeholder="Email Address" autoComplete="off" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none pr-10"
                                                placeholder="••••••••" autoComplete="new-password" required />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition">
                                                {showPassword ? (
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm</label>
                                        <div className="relative">
                                            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none pr-10"
                                                placeholder="••••••••" autoComplete="new-password" required />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition">
                                                {showConfirmPassword ? (
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">I want to be a</label>
                                    <div className="flex space-x-4">
                                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all flex-1 ${role === 'buyer' ? 'border-black bg-gray-50' : 'hover:bg-gray-50'}`}>
                                            <input type="radio" name="role" value="buyer" checked={role === 'buyer'} onChange={(e) => { setRole(e.target.value); setError(""); setConflictType(null); }} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                                            <span className="ml-2 font-medium">Buyer</span>
                                        </label>
                                        <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all flex-1 ${role === 'seller' ? 'border-black bg-gray-50' : 'hover:bg-gray-50'}`}>
                                            <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={(e) => { setRole(e.target.value); setError(""); setConflictType(null); }} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                                            <span className="ml-2 font-medium">Seller</span>
                                        </label>
                                    </div>
                                </div>

                                {role === 'seller' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Shop Details</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Shop Name</label>
                                                <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                                                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                                    placeholder="Store Name" required={role === 'seller'} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 mb-1">Shop Number</label>
                                                <input type="text" value={shopNumber} onChange={(e) => setShopNumber(e.target.value)}
                                                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                                    placeholder="REG-00000" required={role === 'seller'} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Shop Address</label>
                                            <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)}
                                                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                                placeholder="Street, City" required={role === 'seller'} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-1">Shop Phone</label>
                                            <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)}
                                                className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent transition duration-200 outline-none"
                                                placeholder="+1..." required={role === 'seller'} />
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center mb-4">
                                    <input id="terms" type="checkbox" className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded" required />
                                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                        I agree to the <a href="#" className="font-bold underline">Terms of Service</a> and <a href="#" className="font-bold underline">Privacy Policy</a>
                                    </label>
                                </div>
                                <button type="submit"
                                    disabled={
                                        isLoading ||
                                        !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() ||
                                        (role === 'seller' && (!shopName.trim() || !shopNumber.trim() || !shopAddress.trim() || !shopPhone.trim()))
                                    }
                                    className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                                        isLoading ||
                                        !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() ||
                                        (role === 'seller' && (!shopName.trim() || !shopNumber.trim() || !shopAddress.trim() || !shopPhone.trim()))
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-black hover:bg-gray-800'
                                    }`}>
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Sending OTP...
                                        </span>
                                    ) : 'Continue with Email'}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-gray-600">
                                    Already have an account?{" "}
                                    <Link to="/login" className="font-bold text-black hover:underline">Sign in</Link>
                                </p>
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: OTP Verification ── */}
                    {step === "otp" && (
                        <>
                            <div className="text-center md:text-left mb-6">
                                {/* Back button */}
                                <button onClick={() => { setStep("details"); setError(""); setSuccessMsg(""); }}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>

                                {/* Email icon */}
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Check your email</h1>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    We sent a 6-digit verification code to<br />
                                    <span className="font-semibold text-gray-800">{email}</span>
                                </p>
                            </div>

                            {/* Messages */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4" role="alert">
                                    <p className="font-bold text-sm">Error</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                            {successMsg && !error && (
                                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-4">
                                    <p className="text-sm">{successMsg}</p>
                                </div>
                            )}

                            <form onSubmit={handleVerifyOtp}>
                                {/* 6-digit OTP boxes */}
                                <div className="flex justify-between gap-2 mb-6" onPaste={handleOtpPaste}>
                                    {otpDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (otpRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all duration-200
                                                ${digit ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'}
                                                focus:border-black focus:ring-2 focus:ring-black focus:ring-offset-1`}
                                        />
                                    ))}
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            Verifying...
                                        </span>
                                    ) : 'Verify & Create Account'}
                                </button>
                            </form>

                            {/* Resend */}
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-500">Didn't receive the code?</p>
                                {resendCooldown > 0 ? (
                                    <p className="text-sm text-gray-400 mt-1">
                                        Resend in <span className="font-semibold text-gray-700">{resendCooldown}s</span>
                                    </p>
                                ) : (
                                    <button onClick={handleResend} disabled={isLoading}
                                        className="mt-1 text-sm font-semibold text-black hover:underline disabled:opacity-50">
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Signup;
