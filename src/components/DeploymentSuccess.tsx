import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCheckCircle,
    FaRocket,
    FaExternalLinkAlt,
    FaCopy,
    FaTimes,
    FaCube
} from 'react-icons/fa';
import { getChainConfig } from '@/utils/constants';

interface DeploymentSuccessProps {
    isVisible: boolean;
    onClose: () => void;
    title?: string;
    tokenName?: string;
    tokenSymbol?: string;
    contractAddress: string;
    txHash?: string;
    chainId?: number;
    networkName?: string;
}

const DeploymentSuccess: React.FC<DeploymentSuccessProps> = ({
    isVisible,
    onClose,
    title = 'Deployment Successful!',
    tokenName,
    tokenSymbol,
    contractAddress,
    txHash,
    chainId,
    networkName
}) => {
    const [confettiPieces, setConfettiPieces] = useState<Array<{
        id: number;
        x: number;
        y: number;
        delay: number;
        color: string;
        size: number;
    }>>([]);

    const [copied, setCopied] = useState(false);
    const hasPlayedSound = useRef(false);

    // Generate confetti
    useEffect(() => {
        if (isVisible) {
            const pieces = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 150,
                y: Math.random() * -30,
                delay: Math.random() * 0.5,
                color: [
                    '#06b6d4', '#22d3ee', '#67e8f9', // Cyan shades
                    '#fbbf24', '#f59e0b',            // Gold shades
                    '#8b5cf6', '#a78bfa'             // Purple shades
                ][Math.floor(Math.random() * 7)],
                size: Math.random() * 6 + 4
            }));
            setConfettiPieces(pieces);

            // Play sound
            if (!hasPlayedSound.current) {
                hasPlayedSound.current = true;
                try {
                    const audio = new Audio('/sounds/success.mp3');
                    audio.volume = 0.4;
                    audio.play().catch(e => console.log('Audio play failed:', e));
                } catch (e) {
                    console.log('Audio not available');
                }
            }
        } else {
            hasPlayedSound.current = false;
        }
    }, [isVisible]);

    const handleCopy = () => {
        navigator.clipboard.writeText(contractAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getExplorerUrl = () => {
        if (!txHash) return null;
        if (chainId) {
            const config = getChainConfig(chainId);
            if (config?.blockExplorerUrls?.[0]) {
                return `${config.blockExplorerUrls[0]}/tx/${txHash}`;
            }
        }
        return null;
    };

    const getAddressExplorerUrl = () => {
        if (!contractAddress) return null;
        if (chainId) {
            const config = getChainConfig(chainId);
            if (config?.blockExplorerUrls?.[0]) {
                return `${config.blockExplorerUrls[0]}/address/${contractAddress}`;
            }
        }
        return null;
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                {/* Confetti container */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {confettiPieces.map((piece) => (
                        <motion.div
                            key={piece.id}
                            initial={{
                                y: piece.y,
                                x: 0,
                                opacity: 0,
                                scale: 0
                            }}
                            animate={{
                                y: [piece.y, piece.y + 100, 300],
                                x: [0, piece.x, piece.x * 1.5],
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1, 1, 0.5],
                                rotate: [0, Math.random() * 360, Math.random() * 720]
                            }}
                            transition={{
                                duration: 3,
                                delay: piece.delay,
                                ease: [0.2, 0.8, 0.2, 1]
                            }}
                            className="absolute top-1/2 left-1/2"
                            style={{
                                width: `${piece.size}px`,
                                height: `${piece.size}px`,
                                backgroundColor: piece.color,
                                borderRadius: piece.size > 7 ? '50%' : '2px',
                                boxShadow: `0 0 ${piece.size * 2}px ${piece.color}`
                            }}
                        />
                    ))}
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md mx-auto"
                >
                    {/* Glass Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-cyan-500/30 rounded-2xl blur-xl" />

                    <div className="relative bg-[#0B0E14]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Header Background Pattern */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-20 hover:bg-white/5 rounded-lg"
                        >
                            <FaTimes />
                        </button>

                        <div className="flex flex-col items-center p-8 pt-10 text-center relative z-10">
                            {/* Success Icon */}
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border border-dashed border-cyan-500/50"
                                />
                                <div className="relative w-24 h-24 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", delay: 0.2 }}
                                    >
                                        <FaRocket className="text-4xl text-cyan-400 transform -translate-y-1 translate-x-1" />
                                    </motion.div>
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-[#0B0E14]"
                                >
                                    <FaCheckCircle className="text-xl" />
                                </motion.div>
                            </div>

                            {/* Title & Network */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    {networkName && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                                            {networkName}
                                        </span>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-white mb-2">{title}</div>
                                {tokenName && (
                                    <p className="text-cyan-400 font-medium text-lg mb-1">
                                        {tokenName} <span className="opacity-70">(${tokenSymbol})</span>
                                    </p>
                                )}
                                <p className="text-gray-400 text-sm mb-6 max-w-[80%] mx-auto">
                                    Your contract has been successfully deployed and verified on the blockchain.
                                </p>
                            </motion.div>

                            {/* Contract Address Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="w-full bg-black/20 rounded-xl border border-white/5 p-4 mb-6"
                            >
                                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold text-left">Contract Address</p>
                                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2.5 border border-white/5 hover:border-cyan-500/30 transition-colors group">
                                    <FaCube className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                                    <code className="text-sm text-gray-300 font-mono flex-1 text-left truncate">
                                        {contractAddress}
                                    </code>
                                    <button
                                        onClick={handleCopy}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
                                        title="Copy Address"
                                    >
                                        {copied ? (
                                            <FaCheckCircle className="text-green-400" />
                                        ) : (
                                            <FaCopy className="text-gray-400 hover:text-white" />
                                        )}
                                    </button>
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col w-full gap-3"
                            >
                                <div className="flex gap-3">
                                    {(getExplorerUrl() || getAddressExplorerUrl()) && (
                                        <a
                                            href={getExplorerUrl() || getAddressExplorerUrl() || '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all flex items-center justify-center gap-2 text-sm group"
                                        >
                                            View Explorer
                                            <FaExternalLinkAlt className="text-gray-400 group-hover:text-white transition-colors text-xs" />
                                        </a>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/20"
                                    >
                                        Awesome!
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default DeploymentSuccess;
