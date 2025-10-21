// src/hooks/useFarcasterWallet.ts
import { useState, useEffect, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';
import type { WalletClient, PublicClient } from 'viem';

interface FarcasterWalletState {
  address: `0x${string}` | null;
  walletClient: WalletClient | null;
  publicClient: PublicClient | null;
  chainId: number | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useFarcasterWallet = () => {
  const [walletState, setWalletState] = useState<FarcasterWalletState>({
    address: null,
    walletClient: null,
    publicClient: null,
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
        const context = await sdk.context;
        console.log('Farcaster context:', context);
        setIsSDKLoaded(true);
      } catch (error) {
        console.error('Failed to load Farcaster SDK:', error);
        setIsSDKLoaded(false);
      }
    };

    load();
  }, []);

  // Auto-connect wallet
  useEffect(() => {
    const connectWallet = async () => {
      if (!isSDKLoaded) return;

      try {
        setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

        // Add Ethereum provider to window (Farcaster provides this)
        if (!window.ethereum) {
          sdk.actions.addFrame();
        }

        // Get wallet client using Farcaster's provider
        const provider = await sdk.wallet.ethProvider;
        
        if (!provider) {
          throw new Error('No Ethereum provider available');
        }

        // Request accounts
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        }) as `0x${string}`[];

        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const address = accounts[0];

        // Get chain ID
        const chainIdHex = await provider.request({
          method: 'eth_chainId',
        }) as string;
        const chainId = parseInt(chainIdHex, 16);

        // Create viem clients
        const walletClient = createWalletClient({
          account: address,
          transport: custom(provider),
        });

        const publicClient = createPublicClient({
          transport: http(),
          chain: mainnet,
        });

        setWalletState({
          address,
          walletClient,
          publicClient,
          chainId,
          isConnected: true,
          isLoading: false,
          error: null,
        });

        console.log('✅ Farcaster wallet connected:', address);
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

      const provider = await sdk.wallet.ethProvider;
      
      if (!provider) {
        throw new Error('No provider available');
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      }) as `0x${string}`[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const chainIdHex = await provider.request({
          method: 'eth_chainId',
        }) as string;
        const chainId = parseInt(chainIdHex, 16);

        const walletClient = createWalletClient({
          account: address,
          transport: custom(provider),
        });

        const publicClient = createPublicClient({
          transport: http(),
          chain: mainnet,
        });

        setWalletState({
          address,
          walletClient,
          publicClient,
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
      walletClient: null,
      publicClient: null,
      chainId: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      const provider = await sdk.wallet.ethProvider;
      
      if (!provider) {
        throw new Error('No provider available');
      }

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });

      setWalletState(prev => ({
        ...prev,
        chainId: targetChainId,
      }));
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error('Chain not added to wallet');
      }
      throw error;
    }
  }, []);

  return {
    ...walletState,
    connectWallet: connectManually,
    disconnectWallet,
    switchNetwork,
  };
};