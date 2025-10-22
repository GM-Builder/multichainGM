// src/hooks/useFarcasterContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import sdk from '@farcaster/frame-sdk';

interface FarcasterUser {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  ethProvider: any | null; // ✅ Expose eth provider
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoading: true,
  isReady: false,
  error: null,
  ethProvider: null,
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
  const [ethProvider, setEthProvider] = useState<any | null>(null);

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        console.log('🎯 Initializing Farcaster SDK...');
        
        // ✅ Step 1: Initialize SDK
        await sdk.actions.ready();
        console.log('✅ Farcaster SDK ready');
        
        // ✅ Step 2: Get context
        const context = await sdk.context;
        console.log('📱 Farcaster context:', context);
        
        if (context?.user) {
          setUser({
            fid: context.user.fid,
            username: context.user.username || null,
            displayName: context.user.displayName || null,
            pfpUrl: context.user.pfpUrl || null,
          });
        }

        // ✅ Step 3: Get Ethereum Provider (works on both mobile & desktop)
        try {
          const provider = await sdk.wallet.ethProvider;
          console.log('💼 Farcaster eth provider:', provider);
          
          if (provider) {
            setEthProvider(provider);
            
            // ✅ Inject to window.ethereum ONLY if on /farcaster page
            if (typeof window !== 'undefined' && window.location.pathname === '/farcaster') {
              if (!window.ethereum) {
                (window as any).ethereum = provider;
                console.log('✅ Injected Farcaster provider to window.ethereum');
              } else {
                console.log('⚠️ window.ethereum already exists');
              }
            }
          } else {
            console.warn('⚠️ No eth provider from Farcaster SDK');
          }
        } catch (providerError) {
          console.error('❌ Failed to get eth provider:', providerError);
        }

        setIsReady(true);
      } catch (err) {
        console.error('❌ Failed to initialize Farcaster:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsReady(true); // Still set ready to allow fallback
      } finally {
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isLoading, isReady, error, ethProvider }}>
      {children}
    </FarcasterContext.Provider>
  );
};