// src/pages/farcaster.tsx
import React, { useEffect, useMemo } from 'react';
import { useFarcasterUser } from '@/hooks/useFarcasterContext';
import { useWalletState } from '@/hooks/useWalletState';
import { useUserStats } from '@/hooks/useSubgraph';
import { useUserChainStats } from '@/hooks/useUserChainStats';
import { useUserRanking } from '@/hooks/useUserRangking';
import FixedMultiChainCheckinGrid from '@/components/MultiChainCheckinGrid';
import HeroStatsSection from '@/components/HeroStatsSection';
import { motion } from 'framer-motion';
import { FaUser } from 'react-icons/fa';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { getChainConfig } from '@/utils/constants';

const FarcasterMiniApp = () => {
  const { user, isLoading: userLoading } = useFarcasterUser();
  const { web3State, connectWallet } = useWalletState();

  useEffect(() => {
    const signalReady = async () => {
      try {
        const { default: sdk } = await import('@farcaster/frame-sdk');
        sdk.actions.ready();
        console.log('✅ Page ready signal sent');
      } catch (error) {
        console.warn('Could not signal ready:', error);
      }
    };
    
    signalReady();
  }, []);
  
  // Get user stats from subgraph
  const { data: userStats, loading: userStatsLoading } = useUserStats(web3State.address || undefined);
  const { data: currentChainStats, loading: chainStatsLoading } = useUserChainStats(
    web3State.chainId || null, 
    web3State.address || null
  );
  const { data: userRanking, loading: rankingLoading } = useUserRanking(web3State.address || null);

  // Get current chain info
  const currentChainInfo = useMemo(() => {
    if (!web3State.chainId) return null;
    return getChainConfig(web3State.chainId);
  }, [web3State.chainId]);

  const currentChainName = currentChainInfo?.chainName || 'Unknown Chain';

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-cyan-100 dark:from-black dark:via-gray-900 dark:to-cyan-800">
      <div className="pt-24 md:pt-32 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Farcaster User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg"
            >
              <div className="flex items-center gap-3 md:gap-4">
                {user.pfpUrl ? (
                  <img 
                    src={user.pfpUrl} 
                    alt={user.username || 'User'} 
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-cyan-500 flex items-center justify-center">
                    <FaUser className="text-white text-xl md:text-2xl" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || user.username || 'Farcaster User'}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                    @{user.username} • FID: {user.fid}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Connect Wallet Section */}
          {!web3State.isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 md:p-8 mb-4 md:mb-6 text-center"
            >
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-sm md:text-base text-white/80 mb-4 md:mb-6">
                Connect your wallet to start checking in on GannetX
              </p>
              <div className="flex justify-center">
                <ConnectWalletButton 
                  connectWallet={async () => {
                    await connectWallet();
                  }} 
                />
              </div>
            </motion.div>
          ) : (
            <>
              {/* Stats Section dengan data yang benar */}
              <div className="mb-4 md:mb-6">
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
              </div>

              {/* Check-in Grid - Hanya Mainnet */}
              <FixedMultiChainCheckinGrid
                isConnected={web3State.isConnected}
                currentChainId={web3State.chainId}
                address={web3State.address}
                signer={web3State.signer}
                provider={web3State.provider}
                onCheckinSuccess={(chainId, txHash) => {
                  console.log('Check-in success:', chainId, txHash);
                }}
                networkType="mainnet"  
                triggerAnimation={null}
                onAnimationComplete={() => {}}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarcasterMiniApp;
