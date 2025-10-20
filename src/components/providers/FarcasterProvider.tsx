// src/components/providers/FarcasterProvider.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const { default: sdk } = await import('@farcaster/frame-sdk');
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log('✅ Farcaster SDK context loaded');
      } catch (error) {
        console.error('❌ Error loading Farcaster SDK:', error);
      }
    };
    
    loadContext();
  }, []);

  return <>{children}</>;
}