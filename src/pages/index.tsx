import React, { useState, useEffect, useCallback } from 'react';
import { useWalletState } from '@/hooks/useWalletState';
import FixedMultiChainCheckinGrid from '@/components/MultiChainCheckinGrid';
import Notification from '@/components/Notification';
import HeroStatsSection from '@/components/HeroStatsSection';
import HeroSection from '@/components/HeroSection';
import ReferralModal from '@/components/ReferralModal';
import ReferralRegisterModal from '@/components/ReferralRegisterModal';
import {
  FaGlobe,
  FaFlask,
  FaLayerGroup,
  FaCopy,
} from 'react-icons/fa';
import { SUPPORTED_CHAINS, BASE_CHAIN_ID } from '@/utils/constants';
import { motion } from 'framer-motion';
import AudioPlayer from '@/components/AudioPlayer';
import { useUserStats, useUserCheckins } from '@/hooks/useSubgraph';
import { useUserChainStats } from '@/hooks/useUserChainStats';
import { useUserRanking } from '@/hooks/useUserRangking';
import { useReferrerInfo, useUserReferrer } from '@/hooks/useReferral';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import {
  isOnReferralChain,
  generateReferralLink,
  extractReferralCode,
  validateReferralCode,
  formatAddress
} from '@/utils/web3';
import toast from 'react-hot-toast';
import { SidebarReferralCard } from '@/components/SidebarReferralCard';
import LeaderboardModal from '@/components/LeaderboardModal';
import GannetXChatSidebar from '@/components/GannetXChatSidebar';

