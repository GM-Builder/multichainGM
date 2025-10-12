// src/components/UserChainStats.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaFire } from 'react-icons/fa';
import ChainLogo from './ChainLogo';
import { SUPPORTED_CHAINS, ChainConfig } from '@/utils/constants';

interface UserChainStatsProps {
  chainId: number | null;
  chainName: string;
  totalCheckins: number;
  currentStreak: number;
  loading: boolean;
}

const UserChainStats: React.FC<UserChainStatsProps> = ({
  chainId,
  chainName,
  totalCheckins,
  currentStreak,
  loading,
}) => {
  const chainConfig: ChainConfig | undefined = chainId ? SUPPORTED_CHAINS[chainId] : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-xl shadow-sm p-4"
    >
      <div className="flex items-center gap-3">
        {/* Current Chain Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg">
          {chainConfig && (
            <ChainLogo
              logoUrl={chainConfig.logoUrl}
              altText={chainConfig.chainName}
              size="sm"
              fallbackIcon="🔗"
            />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {chainName || 'No Chain'}
          </span>
        </div>

        {/* Stats Display */}
        <div className="flex items-center gap-4">
          {/* Total Checkins */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Check-ins</span>
            {loading ? (
              <div className="h-6 w-12 bg-gray-200 dark:bg-slate-700 animate-pulse rounded"></div>
            ) : (
              <motion.span
                key={totalCheckins}
                initial={{ scale: 1.2, color: '#06b6d4' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.3 }}
                className="text-lg font-bold text-gray-800 dark:text-gray-100"
              >
                {totalCheckins.toLocaleString()}
              </motion.span>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/30">
            <FaFire className="text-orange-500 dark:text-orange-400 w-3 h-3" />
            {loading ? (
              <div className="h-4 w-8 bg-orange-200 dark:bg-orange-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-sm font-semibold text-orange-600 dark:text-orange-300">
                {currentStreak}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserChainStats;