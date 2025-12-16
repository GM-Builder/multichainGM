import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
  FaExternalLinkAlt,
  FaArrowRight,
  FaFire,
  FaTrophy,
  FaCompactDisc
} from 'react-icons/fa';
import { getChainConfig } from '@/utils/constants';

interface NotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onAwesomeClick?: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  txHash?: string | null;
  chainId?: number | null;
  // Success animation props
  checkinCount?: number;
  streak?: number;
  chainName?: string;
}

const Notification: React.FC<NotificationProps> = ({
  isOpen,
  onClose,
  onAwesomeClick,
  type,
  title,
  message,
  txHash = null,
  chainId = null,
  checkinCount = 0,
  streak = 0,
  chainName = ''
}) => {
  const getTxExplorerUrl = (): string | null => {
    if (!txHash || !chainId) return null;

    const chainConfig = getChainConfig(chainId);
    if (!chainConfig || !chainConfig.blockExplorerUrls || chainConfig.blockExplorerUrls.length === 0) {
      return null;
    }

    return `${chainConfig.blockExplorerUrls[0]}/tx/${txHash}`;
  };

  const handleAwesomeClick = () => {
    if (onAwesomeClick) {
      onAwesomeClick();
    }
    onClose();
  };

  // Check if streak milestone
  const isStreakMilestone = streak > 0 && (streak % 7 === 0 || streak % 30 === 0 || streak === 100);
  const getMilestoneText = () => {
    if (streak === 100) return '💯 Century Streak!';
    if (streak % 30 === 0) return '📅 Monthly Legend!';
    if (streak % 7 === 0) return '🔥 Weekly Warrior!';
    return '';
  };

  // Generate confetti for success
  const confettiPieces = type === 'success' ? Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 100,
    y: Math.random() * -20,
    delay: Math.random() * 0.3,
    color: ['#06b6d4', '#22d3ee', '#67e8f9', '#fbbf24'][Math.floor(Math.random() * 4)],
    size: Math.random() * 4 + 3
  })) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[9998]"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            {/* Confetti for success */}
            {type === 'success' && confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  y: piece.y,
                  x: 0,
                  opacity: 1,
                  scale: 1,
                  rotate: 0
                }}
                animate={{
                  y: [piece.y, piece.y - 80, 120],
                  x: [0, piece.x * 1.2, piece.x * 1.8],
                  opacity: [0, 1, 1, 0],
                  scale: [0.8, 1.1, 1, 0.6],
                  rotate: [0, Math.random() * 360, Math.random() * 720]
                }}
                transition={{
                  duration: 2,
                  delay: piece.delay,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
                className="absolute pointer-events-none"
                style={{
                  width: `${piece.size}px`,
                  height: `${piece.size}px`,
                  backgroundColor: piece.color,
                  borderRadius: piece.size > 5 ? '50%' : '2px',
                  boxShadow: `0 0 ${piece.size}px ${piece.color}40`
                }}
              />
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full rounded-2xl shadow-2xl border border-white/5 bg-[#0B0E14]/60 backdrop-blur-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Grid Background for success */}
              {type === 'success' && (
                <div className="absolute inset-0 opacity-5">
                  <motion.div
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-full h-full"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />
                </div>
              )}

              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between mb-4">
                  {type === 'success' ? (
                    // Success with orbit animation
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                        className="absolute w-14 h-14 border border-cyan-500/30 rounded-full"
                      />

                      <motion.div
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: 2,
                          ease: "easeInOut"
                        }}
                        className="relative z-10 p-3 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                      >
                        {isStreakMilestone ? (
                          <FaTrophy className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <FaCheckCircle className="h-6 w-6" />
                        )}
                      </motion.div>

                      {/* Orbiting particles */}
                      {[0, 120, 240].map((angle, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            rotate: [angle, angle + 360]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.3
                          }}
                          className="absolute w-14 h-14"
                        >
                          <div className="absolute top-0 left-1/2 w-1 h-1 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-full bg-red-500/20 border border-red-500/30 text-red-400">
                      <FaExclamationTriangle className="h-6 w-6" />
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                </div>

                <h3 className={`text-xl font-bold mb-2 ${type === 'success'
                  ? 'text-cyan-400'
                  : 'text-red-400'
                  }`}>
                  {isStreakMilestone ? (
                    <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      {getMilestoneText()}
                    </span>
                  ) : (
                    title
                  )}
                </h3>

                <p className="text-gray-300 mb-4">
                  {message}
                </p>

                {/* Success Stats */}
                {type === 'success' && (checkinCount > 0 || streak > 0) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center gap-2 mb-4"
                  >
                    {checkinCount > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
                        <FaCompactDisc className="text-cyan-400 text-xs" />
                        <span className="text-sm font-bold text-white">+{checkinCount}</span>
                        <span className="text-[10px] text-cyan-400/70">GM</span>
                      </div>
                    )}

                    {streak > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm">
                        <FaFire className="text-orange-400 text-xs" />
                        <span className="text-sm font-bold text-white">{streak}</span>
                        <span className="text-[10px] text-orange-400/70">days</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {chainName && type === 'success' && (
                  <p className="text-xs text-cyan-400/80 font-medium text-center mb-4">
                    on <span className="text-cyan-300">{chainName}</span>
                  </p>
                )}

                {txHash && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex flex-col">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-400">Transaction Hash:</span>
                        <span className="text-xs font-mono text-gray-300">
                          {txHash.substring(0, 8)}...{txHash.substring(txHash.length - 8)}
                        </span>
                      </div>

                      {getTxExplorerUrl() && (
                        <a
                          href={getTxExplorerUrl() || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-center py-2 px-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20
                                     text-cyan-300 hover:bg-cyan-500/20
                                     transition-colors flex items-center justify-center"
                        >
                          <span>View on Explorer</span>
                          <FaExternalLinkAlt className="ml-2 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAwesomeClick}
                    className={`py-2 px-4 rounded-lg text-white transition-colors flex items-center ${type === 'success'
                      ? 'bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400'
                      : 'bg-red-500/20 border border-red-500/30 hover:border-red-400/50 text-red-400'
                      }`}
                  >
                    <span>{type === 'success' ? 'Awesome!' : 'Dismiss'}</span>
                    <FaArrowRight className="ml-2 h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Bottom Accent Line for success */}
              {type === 'success' && (
                <motion.div
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                />
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Notification;