import React from 'react';
import { AlertCircle, CheckCircle, X, Info } from 'lucide-react';

const PopupModal = ({ isOpen, message, type = 'info', onClose }) => {
    if (!isOpen) return null;

    const config = {
        error: { bg: 'bg-red-50', icon: AlertCircle, iconColor: 'text-red-500', titleColor: 'text-red-700', btn: 'bg-red-500 hover:bg-red-600', title: 'Error' },
        success: { bg: 'bg-green-50', icon: CheckCircle, iconColor: 'text-green-500', titleColor: 'text-green-700', btn: 'bg-green-500 hover:bg-green-600', title: 'Success' },
        info: { bg: 'bg-blue-50', icon: Info, iconColor: 'text-blue-500', titleColor: 'text-blue-700', btn: 'bg-blue-500 hover:bg-blue-600', title: 'Notification' }
    };

    const current = config[type] || config.info;
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
                <div className={`p-4 ${current.bg} flex justify-between items-start`}>
                    <div className="flex gap-3 items-center">
                        <Icon className={`w-6 h-6 ${current.iconColor}`} />
                        <h3 className={`font-bold ${current.titleColor}`}>
                            {current.title}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 text-center">
                    <p className="text-gray-700 font-medium leading-relaxed">{message}</p>
                    <div className="mt-6 flex justify-center">
                        <button 
                            onClick={onClose}
                            className={`px-8 py-2.5 rounded-xl font-bold text-white transition shadow-md ${current.btn}`}
                        >
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PopupModal;
