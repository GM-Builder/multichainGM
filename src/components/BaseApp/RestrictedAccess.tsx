import React, { useEffect, useState } from 'react';
import { FaRocket, FaMobileAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

export const RestrictedAccess: React.FC = () => {
    const [deepLink, setDeepLink] = useState('');

    useEffect(() => {
        // Construct deep link to current URL
        if (typeof window !== 'undefined') {
            const currentUrl = window.location.href;
            const link = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
            setDeepLink(link);
        }
    }, []);

    const handleOpenApp = () => {
        if (deepLink) {
            window.location.href = deepLink;
        }
    };

    return (
        <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050608] to-[#050608] animate-pulse-slow"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 max-w-md w-full bg-[#0B0E14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
            >
                <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20 rotate-3">
                    <FaRocket className="text-4xl text-white" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">
                    Open in Base App
                </h1>

                <p className="text-gray-400 mb-8 leading-relaxed">
                    This feature is exclusively designed for the Base Ecosystem. Please open it in the Base App or Coinbase Wallet for the full experience.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={handleOpenApp}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-xl"
                    >
                        <FaRocket className="text-lg" />
                        Open Base App
                    </button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0B0E14] px-2 text-gray-500">Don't have the app?</span>
                        </div>
                    </div>

                    <a
                        href="https://wallet.coinbase.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full py-3 bg-white/5 text-white font-medium rounded-xl hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
                    >
                        <FaMobileAlt />
                        Download App
                    </a>
                </div>
            </motion.div>
        </div>
    );
};
