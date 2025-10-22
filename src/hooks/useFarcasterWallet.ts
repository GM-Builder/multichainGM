// src/hooks/useFarcasterWallet.ts
import { useState, useEffect, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { ethers } from 'ethers';

interface FarcasterWalletState {
  address: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useFarcasterWallet = () => {
  const [walletState, setWalletState] = useState<FarcasterWalletState>({
    address: null,
    provider: null,
    signer: null,
    chainId: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Initialize Farcaster SDK
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        setIsSDKLoaded(true);
      } catch (error) {
        console.error('Failed to load Farcaster SDK:', error);
        setIsSDKLoaded(true); // Continue anyway
      }
    };

    load();
  }, []);

  // Auto-connect wallet using ethers
  useEffect(() => {
    const connectWallet = async () => {
      if (!isSDKLoaded) return;

      try {
        setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

        // Get Farcaster ethereum provider
        const ethProvider = await sdk.wallet.ethProvider;
        
        if (!ethProvider) {
          throw new Error('No Ethereum provider available');
        }

        // ✅ Create ethers Web3Provider from Farcaster provider
        const provider = new ethers.providers.Web3Provider(ethProvider as any, 'any');
        
        // Request accounts
        const accounts = await provider.send('eth_requestAccounts', []);

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const address = accounts[0];
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        setWalletState({
          address,
          provider,
          signer,
          chainId,
          isConnected: true,
          isLoading: false,
          error: null,
        });

        console.log('✅ Farcaster wallet connected:', address, 'Chain:', chainId);
      } catch (error: any) {
        console.error('Failed to connect Farcaster wallet:', error);
        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to connect wallet',
        }));
      }
    };

    connectWallet();
  }, [isSDKLoaded]);

  const connectManually = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      const ethProvider = await sdk.wallet.ethProvider;
      
      if (!ethProvider) {
        throw new Error('No provider available');
      }

      const provider = new ethers.providers.Web3Provider(ethProvider as any, 'any');
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        const chainId = network.chainId;

        setWalletState({
          address,
          provider,
          signer,
          chainId,
          isConnected: true,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('Manual connect failed:', error);
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect',
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      provider: null,
      signer: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      const ethProvider = await sdk.wallet.ethProvider;
      
      if (!ethProvider) {
        throw new Error('No provider available');
      }

      await ethProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      // Update chain ID
      if (walletState.provider) {
        const network = await walletState.provider.getNetwork();
        setWalletState(prev => ({
          ...prev,
          chainId: network.chainId,
        }));
      }
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error('Chain not added to wallet');
      }
      throw error;
    }
  }, [walletState.provider]);

  return {
    ...walletState,
    connectWallet: connectManually,
    disconnectWallet,
    switchNetwork,
  };
};