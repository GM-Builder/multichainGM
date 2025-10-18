"use client"
import type { AppProps } from "next/app"
import Head from "next/head"
import Script from "next/script"
import "@/styles/globals.css"
import { ThirdwebProvider } from "thirdweb/react"
import { useRouter } from "next/router"
import { useRef, useCallback } from 'react'
import Footer from "@/components/Footer"
import WalletRequired from "@/components/WalletRequired"
import { useWalletState } from "@/hooks/useWalletState"
import Navbar from "@/components/Navbar"
import { getChainConfig } from "@/utils/constants" 
import { Toaster } from 'react-hot-toast';
import { SuccessAnimationProvider } from "@/components/SuccessAnimationContext"

const NO_LAYOUT_PATHS = [
  '/mint'

];

function GMApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { web3State, connectWallet, disconnectWallet, switchNetwork } = useWalletState()
  const { address, isConnected, isLoading: isWalletConnecting, chainId } = web3State
  const showLayout = !NO_LAYOUT_PATHS.includes(router.pathname);
  const leaderboardRef = useRef<HTMLDivElement>(null)
  
  const scrollToLeaderboard = useCallback(() => {
    leaderboardRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }, [])
  
  const adaptedConnectWallet = async (): Promise<void> => {
    await connectWallet()
  }
  
  const currentNetwork = chainId ? getChainConfig(chainId) : null
  const networkInfo = currentNetwork ? {
    name: currentNetwork.chainName,
    logoUrl: currentNetwork.logoUrl
  } : null
  
  const shouldRequireWallet = !router.pathname.includes("/auth") && !router.pathname.includes("/landing")
  
  return (
    <>
      <Head>
        <title>GannetX: Your Multi-Chain GM Hub</title>
        <meta name="description" content="The ultimate multi-chain GM hub. Track your daily Web3 check-ins, build streaks, visualize on personalized heatmaps, and climb the leaderboard. Qualify for exclusive Early Adopter NFTs & future rewards. Secure your spot now!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
        {showLayout && <Navbar 
          address={address}
          connectWallet={adaptedConnectWallet}
          disconnectWallet={disconnectWallet}
          isConnecting={isWalletConnecting}
          networkInfo={networkInfo}
          scrollToLeaderboard={scrollToLeaderboard}
        /> }
        
        <main>

         {showLayout && <WalletRequired
            isConnected={isConnected}
            connectWallet={adaptedConnectWallet}
            isConnecting={isWalletConnecting}
          >
            <SuccessAnimationProvider>
            {shouldRequireWallet ? (
              <Component {...pageProps} leaderboardRef={leaderboardRef} />
            ) : (
              <Component {...pageProps} leaderboardRef={leaderboardRef} />
            )}
            </SuccessAnimationProvider>
            {showLayout && <Footer /> }
          </WalletRequired> }
        </main>
      </ThirdwebProvider>
      
    </>
  )
}

export default GMApp