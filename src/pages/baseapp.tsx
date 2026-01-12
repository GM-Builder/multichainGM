import React, { useState } from 'react';
import Head from 'next/head';
import { BaseAppLayout } from '@/components/BaseApp/BaseAppLayout';
import { OnchainKitProviderWrapper } from '@/components/BaseApp/OnchainKitProviderWrapper';

// Views
import FixedMultiChainCheckinGrid from '@/components/MultiChainCheckinGrid';
import HeroStatsSection from '@/components/HeroStatsSection';
import GannetXChatSidebar from '@/components/GannetXChatSidebar';
import TokenFactory from '@/components/TokenFactory';
import ManagementDashboard from '@/components/ManagementDashboard';
import { ProfileView } from '@/components/BaseApp/ProfileView';
import { RestrictedAccess } from '@/components/BaseApp/RestrictedAccess';

// Hooks & Utils
import { useWalletState } from '@/hooks/useWalletState';
import { useUserStats, useUserCheckins } from '@/hooks/useSubgraph';
import { useUserChainStats } from '@/hooks/useUserChainStats';
import { useUserRanking } from '@/hooks/useUserRangking';
import { SUPPORTED_CHAINS } from '@/utils/constants';

// Placeholder ProfileView until implemented
// import { ProfileView } from '@/components/BaseApp/ProfileView'; 
// Temporarily mock ProfileView to allow compilation if not yet created. 
// Ideally I should create ProfileView right away. 
// I will create ProfileView in the next step, but need to import it here.
// I will comment out the import if it fails, but better to create it next.

export default function BaseAppPage() {
    const [activeTab, setActiveTab] = useState('home');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { web3State } = useWalletState();

    // Guard Check
    React.useEffect(() => {
        const checkEnvironment = async () => {
            // @ts-ignore
            const isCoinbaseWallet = window.ethereum?.isCoinbaseWallet;
            // Strict check: Only Coinbase Wallet (Base App)
            if (isCoinbaseWallet) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }

            // DEV BYPASS: Uncomment to test locally
            // DEV BYPASS: Uncomment to test locally
            if (window.location.hostname === 'localhost') {
                setIsAuthorized(true);
            }

            setCheckingAuth(false);
        };

        checkEnvironment();
    }, []);

    // Data Hooks (reused from index.tsx)
    const { data: userStats, loading: userStatsLoading } = useUserStats(web3State.address || undefined);
    const { data: currentChainStats, loading: chainStatsLoading } = useUserChainStats(
        web3State.chainId || null,
        web3State.address || null
    );
    const { data: userRanking, loading: rankingLoading } = useUserRanking(web3State.address || null);

    const currentChainName = web3State.chainId
        ? (SUPPORTED_CHAINS[web3State.chainId]?.chainName || 'Unknown')
        : 'No Chain';

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return (
                    <div className="px-4">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                Daily Check-in
                            </h1>
                            <p className="text-sm text-gray-400">Streak: {userStats?.currentStreak || 0} Days</p>
                        </div>
                        <FixedMultiChainCheckinGrid
                            isConnected={web3State.isConnected}
                            currentChainId={web3State.chainId}
                            address={web3State.address}
                            signer={web3State.signer}
                            provider={web3State.provider}
                            onCheckinSuccess={() => { }} // Handle success
                            triggerAnimation={null}
                            onAnimationComplete={() => { }}
                        />
                    </div>
                );
                );
            // case 'stats': -> Moved to Profile
            case 'deploy':
    return (
        <div className="px-2">
            {/* Switch between Factory and Dashboard */}
            <div className="mb-8">
                <TokenFactory />
            </div>
            <div className="pb-8">
                <ManagementDashboard />
            </div>
        </div>
    );
            case 'chat':
                // Chat component usually has its own layout/modal. 
                // For mini-app, we might want to render it inline.
                // GannetXChatSidebar is a modal/sidebar. We might need to render a different version
                // or just the inner chat content. For now, let's use a "Open Chat" button or refactor.
                // Actually, let's render a simple "Chat Room" view.
                // Ideally I should refactor GannetXChatSidebar to be embeddable.
                    </div >
                );
            case 'profile':
    return (
        <ProfileView
            userStats={userStats}
            currentChainStats={currentChainStats}
            userRanking={userRanking}
            currentChainId={web3State.chainId || null}
            currentChainName={currentChainName}
            loading={chainStatsLoading || userStatsLoading || rankingLoading}
        />
    );
            default:
    return null;
}
    };

if (checkingAuth) return <div className="min-h-screen bg-[#050608]" />; // Loading state
if (!isAuthorized) return <RestrictedAccess />;

return (
    <OnchainKitProviderWrapper>
        <Head>
            <title>GannetX Mini-App</title>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        </Head>
        <BaseAppLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {renderContent()}
        </BaseAppLayout>
    </OnchainKitProviderWrapper>
);
}
