// src/pages/_app.tsx
"use client"
import type { AppProps } from "next/app"
import Head from "next/head"
import Script from "next/script"
import "@/styles/globals.css"
import { ThirdwebProvider } from "thirdweb/react"
import { useRouter } from "next/router"
import { useRef, useCallback, useEffect, useState } from 'react'
import Footer from "@/components/Footer"
import WalletRequired from "@/components/WalletRequired"
import { useWalletState } from "@/hooks/useWalletState"
import Navbar from "@/components/Navbar"
import { getChainConfig } from "@/utils/constants" 
import { Toaster } from 'react-hot-toast'
import { SuccessAnimationProvider } from "@/components/SuccessAnimationContext"
import OnchainProviders from "@/components/providers/OnchainProviders"
import { FarcasterProvider } from '@/hooks/useFarcasterContext'
import AudioPlayer from "@/components/AudioPlayer"

const NO_LAYOUT_PATHS = ['/mint', '/farcaster'];

function GMApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { web3State, connectWallet, disconnectWallet, switchNetwork, isMiniApp } = useWalletState()
  const { address, isConnected, isLoading: isWalletConnecting, chainId } = web3State
  const leaderboardRef = useRef<HTMLDivElement>(null)
  
  const [mounted, setMounted] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (router.pathname === '/farcaster') {
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        console.log('🎯 Calling sdk.actions.ready()...');
        sdk.actions.ready().then(() => {
          console.log('✅ SDK ready!');
          setSdkReady(true);
        });
      }).catch(err => {
        console.error('❌ Failed to initialize SDK:', err);
        setSdkReady(true);
      });
    } else {
      setSdkReady(true);
    }
  }, [router.pathname])

  const scrollToLeaderboard = useCallback(() => {
    leaderboardRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }, [])
  
  const adaptedConnectWallet = useCallback(async (): Promise<void> => {
    await connectWallet()
  }, [connectWallet])

  const handleSwitchChain = useCallback(async (targetChainId: number): Promise<void> => {
    try {
      await switchNetwork(targetChainId);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }, [switchNetwork]);
  
  const showLayout = !NO_LAYOUT_PATHS.includes(router.pathname);
  const currentNetwork = chainId ? getChainConfig(chainId) : null
  const networkInfo = currentNetwork ? {
    name: currentNetwork.chainName,
    logoUrl: currentNetwork.logoUrl
  } : null
  
  const shouldRequireWallet = !router.pathname.includes("/auth") && 
                             !router.pathname.includes("/landing") && 
                             !router.pathname.includes("/mint") &&
                             !router.pathname.includes("/farcaster")

  if (!mounted || !sdkReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 via-white to-cyan-100 dark:from-black dark:via-gray-900 dark:to-cyan-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>GannetX: Your Multi-Chain GM Hub</title>
        <meta name="description" content="The ultimate multi-chain GM hub." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=G-LCY12CWTZ4`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LCY12CWTZ4');
          `,
        }}
      />

      <FarcasterProvider>
        <OnchainProviders>
          <ThirdwebProvider>
            <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                className: 'custom-toast',
                style: {
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#1f2937',
                  backdropFilter: 'blur(8px)',
                },
                duration: 5000,
              }}
            />
            
            {showLayout && !isMiniApp && (
              <Navbar 
                address={address}
                connectWallet={adaptedConnectWallet}
                disconnectWallet={disconnectWallet}
                isConnecting={isWalletConnecting}
                networkInfo={networkInfo}
                scrollToLeaderboard={scrollToLeaderboard}
                currentChainId={chainId}
                onSwitchChain={handleSwitchChain}
              />
            )}

            <AudioPlayer showOnFarcaster={true} />
            
            <main suppressHydrationWarning>
              {shouldRequireWallet && !isMiniApp ? (
                <WalletRequired
                  isConnected={isConnected}
                  connectWallet={adaptedConnectWallet}
                  isConnecting={isWalletConnecting}
                >
                  <SuccessAnimationProvider>
                    <Component {...pageProps} leaderboardRef={leaderboardRef} />
                  </SuccessAnimationProvider>
                </WalletRequired>  
              ) : (
                <SuccessAnimationProvider>
                  <Component {...pageProps} leaderboardRef={leaderboardRef} />
                </SuccessAnimationProvider>
              )}
              
              {showLayout && !isMiniApp && <Footer />}
            </main>
          </ThirdwebProvider>
        </OnchainProviders>
      </FarcasterProvider> 
    </>
  )
}

export default GMApp