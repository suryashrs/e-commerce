import React from 'react';
import { useNavigate } from 'react-router-dom';

const AuthGuardModal = ({ isOpen, onClose, message = "Please log in first to continue." }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        navigate('/login');
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4 animate-fade-in-up">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-2 text-black">Login Required</h3>
                <p className="text-gray-600 mb-6 font-medium">
                    {message}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleLogin}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg transform active:scale-95"
                    >
                        Login
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthGuardModal;
