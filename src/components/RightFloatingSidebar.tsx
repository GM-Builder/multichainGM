import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronRight, FaChevronLeft, FaUser, FaCopy } from 'react-icons/fa';
import HeroStatsSection from '@/components/HeroStatsSection';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { SidebarReferralCard } from '@/components/SidebarReferralCard';

interface Props {
  isOpen: boolean;
  toggle: () => void;
  web3State: any;
  getAvatarUrl: (address: string) => string;
  handleCopyAddress: () => void;
  copySuccess: boolean;
  currentChainName: string;
  currentChainStats: any;
  userStats: any;
  userRanking: any;
  chainStatsLoading: boolean;
  userStatsLoading: boolean;
  rankingLoading: boolean;
  userCheckins: any[] | undefined;
  myReferrals: any;
  userReferrerData: any;
  handleCopyReferralLink: () => void;
  onOpenReferralModal: () => void;
  onSwitchToBase: () => void;
  formatAddress: (addr: string) => string;
}

const RightFloatingSidebar: React.FC<Props> = ({
  isOpen,
  toggle,
  web3State,
  getAvatarUrl,
  handleCopyAddress,
  copySuccess,
  currentChainName,
  currentChainStats,
  userStats,
  userRanking,
  chainStatsLoading,
  userStatsLoading,
  rankingLoading,
  userCheckins,
  myReferrals,
  userReferrerData,
  handleCopyReferralLink,
  onOpenReferralModal,
  onSwitchToBase,
  formatAddress,
}) => {
  if (!web3State?.isConnected || !web3State?.address) return null;

  return (
    <>
      {/* Toggle Button - Sticks to right edge */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={toggle}
        className={`fixed top-1/2 -translate-y-1/2 z-40 bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-3 rounded-l-xl shadow-xl hover:shadow-2xl transition-all duration-300 ${
          isOpen ? 'right-[360px]' : 'right-0'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ width: '48px', height: '48px' }}
      >
        <div className="relative">
          {isOpen ? (
            <FaChevronRight className="text-xl" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white">
                <img src={getAvatarUrl(web3State.address)} alt="Avatar" className="w-full h-full" />
              </div>
            </div>
          )}
        </div>
      </motion.button>

      {/* Floating Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-24 bottom-0 w-[360px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-30 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Profile Card with Avatar & Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border border-cyan-200 dark:border-cyan-800 shadow-lg p-6"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-cyan-400/30 shadow-lg">
                    <img src={getAvatarUrl(web3State.address)} alt="Avatar" className="w-full h-full" />
                  </div>

                  {/* Address with Copy Button */}
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <FaUser className="text-xs" />
                      <span>Your Address</span>
                    </div>
                    <div
                      onClick={handleCopyAddress}
                      className="group relative font-mono text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-gray-800 dark:text-gray-200">
                          {web3State.address.substring(0, 6)}...{web3State.address.substring(38)}
                        </span>
                        <FaCopy
                          className={`text-xs transition-colors ${
                            copySuccess ? 'text-green-500' : 'text-gray-400 group-hover:text-cyan-500'
                          }`}
                        />
                      </div>

                      {/* Tooltip */}
                      {copySuccess ? (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap shadow-lg">
                          Copied! ✓
                        </div>
                      ) : (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                          Click to copy
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Hero Stats Section */}
              <HeroStatsSection
                currentChainId={web3State.chainId || null}
                currentChainName={currentChainName}
                currentChainCheckins={currentChainStats?.totalCheckins || 0}
                currentChainStreak={currentChainStats?.currentStreak || 0}
                totalCheckins={userStats?.totalCheckins || 0}
                totalChains={userStats?.chains.length || 0}
                maxStreak={userStats?.maxStreak || 0}
                userRank={userRanking?.rank || 0}
                totalUsers={userRanking?.totalUsers || 0}
                loading={chainStatsLoading || userStatsLoading || rankingLoading}
              />

              {/* Activity Heatmap */}
              {userStats && (
                <ActivityHeatmap checkins={userCheckins || []} currentStreak={userStats.currentStreak} maxStreak={userStats.maxStreak} />
              )}

              {/* Referral Card */}
              <SidebarReferralCard
                canUseReferral={Boolean(userStats)}
                myReferralsCount={myReferrals?.totalReferrals || 0}
                userReferredBy={userReferrerData?.referredBy?.id || null}
                onCopyLink={handleCopyReferralLink}
                onCardClick={onOpenReferralModal}
                onSwitchToBase={onSwitchToBase}
                formatAddress={formatAddress}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default RightFloatingSidebar;
