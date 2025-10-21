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
    const loadContext = async () => {
      try {
        const { default: sdk } = await import('@farcaster/miniapp-sdk');
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log('✅ Farcaster context loaded in provider');
      } catch (error) {
        console.error('❌ Error loading Farcaster context:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContext();
  }, []);

  // PENTING: Langsung return children, JANGAN ada loader atau ready() call di sini
  return (
    <FarcasterContext.Provider value={{ context, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
}