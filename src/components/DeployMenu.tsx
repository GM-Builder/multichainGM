import React from 'react';
import { motion } from 'framer-motion';
import { Disc, Zap } from 'lucide-react';

interface DeployMenuProps {
    onSelect: (option: 'simple' | 'factory') => void;
}

const DeployMenu: React.FC<DeployMenuProps> = ({ onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-10">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect('simple')}
                className="flex flex-col items-center justify-center p-8 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-[#1A1D24] hover:border-cyan-500/30 transition-all group min-h-[300px]"
            >
                <div className="w-24 h-24 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-12 h-12 text-cyan-400" />
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
                className="flex flex-col items-center justify-center p-8 bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl hover:bg-[#1A1D24] hover:border-purple-500/30 transition-all group min-h-[300px]"
            >
                <div className="w-24 h-24 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Disc className="w-12 h-12 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-white mb-2">Create Your Token</div>
                <p className="text-gray-400 text-center text-sm leading-relaxed max-w-xs">
                    Full customization suite. Configure taxes, anti-bot, supply, and advanced features.
                </p>
            </motion.button>
        </div>
    );
};

export default DeployMenu;
