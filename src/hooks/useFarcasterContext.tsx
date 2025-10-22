// src/hooks/useFarcasterContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  ethProvider: any | null;
  sdkContext: any | null;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isLoading: true,
  isReady: false,
  error: null,
  ethProvider: null,
  sdkContext: null,
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
  const [sdkContext, setSdkContext] = useState<any | null>(null);

  useEffect(() => {
    const initializeFarcaster = async () => {
      if (typeof window === 'undefined' || window.location.pathname !== '/farcaster') {
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      try {
        console.log('🎯 [1/4] Initializing Farcaster SDK...');
        
        const { default: sdk } = await import('@farcaster/frame-sdk');
        
        console.log('🎯 [2/4] Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        console.log('✅ SDK ready() completed');
        
        console.log('🎯 [3/4] Getting SDK context...');
        let context: any = null;
        let retries = 3;
        
        while (retries > 0 && !context) {
          try {
            context = await Promise.race([
              sdk.context,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Context timeout')), 5000)
              )
            ]);
            
            if (context) break;
          } catch (err) {
            console.warn(`Context attempt failed, ${retries} retries left`, err);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (context) {
          console.log('✅ SDK context:', context);
          setSdkContext(context);
          
          if (context.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username || null,
              displayName: context.user.displayName || null,
              pfpUrl: context.user.pfpUrl || null,
            });
          }
        } else {
          console.warn('⚠️ Failed to get SDK context after retries');
        }

        console.log('🎯 [4/4] Getting eth provider...');
        let provider: any = null;
        retries = 3;
        
        while (retries > 0 && !provider) {
          try {
            provider = await Promise.race([
              sdk.wallet.ethProvider,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Provider timeout')), 5000)
              )
            ]);
            
            if (provider) break;
          } catch (err) {
            console.warn(`Provider attempt failed, ${retries} retries left`, err);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (provider) {
          console.log('✅ Got eth provider:', provider);
          setEthProvider(provider);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (!window.ethereum) {
            (window as any).ethereum = provider;
            console.log('✅ Injected Farcaster provider to window.ethereum');
            window.dispatchEvent(new Event('ethereum#initialized'));
          } else {
            console.log('⚠️ window.ethereum already exists');
          }
        } else {
          console.error('❌ Failed to get eth provider after retries');
          setError('Wallet provider not available');
        }

        setIsReady(true);
        console.log('✅ Farcaster initialization complete');
        
      } catch (err) {
        console.error('❌ Farcaster initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeFarcaster();
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isLoading, isReady, error, ethProvider, sdkContext }}>
      {children}
    </FarcasterContext.Provider>
  );
};