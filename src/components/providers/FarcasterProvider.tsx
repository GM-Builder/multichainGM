// src/components/providers/FarcasterProvider.tsx
'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';

interface FarcasterContextType {
  context: any | null;
  isLoading: boolean;
  isReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  context: null,
  isLoading: true,
  isReady: false
});

export const useFarcasterContext = () => useContext(FarcasterContext);

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initMiniApp() {
      try {
        console.log('🚀 [FarcasterProvider] Initializing Mini App...');
        console.log('📍 [FarcasterProvider] Current URL:', window.location.href);
        
        // Import SDK
        const { sdk } = await import('@farcaster/miniapp-sdk');
        console.log('✅ [FarcasterProvider] SDK imported');
        
        // CRITICAL: Wait for context first!
        const ctx = await sdk.context;
        console.log('✅ [FarcasterProvider] Context loaded:', ctx);
        setContext(ctx);
        
        // Small delay to ensure UI is fully mounted
        console.log('⏳ [FarcasterProvider] Waiting 300ms for UI to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // NOW call ready()
        console.log('📢 [FarcasterProvider] Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        console.log('✅ [FarcasterProvider] Ready signal sent successfully!');
        
        setIsReady(true);
      } catch (err) {
        console.error('❌ [FarcasterProvider] Init error:', err);
      } finally {
        setIsLoading(false);
        console.log('🏁 [FarcasterProvider] Initialization complete');
      }
    }
    
    initMiniApp().catch(err => {
      console.error('❌ [FarcasterProvider] Uncaught error:', err);
    });
  }, []);

  return (
    <FarcasterContext.Provider value={{ context, isLoading, isReady }}>
      {children}
    </FarcasterContext.Provider>
  );
}