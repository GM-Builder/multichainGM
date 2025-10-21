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
  error: string | null;
}

// ✅ Extend Window type
declare global {
  interface Window {
    ethereum?: ethers.providers.ExternalProvider & {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      request?: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
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
    error: null,
  });

  // ✅ Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (!isReady) return;

      try {
        setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

        // Check if ethereum provider exists
        if (typeof window !== 'undefined' && window.ethereum) {
          // ✅ Cast to proper type
          const provider = new ethers.providers.Web3Provider(
            window.ethereum as ethers.providers.ExternalProvider
          );
          
          // Try to get existing accounts first
          const accounts = await provider.listAccounts();
          
          let address: string | null = null;
          
          if (accounts && accounts.length > 0) {
            address = accounts[0];
          } else {
            // Try to request accounts (Farcaster auto-approves)
            try {
              const requestedAccounts = await provider.send('eth_requestAccounts', []);
              if (requestedAccounts && requestedAccounts.length > 0) {
                address = requestedAccounts[0];
              }
            } catch (err) {
              console.log('User not connected to Farcaster wallet');
            }
          }

          if (address) {
            const signer = provider.getSigner();
            const network = await provider.getNetwork();

            setWalletState({
              address,
              provider,
              signer,
              chainId: network.chainId,
              isConnected: true,
              isLoading: false,
              error: null,
            });

            console.log('✅ Farcaster wallet auto-connected:', address);
          } else {
            setWalletState(prev => ({ 
              ...prev, 
              isLoading: false,
              error: 'No wallet connected',
            }));
          }
        } else {
          setWalletState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: 'Ethereum provider not found',
          }));
        }
      } catch (error: any) {
        console.error('Error auto-connecting wallet:', error);
        setWalletState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: error.message || 'Failed to connect',
        }));
      }
    };

    autoConnect();
  }, [isReady]);

  // Manual connect
  const connectWallet = useCallback(async () => {
    if (walletState.isConnected) return;

    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

      if (typeof window !== 'undefined' && window.ethereum) {
        const provider = new ethers.providers.Web3Provider(
          window.ethereum as ethers.providers.ExternalProvider
        );
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
            error: null,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Failed to connect',
      }));
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
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (!window.ethereum || !window.ethereum.request) {
      throw new Error('No ethereum provider');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

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
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
};