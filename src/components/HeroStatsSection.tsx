// src/components/HeroStatsSection.tsx

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaFire, FaGlobe, FaTrophy, FaMedal } from 'react-icons/fa';
import ChainLogo from './ChainLogo';
import { SUPPORTED_CHAINS, ChainConfig } from '@/utils/constants';

interface HeroStatsSectionProps {
  // Current Chain Stats
  currentChainId: number | null;
  currentChainName: string;
  currentChainCheckins: number;
  currentChainStreak: number;
  
  // Global Stats
  totalCheckins: number;
  totalChains: number;
  maxStreak: number;
  
  // User Ranking (NEW)
  userRank?: number;
  totalUsers?: number;
  
  loading: boolean;
}

// CountUp Animation Component
const CountUpNumber: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1000 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(startValue + (endValue - startValue) * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
};

const HeroStatsSection: React.FC<HeroStatsSectionProps> = ({
  currentChainId,
  currentChainName,
  currentChainCheckins,
  currentChainStreak,
  totalCheckins,
  totalChains,
  maxStreak,
  userRank = 0,
  totalUsers = 0,
  loading,
}) => {
  const chainConfig: ChainConfig | undefined = currentChainId ? SUPPORTED_CHAINS[currentChainId] : undefined;
  
  // Calculate ranking percentage
  const rankPercentage = totalUsers > 0 ? ((userRank / totalUsers) * 100).toFixed(1) : 0;
  
  // Determine rank tier for styling
  const getRankTier = () => {
    if (userRank === 0) return { color: 'gray', label: 'Unranked', gradient: 'from-gray-400 to-gray-500' };
    if (userRank <= 10) return { color: 'gold', label: 'Top 10', gradient: 'from-yellow-400 to-yellow-600' };
    if (userRank <= 50) return { color: 'silver', label: 'Top 50', gradient: 'from-gray-300 to-gray-400' };
    if (userRank <= 100) return { color: 'bronze', label: 'Top 100', gradient: 'from-orange-400 to-orange-600' };
    return { color: 'default', label: `Top ${rankPercentage}%`, gradient: 'from-purple-400 to-purple-600' };
  };
  
  const rankTier = getRankTier();

  return (
    <div className="relative overflow-hidden rounded-2xl mb-16">
      {/* Animated Gradient Background - More subtle */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5" />
      
      {/* Decorative Blobs - Smaller */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      
      {/* Content - More compact */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-4 md:p-5">
        
        {/* Card 1: Current Chain Stats - More compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-3">
            {chainConfig && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 flex items-center justify-center flex-shrink-0">
                <ChainLogo
                  logoUrl={chainConfig.logoUrl}
                  altText={chainConfig.chainName}
                  size="md"
                  fallbackIcon="🔗"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Current Chain</p>
              <h3 className="text-base font-bold text-cyan-600 dark:text-cyan-400 truncate">
                {currentChainName || 'No Chain'}
              </h3>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Check-ins */}
            <div>
              {loading ? (
                <div className="h-12 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={currentChainCheckins}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white"
                  >
                    <CountUpNumber value={currentChainCheckins} />
                  </motion.span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">check-ins</span>
                </div>
              )}
            </div>
            
            {/* Current Streak */}
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/30 w-fit">
              <FaFire className="text-orange-500 dark:text-orange-400" />
              {loading ? (
                <div className="h-4 w-8 bg-orange-200 dark:bg-orange-800 animate-pulse rounded"></div>
              ) : (
                <span className="text-sm font-bold text-orange-600 dark:text-orange-300">
                  {currentChainStreak} day streak
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 2: All Chains (HERO) - With Best Streak Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-xl p-4 text-white shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FaGlobe className="text-lg text-white" />
                </div>
                <p className="text-cyan-100 text-sm font-medium">All Chains</p>
              </div>
              
              {/* Best Streak Badge - NEW POSITION */}
              {maxStreak > 0 && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                >
                  <FaFire className="text-yellow-300 text-xs" />
                  <span className="text-[12px] font-bold">{maxStreak} Best Streak</span>
                </motion.div>
              )}
            </div>
            
            {loading ? (
              <div className="h-12 w-24 bg-white/20 animate-pulse rounded-lg mb-2"></div>
            ) : (
              <motion.h2
                key={totalCheckins}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-5xl md:text-6xl font-black mb-1 drop-shadow-lg"
              >
                <CountUpNumber value={totalCheckins} duration={1200} />
              </motion.h2>
            )}
            
            <p className="text-cyan-100 text-sm font-medium mb-2">Total Check-ins</p>
            
            <div className="flex items-center gap-2 pt-2 border-t border-white/20">
              <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-md">🌐</span>
              </div>
              {loading ? (
                <div className="h-3 w-12 bg-white/20 animate-pulse rounded"></div>
              ) : (
                <span className="text-xs font-semibold">
                  {totalChains} {totalChains === 1 ? 'chain' : 'chains'}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Card 3: User Ranking - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-gradient-to-br ${rankTier.gradient} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
        >
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FaTrophy className="text-lg text-yellow-300" />
              </div>
              <p className="text-white/90 text-sm font-medium">Your Rank</p>
            </div>
            
            {loading ? (
              <div className="h-12 w-16 bg-white/20 animate-pulse rounded-lg mb-2"></div>
            ) : userRank === 0 ? (
              <div className="text-center py-2">
                <FaMedal className="text-4xl text-white/40 mx-auto mb-1" />
                <p className="text-xs text-white/70">Start checking in!</p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1 mb-1">
                  <motion.span
                    key={userRank}
                    initial={{ scale: 1.3, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-5xl font-black drop-shadow-lg"
                  >
                    #{<CountUpNumber value={userRank} duration={1000} />}
                  </motion.span>
                </div>
                
                <p className="text-white/90 text-sm font-medium mb-2">out of {totalUsers.toLocaleString()}</p>
                
                {/* Rank Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30"
                >
                  {userRank <= 10 ? (
                    <>
                      <span className="text-base">🏆</span>
                      <span className="text-xs font-bold">{rankTier.label}</span>
                    </>
                  ) : userRank <= 50 ? (
                    <>
                      <span className="text-base">🥈</span>
                      <span className="text-xs font-bold">{rankTier.label}</span>
                    </>
                  ) : userRank <= 100 ? (
                    <>
                      <span className="text-base">🥉</span>
                      <span className="text-xs font-bold">{rankTier.label}</span>
                    </>
                  ) : (
                    <>
                      <FaMedal className="text-xs" />
                      <span className="text-xs font-bold">{rankTier.label}</span>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HeroStatsSection;