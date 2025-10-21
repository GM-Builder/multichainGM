// src/components/providers/FarcasterProvider.tsx
'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';

interface FarcasterContextType {
  context: any | null;
  isLoading: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  context: null,
  isLoading: true
});

export const useFarcasterContext = () => useContext(FarcasterContext);

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContext() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const ctx = await sdk.context;
        setContext(ctx);
        console.log('📦 Context loaded in provider');
      } catch (err) {
        console.error('❌ Provider context error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadContext();
  }, []);

  return (
    <FarcasterContext.Provider value={{ context, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
}