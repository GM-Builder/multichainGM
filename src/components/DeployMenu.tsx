import React from 'react';
import { motion } from 'framer-motion';
import { Disc, Zap, Sparkles } from 'lucide-react';

interface DeployMenuProps {
    onSelect: (option: 'simple' | 'factory' | 'ai_builder') => void;
}

const DeployMenu: React.FC<DeployMenuProps> = ({ onSelect }) => {
    return (
        <div className="max-w-5xl mx-auto mt-10">
            {/* Title */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Deploy Your Smart Contract</h2>
                <p className="text-gray-400 text-sm">Choose how you want to deploy your smart contract</p>
            </div>

            {/* Grid of 3 equal columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('simple')}
                    className="flex flex-col items-center justify-center p-8 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-[#1A1D24] hover:border-cyan-500/30 transition-all group min-h-[280px]"
                >
                    <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div className="text-lg font-bold text-white mb-2">Simple Deploy</div>
                    <p className="text-gray-400 text-center text-sm leading-relaxed max-w-xs">
                        Deploy a standard contract instantly on your chosen chain. Fast, cheap, and simple.
                    </p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('factory')}
                    className="flex flex-col items-center justify-center p-8 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-[#1A1D24] hover:border-purple-500/30 transition-all group min-h-[280px]"
                >
                    <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <Disc className="w-10 h-10 text-purple-400" />
                    </div>
                    <div className="text-lg font-bold text-white mb-2">Create Your Token</div>
                    <p className="text-gray-400 text-center text-sm leading-relaxed max-w-xs">
                        Full customization suite. Configure taxes, anti-bot, supply, and advanced features.
                    </p>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('ai_builder')}
                    className="relative flex flex-col items-center justify-center p-8 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-[#1A1D24] hover:border-emerald-500/30 transition-all group min-h-[280px] overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                >
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                    <div className="absolute top-4 right-4 z-20">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full uppercase tracking-wider">
                            New
                        </span>
                    </div>

                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 z-10">
                        <Sparkles className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold text-white mb-2 z-10">AI Contract Builder</div>
                    <p className="text-gray-400 text-center text-sm leading-relaxed max-w-xs z-10">
                        Describe your idea in plain text. AI generates, compiles, and deploys it automatically.
                    </p>
                </motion.button>
            </div>
        </div>
    );
};

export default DeployMenu;