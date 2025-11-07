import React, { useState, useEffect, useCallback } from 'react';
import { useWalletState } from '@/hooks/useWalletState';
import FixedMultiChainCheckinGrid from '@/components/MultiChainCheckinGrid';
import Notification from '@/components/Notification';
import HeroStatsSection from '@/components/HeroStatsSection';
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
import QuestDashboard from '@/components/QuestDashboard';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { 
  isOnReferralChain, 
  generateReferralLink, 
  extractReferralCode, 
  validateReferralCode,
  formatAddress
} from '@/utils/web3';
import toast from 'react-hot-toast';
import { SidebarReferralCard} from '@/components/SidebarReferralCard';
import LeaderboardModal from '@/components/LeaderboardModal';
import GannetXChatSidebar from '@/components/GannetXChatSidebar';

type NetworkTabType = 'all' | 'mainnet' | 'testnet';

const BlobPatternBottomLeft: React.FC = () => (
  <div className="fixed bottom-0 left-0 w-64 h-64 -mb-32 -ml-32 opacity-10 dark:opacity-5 pointer-events-none z-0">
    <motion.svg 
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, rotate: 0 }}
      animate={{ 
        scale: [0.8, 1.1, 0.8], 
        rotate: [0, 10, 0] 
      }}
      transition={{ 
        duration: 20, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <path fill="#00E5FF" d="M44.5,-76.3C56.9,-69.1,65.8,-55.3,71.3,-41.1C76.8,-26.9,78.9,-12.1,76.5,1.4C74.1,14.9,67.1,27.2,58.1,37.8C49.1,48.4,38.2,57.2,25.8,63.5C13.5,69.8,-0.3,73.5,-14.2,71.5C-28.1,69.5,-42.1,61.8,-52.9,50.8C-63.8,39.9,-71.4,25.7,-75.6,9.7C-79.8,-6.3,-80.5,-24.1,-73.6,-38.4C-66.6,-52.6,-52,-63.4,-37.2,-69.7C-22.4,-76,-11.2,-78,2.9,-82.6C17,-87.2,32.1,-83.5,44.5,-76.3Z" transform="translate(100 100)" />
    </motion.svg>
  </div>
);

const SquigglyPatternTopRight: React.FC = () => (
  <div className="fixed top-0 right-0 w-96 h-96 -mt-16 -mr-16 opacity-10 dark:opacity-5 pointer-events-none z-0 overflow-hidden">
    <motion.svg 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.9, rotate: -10, y: -20 }}
      animate={{ 
        scale: [0.9, 1.2, 0.9], 
        rotate: [-10, 5, -10],
        y: [-20, 10, -20] 
      }}
      transition={{ 
        duration: 25, 
        repeat: Infinity, 
        ease: "easeInOut",
        times: [0, 0.5, 1]
      }}
    >
      <path fill="#06b6d4" d="M31.9,-52.2C45.3,-45.7,62.3,-43.2,70.8,-33.5C79.2,-23.8,79.1,-6.9,75.3,8.5C71.5,23.9,64.1,37.9,53.3,47.8C42.4,57.8,28.2,63.7,13.2,68.3C-1.7,72.9,-17.4,76.1,-28.9,70.8C-40.4,65.6,-47.7,51.9,-54,38.6C-60.4,25.3,-65.8,12.7,-67.6,-1.1C-69.5,-14.8,-67.7,-29.7,-59.7,-40C-51.7,-50.2,-37.4,-56,-24.9,-62.2C-12.5,-68.4,-1.2,-75.1,7.4,-72.3C16,-69.5,18.6,-58.8,31.9,-52.2Z" transform="translate(100 100)" />
    </motion.svg>
  </div>
);

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
  const [networkTab, setNetworkTab] = useState<NetworkTabType>('all');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-cyan-100 dark:from-black dark:via-gray-900 dark:to-cyan-800 relative overflow-hidden">
      <BlobPatternBottomLeft />
      <SquigglyPatternTopRight />
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
      
      {/* LAYOUT WRAPPER - Calculated center with sidebar */}
      <div className="relative">
        
        {/* MAIN CONTENT - PERFECTLY CENTERED */}
        <div className={`pt-24 pb-20 relative z-10 transition-all duration-300 ${
          web3State.isConnected ? 'lg:mr-[40px] xl:mr-[4px]' : ''
        }`}>
          
          <div className="max-w-7xl mx-auto px-4 mb-6">
            <QuestDashboard address={web3State.address} />
          </div>

          <div className="max-w-7xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-6">
              <div className="flex bg-white dark:bg-gray-800/80 px-2 py-1 rounded-full backdrop-blur-sm shadow-md">
                <button onClick={() => setNetworkTab('all')} className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${networkTab === 'all' ? 'bg-cyan-100/70 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm transform scale-105' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                  <div className="flex items-center"><FaLayerGroup className="mr-2 h-4 w-4" />All</div>
                </button>
                <button onClick={() => setNetworkTab('mainnet')} className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${networkTab === 'mainnet' ? 'bg-cyan-100/70 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm transform scale-105' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                  <div className="flex items-center"><FaGlobe className="mr-2 h-4 w-4" />Mainnet</div>
                </button>
                <button onClick={() => setNetworkTab('testnet')} className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${networkTab === 'testnet' ? 'bg-cyan-100/70 dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm transform scale-105' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                  <div className="flex items-center"><FaFlask className="mr-2 h-4 w-4" />Testnet</div>
                </button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <FixedMultiChainCheckinGrid
                isConnected={web3State.isConnected}
                currentChainId={web3State.chainId}
                address={web3State.address}
                signer={web3State.signer}
                provider={web3State.provider}
                onCheckinSuccess={handleCheckinSuccess}
                networkType={networkTab}
                triggerAnimation={animationTrigger}
                onAnimationComplete={() => setAnimationTrigger(null)}
              />
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - FIXED */}
        {web3State.isConnected && web3State.address && (
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block fixed right-0 top-20 bottom-0 w-80 xl:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl border-l border-gray-200 dark:border-gray-800 overflow-y-auto z-20 rounded-l-lg">
            <div className="p-4 xl:p-6 space-y-4 xl:space-y-6">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-cyan-400/30 flex-shrink-0">
                    <img src={getAvatarUrl(web3State.address)} alt="Avatar" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">Your Address</p>
                    <div onClick={handleCopyAddress} className="group flex items-center gap-1.5 cursor-pointer">
                      <span className="font-mono text-xs text-gray-800 dark:text-gray-200 truncate">{web3State.address.substring(0, 6)}...{web3State.address.substring(38)}</span>
                      <FaCopy className={`text-xs flex-shrink-0 transition-colors ${copySuccess ? 'text-green-500' : 'text-gray-400 group-hover:text-cyan-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

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

              {userStats && <ActivityHeatmap checkins={userCheckins || []} currentStreak={userStats.currentStreak} maxStreak={userStats.maxStreak} />}

              <SidebarReferralCard canUseReferral={canUseReferral} myReferralsCount={myReferrals?.totalReferrals || 0} userReferredBy={userReferrerData?.referredBy?.id || null} onCopyLink={handleCopyReferralLink} onCardClick={() => setIsReferralModalOpen(true)} onSwitchToBase={handleSwitchToBase} formatAddress={formatAddress} /> 
            </div>
          </motion.aside>
        )}
      </div>

      {/* LEFT SIDEBAR - Chat Toggle (OVERLAY) */}
      <GannetXChatSidebar
        isOpen={isChatOpen}
        toggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
};

export default CheckinPageIntegration;