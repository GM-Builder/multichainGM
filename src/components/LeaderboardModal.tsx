import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFire, FaUsers, FaTrophy, FaMedal, FaChevronDown, FaLayerGroup } from 'react-icons/fa';
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

  // Minimalist rank styling helper
  const getRankStyle = (index: number) => {
    if (index === 0) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (index === 1) return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    if (index === 2) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-slate-500 bg-slate-800/50 border-slate-700/50';
  };

  const getRankIcon = (index: number) => {
    if (index < 3) return <FaTrophy className="text-sm" />;
    return <span className="font-mono text-sm font-bold">#{index + 1}</span>;
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
    ? userReferralRank + 1 // Fixed: Was recursively referencing userReferralPosition
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="relative bg-[#0B0E14] rounded-2xl border border-white/5 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 border-b border-white/5 px-6 py-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xl font-bold text-white tracking-tight">Leaderboard</div>
                    <p className="text-sm text-slate-400">Top performers in the ecosystem</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Minimalist Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab('checkins')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'checkins'
                      ? 'bg-[#0B0E14] text-white shadow-sm border border-white/5'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <FaFire className={activeTab === 'checkins' ? 'text-orange-500' : ''} />
                    <span>Checkins</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('referrals')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'referrals'
                      ? 'bg-[#0B0E14] text-white shadow-sm border border-white/5'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    <FaUsers className={activeTab === 'referrals' ? 'text-cyan-500' : ''} />
                    <span>Referrals</span>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-6">

                  {/* User Stats Card */}
                  {address && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <FaMedal />
                        </div>
                        <div>
                          <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-0.5">Your Rank</p>
                          <code className="text-sm text-slate-300 font-mono">
                            {address.substring(0, 6)}...{address.substring(38)}
                          </code>
                        </div>
                      </div>
                      <div className="text-right">
                        {activeTab === 'checkins' ? (
                          <>
                            <p className="text-2xl font-bold text-white">
                              #{userCheckinPosition || userRanking?.rank || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              / {(userRanking?.totalUsers || topCheckins?.length || 0).toLocaleString()}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-white">
                              #{userReferralPosition || '-'}
                            </p>
                            <p className="text-xs text-slate-500">
                              / {(topReferrers?.length || 0).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* List Header */}
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-2 uppercase tracking-wider">
                    <span>Navigator</span>
                    <span>{activeTab === 'checkins' ? 'GMs' : 'Referrals'}</span>
                  </div>

                  {/* List Content */}
                  <div className="space-y-2">
                    {/* Checkins List */}
                    {activeTab === 'checkins' && (
                      <>
                        {checkinsLoading && (
                          <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                            ))}
                          </div>
                        )}

                        {!checkinsLoading && displayCheckins?.map((entry, index) => {
                          const isCurrentUser = entry.address.toLowerCase() === address?.toLowerCase();
                          return (
                            <div
                              key={entry.address}
                              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${isCurrentUser
                                ? 'bg-orange-500/5 border-orange-500/20'
                                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getRankStyle(index)}`}>
                                  {getRankIcon(index)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-mono text-sm ${isCurrentUser ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>
                                      {isCurrentUser ? 'You' : `${entry.address.substring(0, 6)}...${entry.address.substring(38)}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <FaLayerGroup className="text-[9px]" /> {entry.chains.length}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FaFire className="text-[9px] text-orange-500/70" /> {entry.maxStreak}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">{entry.totalCheckins.toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}

                        {!showFullCheckins && topCheckins && topCheckins.length > 10 && (
                          <button
                            onClick={() => setShowFullCheckins(true)}
                            className="w-full py-3 text-xs font-medium text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Show all</span>
                            <FaChevronDown />
                          </button>
                        )}
                      </>
                    )}

                    {/* Referrals List */}
                    {activeTab === 'referrals' && (
                      <>
                        {referralsLoading && (
                          <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
                            ))}
                          </div>
                        )}

                        {!referralsLoading && displayReferrals?.map((referrer, index) => {
                          const isCurrentUser = referrer.id.toLowerCase() === address?.toLowerCase();
                          return (
                            <div
                              key={referrer.id}
                              className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${isCurrentUser
                                ? 'bg-cyan-500/5 border-cyan-500/20'
                                : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                                }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getRankStyle(index)}`}>
                                  {getRankIcon(index)}
                                </div>
                                <div>
                                  <span className={`font-mono text-sm ${isCurrentUser ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                                    {isCurrentUser ? 'You' : `${referrer.id.substring(0, 6)}...${referrer.id.substring(38)}`}
                                  </span>
                                  {referrer.firstReferralTimestamp && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Since {new Date(referrer.firstReferralTimestamp * 1000).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">{referrer.totalReferrals.toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}

                        {!showFullReferrals && topReferrers && topReferrers.length > 10 && (
                          <button
                            onClick={() => setShowFullReferrals(true)}
                            className="w-full py-3 text-xs font-medium text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Show all</span>
                            <FaChevronDown />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 2px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.2);
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default LeaderboardModal;