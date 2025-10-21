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
    async function loadContext() {
      try {
        console.log('🚀 Loading Farcaster SDK...');
        
        // Import miniapp-sdk (BUKAN frame-sdk!)
        const { sdk } = await import('@farcaster/miniapp-sdk');
        console.log('📦 SDK imported');
        
        // PENTING: Tunggu context dulu!
        const ctx = await sdk.context;
        console.log('✅ Context loaded:', ctx);
        setContext(ctx);
        
        // Delay kecil untuk ensure DOM ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Baru call ready SETELAH context siap
        await sdk.actions.ready();
        console.log('✅ Ready signal sent!');
        
        setIsReady(true);
      } catch (err) {
        console.error('❌ Provider error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadContext();
  }, []);

  return (
    <FarcasterContext.Provider value={{ context, isLoading, isReady }}>
      {children}
    </FarcasterContext.Provider>
  );
}