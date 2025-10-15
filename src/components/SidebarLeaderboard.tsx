import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaFire, FaUsers } from 'react-icons/fa';
import { useLeaderboard } from '@/hooks/useSubgraph';
import { useTopReferrers } from '@/hooks/useReferral';

interface SidebarLeaderboardCardProps {
  address: string | null;
  onCardClick: () => void;
}

export const SidebarLeaderboardCard: React.FC<SidebarLeaderboardCardProps> = ({ 
  address, 
  onCardClick 
}) => {
  const { data: topCheckins, loading: checkinsLoading } = useLeaderboard();
  const { data: topReferrers, loading: referrersLoading } = useTopReferrers(3);

  if (!address) return null;

  const loading = checkinsLoading || referrersLoading;
  const topCheckinsData = topCheckins?.slice(0, 3) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      onClick={onCardClick}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 cursor-pointer hover:border-purple-500/30 transition-all duration-300 group"
    >
      {/* Starfield Background */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg border border-purple-500/30 group-hover:shadow-xl group-hover:border-purple-400/40 transition-all">
            <FaTrophy className="text-xl text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Leaderboard</h3>
            <p className="text-xs text-purple-400">Top Performers</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-3 bg-slate-700/50 rounded w-24 mb-3"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="w-8 h-8 rounded-full bg-slate-700/50"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-700/50 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Checkins Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <FaFire className="text-orange-400 text-xs" />
                </div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Top Checkins</h4>
              </div>
              
              {topCheckinsData.length > 0 ? (
                <div className="space-y-2">
                  {topCheckinsData.map((entry, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const isCurrentUser = entry.address.toLowerCase() === address?.toLowerCase();
                    
                    return (
                      <motion.div
                        key={entry.address}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all border ${
                          isCurrentUser
                            ? 'bg-orange-900/20 border-orange-500/30'
                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-sm font-bold text-white shadow-sm border border-white/20">
                            {medals[index]}
                          </div>
                          <div>
                            <code className="text-xs font-mono text-slate-200 block">
                              {isCurrentUser ? 'You' : `${entry.address.substring(0, 6)}...${entry.address.substring(38)}`}
                            </code>
                            <p className="text-[10px] text-slate-500">
                              {entry.chains.length} chain{entry.chains.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-orange-400">
                            {entry.totalCheckins}
                          </p>
                          <p className="text-[10px] text-slate-500">GMs</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">No data yet</p>
              )}
            </div>

            {/* Top Referrers Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-cyan-500/30">
                  <FaUsers className="text-cyan-400 text-xs" />
                </div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Top Referrers</h4>
              </div>
              
              {topReferrers && topReferrers.length > 0 ? (
                <div className="space-y-2">
                  {topReferrers.map((referrer, index) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const isCurrentUser = referrer.id.toLowerCase() === address?.toLowerCase();
                    
                    return (
                      <motion.div
                        key={referrer.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className={`flex items-center justify-between p-2 rounded-lg transition-all border ${
                          isCurrentUser
                            ? 'bg-cyan-900/20 border-cyan-500/30'
                            : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-600/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-sm border border-white/20">
                            {medals[index]}
                          </div>
                          <code className="text-xs font-mono text-slate-200">
                            {isCurrentUser ? 'You' : `${referrer.id.substring(0, 6)}...${referrer.id.substring(38)}`}
                          </code>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-cyan-400">
                            {referrer.totalReferrals}
                          </p>
                          <p className="text-[10px] text-slate-500">refs</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2">No referrers yet</p>
              )}
            </div>

            {/* View Full CTA */}
            <div className="pt-3 border-t border-slate-700/50">
              <p className="text-xs text-purple-400 font-medium text-center">
                Click to view full leaderboard →
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
};

export default SidebarLeaderboardCard;