const CheckinPageIntegration: React.FC = () => {
  const {
    web3State,
    connectWallet: rawConnectWallet,
    refreshReferralStatus,
  } = useWalletState();

  const connectWallet = useCallback(async (): Promise<void> => {
    await rawConnectWallet();
  }, [rawConnectWallet]);

  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [lastCheckinChainId, setLastCheckinChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(false);
  const [pendingAnimation, setPendingAnimation] = useState<{
    chainId: number;
    chainName: string;
  } | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState<{
    chainId: number;
    chainName: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null);
  const [canUseReferral, setCanUseReferral] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);

  // Subgraph integration
  const { data: userCheckins } = useUserCheckins(web3State.address || undefined, 365);
  const { data: userStats, loading: userStatsLoading } = useUserStats(web3State.address || undefined);
  const { data: currentChainStats, loading: chainStatsLoading } = useUserChainStats(
    web3State.chainId || null,
    web3State.address || null
  );
  const { data: userRanking, loading: rankingLoading } = useUserRanking(web3State.address || null);
  const { data: myReferrals } = useReferrerInfo(web3State.address || undefined);
  const { data: userReferrerData } = useUserReferrer(web3State.address || undefined);

  const currentChainName = web3State.chainId
    ? (SUPPORTED_CHAINS[web3State.chainId]?.chainName || 'Unknown')
    : 'No Chain';

  useEffect(() => {
    const checkReferralChain = async () => {
      try {
        const onReferralChain = await isOnReferralChain();
        setCanUseReferral(onReferralChain);
      } catch (error) {
        console.error('Error checking referral chain:', error);
        setCanUseReferral(false);
      }
    };

    if (web3State.isConnected) {
      checkReferralChain();
    }
  }, [web3State.isConnected, web3State.chainId]);

  useEffect(() => {
    try {
      const refCode = extractReferralCode();

      if (refCode) {
        const validation = validateReferralCode(refCode);

        if (validation.valid && validation.address) {
          setReferralCodeFromUrl(validation.address);
        } else {
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, document.title, url.pathname + url.search);
        }
      }
    } catch (error) {
      console.error('Error extracting referral code:', error);
    }
  }, []);

  useEffect(() => {
    const checkAndShowRegisterModal = async () => {
      if (!web3State.isConnected || !web3State.address || !referralCodeFromUrl) {
        return;
      }

      try {
        if (referralCodeFromUrl.toLowerCase() === web3State.address.toLowerCase()) {
          toast.error('You cannot refer yourself!');
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, document.title, url.pathname + url.search);
          setReferralCodeFromUrl(null);
          return;
        }

        if (web3State.hasReferrer) {
          toast('You already have a referrer!');
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          window.history.replaceState({}, document.title, url.pathname + url.search);
          setReferralCodeFromUrl(null);
          return;
        }

        setIsRegisterModalOpen(true);
      } catch (error) {
        console.error('Error checking referral conditions:', error);
      }
    };

    checkAndShowRegisterModal();
  }, [web3State.isConnected, web3State.address, web3State.hasReferrer, referralCodeFromUrl]);

  const handleReferralSuccess = async () => {
    toast.success('Referral registered successfully!');
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, document.title, url.pathname + url.search);
    setReferralCodeFromUrl(null);

    if (refreshReferralStatus) {
      await refreshReferralStatus();
    }

    setTimeout(() => window.location.reload(), 2000);
  };

  const handleCheckinSuccess = useCallback((chainId: number, txHash: string): void => {
    setLastTxHash(txHash);
    setLastCheckinChainId(chainId);
    setShowSuccessNotification(true);
    const chainConfig = SUPPORTED_CHAINS[chainId];
    setPendingAnimation({
      chainId: chainId,
      chainName: chainConfig?.chainName || 'Unknown Chain',
    });
  }, []);

  const getAvatarUrl = (address: string): string =>
    `https://api.dicebear.com/6.x/identicon/svg?seed=${address}`;

  const handleCopyAddress = useCallback(() => {
    if (web3State.address) {
      navigator.clipboard.writeText(web3State.address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [web3State.address]);

  const handleCopyReferralLink = useCallback(() => {
    if (web3State.address) {
      const link = generateReferralLink(web3State.address);
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied!');
    }
  }, [web3State.address]);

  const handleSwitchToBase = async () => {
    if (web3State.provider) {
      try {
        await web3State.provider.send('wallet_switchEthereumChain', [
          { chainId: `0x${BASE_CHAIN_ID.toString(16)}` }
        ]);
        toast.success('Switched to Base network!');
      } catch (error: any) {
        if (error.code === 4902) {
          toast.error('Base network not found in wallet.');
        } else {
          toast.error('Failed to switch network');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-x-hidden text-white">
      <AudioPlayer />

      <Notification
        isOpen={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        onAwesomeClick={() => {
          setShowSuccessNotification(false);
          if (pendingAnimation) {
            setAnimationTrigger(pendingAnimation);
            setPendingAnimation(null);
          }
        }}
        type="success"
        title="GM Sent Successfully!"
        message="Your daily GM has been recorded on the blockchain."
        txHash={lastTxHash}
        chainId={lastCheckinChainId}
      />

      <Notification
        isOpen={showErrorNotification}
        onClose={() => setShowErrorNotification(false)}
        type="error"
        title="Operation Failed"
        message={error || "An unknown error occurred. Please try again."}
      />

      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        address={web3State.address}
        provider={web3State.provider}
        signer={web3State.signer}
      />

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        onClose={() => setIsLeaderboardModalOpen(false)}
        address={web3State.address}
      />

      {referralCodeFromUrl && (
        <ReferralRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => {
            setIsRegisterModalOpen(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('ref');
            window.history.replaceState({}, document.title, url.pathname + url.search);
            setReferralCodeFromUrl(null);
          }}
          referrerAddress={referralCodeFromUrl}
          userAddress={web3State.address}
          signer={web3State.signer}
          provider={web3State.provider}
          onSuccess={handleReferralSuccess}
        />
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="pt-40 pb-20 relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          <div className="flex flex-col xl:flex-row gap-8">

            {/* LEFT CONTENT - MAIN AREA */}
            <div className="flex-1 min-w-0">
              {/* HERO SECTION */}
              <HeroSection address={web3State.address} />

              {/* CHECKIN GRID */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <FixedMultiChainCheckinGrid
                  isConnected={web3State.isConnected}
                  currentChainId={web3State.chainId}
                  address={web3State.address}
                  signer={web3State.signer}
                  provider={web3State.provider}
                  onCheckinSuccess={handleCheckinSuccess}
                  triggerAnimation={animationTrigger}
                  onAnimationComplete={() => setAnimationTrigger(null)}
                />
              </motion.div>
            </div>

            {/* RIGHT SIDEBAR */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full xl:w-80 flex-shrink-0 space-y-6"
            >
              {web3State.isConnected && web3State.address ? (
                <>
                  {/* USER INFO CARD */}
                  <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                        <img src={getAvatarUrl(web3State.address)} alt="Avatar" className="w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-medium">Connected As</p>
                        <div onClick={handleCopyAddress} className="group flex items-center gap-2 cursor-pointer">
                          <span className="font-mono text-sm text-white truncate">{web3State.address.substring(0, 6)}...{web3State.address.substring(38)}</span>
                          <FaCopy className={`text-xs flex-shrink-0 transition-colors ${copySuccess ? 'text-green-500' : 'text-gray-500 group-hover:text-cyan-400'}`} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STATS SECTION */}
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
                    onRankClick={() => setIsLeaderboardModalOpen(true)}
                  />

                  {/* ACTIVITY HEATMAP */}
                  {userStats && (
                    <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-4 overflow-hidden">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Activity</h3>
                      <ActivityHeatmap checkins={userCheckins || []} currentStreak={userStats.currentStreak} maxStreak={userStats.maxStreak} />
                    </div>
                  )}

                  {/* REFERRAL CARD */}
                  <SidebarReferralCard
                    canUseReferral={canUseReferral}
                    myReferralsCount={myReferrals?.totalReferrals || 0}
                    userReferredBy={userReferrerData?.referredBy?.id || null}
                    onCopyLink={handleCopyReferralLink}
                    onCardClick={() => setIsReferralModalOpen(true)}
                    onSwitchToBase={handleSwitchToBase}
                    formatAddress={formatAddress}
                  />
                </>
              ) : (
                <div className="bg-[#0B0E14]/60 backdrop-blur-xl rounded-2xl border border-white/5 p-6 text-center">
                  <p className="text-gray-400 mb-4">Connect your wallet to view your stats and activity.</p>
                  <button
                    onClick={connectWallet}
                    className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      </div>

      {/* LEFT SIDEBAR - Chat Toggle */}
      <GannetXChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
};

export default CheckinPageIntegration;