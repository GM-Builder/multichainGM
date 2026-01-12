import React from 'react';
import { motion } from 'framer-motion';
import {
    FaHome,
    FaChartBar,
    FaRocket,
    FaComments,
    FaUser
} from 'react-icons/fa';

interface BaseAppLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const BaseAppLayout: React.FC<BaseAppLayoutProps> = ({
    children,
    activeTab,
    onTabChange
}) => {
    const tabs = [
        { id: 'home', icon: FaHome, label: 'Home' },
        { id: 'stats', icon: FaChartBar, label: 'Stats' },
        { id: 'deploy', icon: FaRocket, label: 'Deploy' },
        { id: 'chat', icon: FaComments, label: 'Chat' },
        { id: 'profile', icon: FaUser, label: 'Profile' },
    ];

    return (
        <div className="min-h-screen bg-[#050608] text-white flex flex-col relative overflow-hidden">
            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
                <div className="max-w-md mx-auto w-full min-h-full pt-4">
                    {children}
                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/90 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
                <div className="max-w-md mx-auto px-6 h-[80px] flex items-center justify-between">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="relative flex flex-col items-center justify-center w-12 h-12"
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-cyan-500/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}

                                <tab.icon
                                    className={`relative z-10 w-5 h-5 transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-gray-500'
                                        }`}
                                />

                                <span className={`relative z-10 text-[10px] mt-1 font-medium transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500'
                                    }`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
