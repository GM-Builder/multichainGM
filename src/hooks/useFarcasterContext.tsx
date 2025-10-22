// src/hooks/useFarcasterContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import sdk from '@farcaster/frame-sdk';

interface FarcasterUser {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  custody?: string;
  verifications?: string[];
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoading: true,
  isReady: false,
  error: null,
});

export const useFarcasterUser = () => useContext(FarcasterContext);

interface FarcasterProviderProps {
  children: ReactNode;
}

export const FarcasterProvider: React.FC<FarcasterProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // ✅ Initialize Farcaster SDK
        await sdk.actions.ready();
        
        // ✅ Get Farcaster context
        const context = await sdk.context;
        
        if (context?.user) {
          setUser({
            fid: context.user.fid,
            username: context.user.username || null,
            displayName: context.user.displayName || null,
            pfpUrl: context.user.pfpUrl || null,
          });
        }

        // ✅ CRITICAL: Inject Farcaster wallet provider into window.ethereum
        // This makes useWalletState work without any changes!
        if (typeof window !== 'undefined' && window.location.pathname === '/farcaster') {
          try {
            const ethProvider = await sdk.wallet.ethProvider;
            
            if (ethProvider && !window.ethereum) {
              console.log('🎯 Injecting Farcaster wallet provider...');
              (window as any).ethereum = ethProvider;
              console.log('✅ Farcaster provider injected successfully!');
            } else if (ethProvider && window.ethereum) {
              console.log('⚠️ window.ethereum already exists, not overriding');
            }
          } catch (providerError) {
            console.error('Failed to inject Farcaster provider:', providerError);
          }
        }

        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize Farcaster:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsReady(true); // Still set ready to allow app to continue
      } finally {
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isLoading, isReady, error }}>
      {children}
    </FarcasterContext.Provider>
  );
};