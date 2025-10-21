// src/hooks/useFarcasterWallet.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useFarcasterUser } from './useFarcasterContext';

interface FarcasterWalletState {
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
}

export const useFarcasterWallet = () => {
  const { user, isReady } = useFarcasterUser();
  const [walletState, setWalletState] = useState<FarcasterWalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
    isLoading: true,
  });

  // Auto-connect using Farcaster's embedded wallet
  useEffect(() => {
    const connectFarcasterWallet = async () => {
      if (!isReady) return;

      try {
        setWalletState(prev => ({ ...prev, isLoading: true }));

        // Check if we're in Farcaster context
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          
          // Request accounts (Farcaster will auto-approve)
          const accounts = await provider.send('eth_requestAccounts', []);
          
          if (accounts && accounts.length > 0) {
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setWalletState({
              address,
              provider,
              signer,
              chainId: network.chainId,
              isConnected: true,
              isLoading: false,
            });

            console.log('Farcaster wallet connected:', address);
          }
        } else {
          // Fallback: No ethereum provider
          setWalletState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error connecting Farcaster wallet:', error);
        setWalletState(prev => ({ ...prev, isLoading: false }));
      }
    };

    connectFarcasterWallet();
  }, [isReady]);

  const connectWallet = useCallback(async () => {
    if (walletState.isConnected) return;

    try {
      setWalletState(prev => ({ ...prev, isLoading: true }));

      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        
        if (accounts && accounts.length > 0) {
          const signer = provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();

          setWalletState({
            address,
            provider,
            signer,
            chainId: network.chainId,
            isConnected: true,
            isLoading: false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletState.isConnected]);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // Update state after switch
      if (walletState.provider) {
        const network = await walletState.provider.getNetwork();
        setWalletState(prev => ({
          ...prev,
          chainId: network.chainId,
        }));
      }
    } catch (error: any) {
      // If chain not added, try to add it
      if (error.code === 4902) {
        console.log('Chain not added, should add it');
        // Add chain addition logic here if needed
      }
      throw error;
    }
  }, [walletState.provider]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};