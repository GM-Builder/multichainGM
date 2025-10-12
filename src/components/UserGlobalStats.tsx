// src/components/UserGlobalStats.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FaGlobe, FaStar } from 'react-icons/fa';

interface UserGlobalStatsProps {
  totalCheckins: number;
  totalChains: number;
  maxStreak: number;
  loading: boolean;
}

const UserGlobalStats: React.FC<UserGlobalStatsProps> = ({
  totalCheckins,
  totalChains,
  maxStreak,
  loading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/20 dark:to-blue-900/20 backdrop-blur-xl border border-cyan-200/50 dark:border-cyan-700/50 rounded-xl shadow-sm p-4"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <FaGlobe className="text-white w-5 h-5" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Total All Chains */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <span>All Chains</span>
            </span>
            {loading ? (
              <div className="h-7 w-16 bg-cyan-200 dark:bg-cyan-800 animate-pulse rounded"></div>
            ) : (
              <motion.span
                key={totalCheckins}
                initial={{ scale: 1.3, color: '#06b6d4' }}
                animate={{ scale: 1, color: 'inherit' }}
                transition={{ duration: 0.4 }}
                className="text-2xl font-bold text-cyan-600 dark:text-cyan-400"
              >
                {totalCheckins.toLocaleString()}
              </motion.span>
            )}
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Chains Count */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">Chains</span>
            {loading ? (
              <div className="h-5 w-6 bg-cyan-200 dark:bg-cyan-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {totalChains}
              </span>
            )}
          </div>

          {/* Max Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30">
            <FaStar className="text-yellow-500 dark:text-yellow-400 w-3.5 h-3.5" />
            <div className="flex flex-col">
              <span className="text-[10px] text-yellow-600 dark:text-yellow-400 leading-none">Best</span>
              {loading ? (
                <div className="h-4 w-6 bg-yellow-200 dark:bg-yellow-800 animate-pulse rounded mt-0.5"></div>
              ) : (
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-300">
                  {maxStreak}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserGlobalStats;