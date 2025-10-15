import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFire, FaUsers, FaTrophy, FaMedal, FaChevronDown } from 'react-icons/fa';
import { useLeaderboard } from '@/hooks/useSubgraph';
import { useTopReferrers } from '@/hooks/useReferral';
import { useUserRanking } from '@/hooks/useUserRangking';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | null;
}

type TabType = 'checkins' | 'referrals';

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  address,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('checkins');
  const [showFullCheckins, setShowFullCheckins] = useState(false);
  const [showFullReferrals, setShowFullReferrals] = useState(false);

  const { data: topCheckins, loading: checkinsLoading } = useLeaderboard();
  const { data: topReferrers, loading: referralsLoading } = useTopReferrers(50);
  const { data: userRanking } = useUserRanking(address);

  if (!isOpen) return null;

  const getMedalColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 via-yellow-500 to-yellow-600';
    if (index === 1) return 'from-gray-300 via-gray-400 to-gray-500';
    if (index === 2) return 'from-orange-400 via-orange-500 to-orange-600';
    return 'from-slate-600 to-slate-700';
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const displayCheckins = showFullCheckins ? topCheckins : topCheckins?.slice(0, 10);
  const displayReferrals = showFullReferrals ? topReferrers : topReferrers?.slice(0, 10);

  const userCheckinRank = topCheckins?.findIndex(
    entry => entry.address.toLowerCase() === address?.toLowerCase()
  );
  const userCheckinPosition = userCheckinRank !== undefined && userCheckinRank !== -1 
    ? userCheckinRank + 1 
    : null;

  const userReferralRank = topReferrers?.findIndex(
    ref => ref.id.toLowerCase() === address?.toLowerCase()
  );
  const userReferralPosition = userReferralRank !== undefined && userReferralRank !== -1 
    ? userReferralRank + 1 
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with Starfield */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          >
            <div className="absolute inset-0 opacity-20">
              {[...Array(50)].map((_, i) => (
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
          </motion.div>

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top edge */}
              <div className="h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

              {/* Header */}
              <div className="flex-shrink-0 border-b border-slate-700/50 px-6 py-5 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg border border-purple-500/30">
                      <FaTrophy className="text-2xl text-yellow-400" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
                      <p className="text-sm text-slate-400 mt-1">Top performers in the ecosystem</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all group"
                  >
                    <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                      <FaTimes className="text-slate-400 group-hover:text-slate-200 text-xl" />
                    </motion.div>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setActiveTab('checkins')}
                    className={`relative flex-1 px-4 py-3 rounded-xl font-semibold transition-all overflow-hidden ${
                      activeTab === 'checkins'
                        ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-300'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    {activeTab === 'checkins' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 animate-shimmer"></div>
                    )}
                    <div className="relative flex items-center justify-center gap-2">
                      <FaFire className={activeTab === 'checkins' ? 'text-orange-400' : 'text-slate-500'} />
                      <span>Top Checkins</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('referrals')}
                    className={`relative flex-1 px-4 py-3 rounded-xl font-semibold transition-all overflow-hidden ${
                      activeTab === 'referrals'
                        ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    {activeTab === 'referrals' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 animate-shimmer"></div>
                    )}
                    <div className="relative flex items-center justify-center gap-2">
                      <FaUsers className={activeTab === 'referrals' ? 'text-cyan-400' : 'text-slate-500'} />
                      <span>Top Referrers</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Your Ranking Card */}
                {address && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                          <FaMedal className="text-white text-xl" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-300 font-medium">Your Ranking</p>
                          <code className="text-xs font-mono text-slate-300">
                            {address.substring(0, 10)}...{address.substring(38)}
                          </code>
                        </div>
                      </div>
                      <div className="text-right">
                        {activeTab === 'checkins' ? (
                          <>
                            <p className="text-3xl font-bold text-purple-400">
                              #{userCheckinPosition || userRanking?.rank || '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                              of {userRanking?.totalUsers || topCheckins?.length || 0}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-purple-400">
                              #{userReferralPosition || '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                              of {topReferrers?.length || 0}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Checkins Tab */}
                {activeTab === 'checkins' && (
                  <div className="space-y-3">
                    {checkinsLoading ? (
                      <div className="space-y-3">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : displayCheckins && displayCheckins.length > 0 ? (
                      <>
                        {displayCheckins.map((entry, index) => {
                          const isCurrentUser = entry.address.toLowerCase() === address?.toLowerCase();
                          const isTopThree = index < 3;
                          
                          return (
                            <motion.div
                              key={entry.address}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`relative flex items-center justify-between p-4 rounded-xl transition-all overflow-hidden ${
                                isCurrentUser
                                  ? 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-500/50 shadow-lg shadow-orange-500/10'
                                  : isTopThree
                                    ? 'bg-slate-800/50 border border-slate-700/50 shadow-md hover:shadow-lg hover:border-slate-600/50'
                                    : 'bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-600/40'
                              }`}
                            >
                              <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center font-bold shadow-lg ${
                                  isTopThree ? 'text-xl' : 'text-sm'
                                } text-white border-2 border-white/20`}>
                                  {getMedalEmoji(index)}
                                </div>
                                <div>
                                  <code className="text-sm font-mono text-slate-200 block font-semibold">
                                    {isCurrentUser ? 'You' : `${entry.address.substring(0, 10)}...${entry.address.substring(38)}`}
                                  </code>
                                  <div className="flex items-center gap-3 mt-1">
                                    <p className="text-xs text-slate-400">
                                      {entry.chains.length} chain{entry.chains.length > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      🔥 {entry.maxStreak} streak
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right relative z-10">
                                <p className="text-2xl font-bold text-orange-400">
                                  {entry.totalCheckins}
                                </p>
                                <p className="text-xs text-slate-400">GMs</p>
                              </div>
                              
                              {isTopThree && !isCurrentUser && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-shimmer"></div>
                              )}
                            </motion.div>
                          );
                        })}
                        
                        {!showFullCheckins && topCheckins && topCheckins.length > 10 && (
                          <button
                            onClick={() => setShowFullCheckins(true)}
                            className="w-full py-3 px-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-700/50 hover:border-slate-600/50"
                          >
                            <span>Show More</span>
                            <FaChevronDown className="text-sm" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                          <FaFire className="text-4xl text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-lg font-medium">No data available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Referrals Tab */}
                {activeTab === 'referrals' && (
                  <div className="space-y-3">
                    {referralsLoading ? (
                      <div className="space-y-3">
                        {[...Array(10)].map((_, i) => (
                          <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <div className="w-12 h-12 bg-slate-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                              <div className="h-3 bg-slate-700 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : displayReferrals && displayReferrals.length > 0 ? (
                      <>
                        {displayReferrals.map((referrer, index) => {
                          const isCurrentUser = referrer.id.toLowerCase() === address?.toLowerCase();
                          const isTopThree = index < 3;
                          
                          return (
                            <motion.div
                              key={referrer.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`relative flex items-center justify-between p-4 rounded-xl transition-all overflow-hidden ${
                                isCurrentUser
                                  ? 'bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                  : isTopThree
                                    ? 'bg-slate-800/50 border border-slate-700/50 shadow-md hover:shadow-lg hover:border-slate-600/50'
                                    : 'bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-600/40'
                              }`}
                            >
                              <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMedalColor(index)} flex items-center justify-center font-bold shadow-lg ${
                                  isTopThree ? 'text-xl' : 'text-sm'
                                } text-white border-2 border-white/20`}>
                                  {getMedalEmoji(index)}
                                </div>
                                <div>
                                  <code className="text-sm font-mono text-slate-200 block font-semibold">
                                    {isCurrentUser ? 'You' : `${referrer.id.substring(0, 10)}...${referrer.id.substring(38)}`}
                                  </code>
                                  {referrer.firstReferralTimestamp && (
                                    <p className="text-xs text-slate-400 mt-1">
                                      Since {new Date(referrer.firstReferralTimestamp * 1000).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right relative z-10">
                                <p className="text-2xl font-bold text-cyan-400">
                                  {referrer.totalReferrals}
                                </p>
                                <p className="text-xs text-slate-400">referrals</p>
                              </div>
                              
                              {isTopThree && !isCurrentUser && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-shimmer"></div>
                              )}
                            </motion.div>
                          );
                        })}
                        
                        {!showFullReferrals && topReferrers && topReferrers.length > 10 && (
                          <button
                            onClick={() => setShowFullReferrals(true)}
                            className="w-full py-3 px-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-700/50 hover:border-slate-600/50"
                          >
                            <span>Show More</span>
                            <FaChevronDown className="text-sm" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                          <FaUsers className="text-4xl text-slate-500" />
                        </div>
                        <p className="text-slate-400 text-lg font-medium">No referrers yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Decorative bottom edge */}
              <div className="h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
            </motion.div>
          </div>

          {/* CSS Animations */}
          <style jsx>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 1; }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            .animate-shimmer {
              animation: shimmer 3s infinite;
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.3);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(100, 116, 139, 0.5);
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(100, 116, 139, 0.7);
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeaderboardModal;