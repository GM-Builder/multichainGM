// src/components/providers/FarcasterProvider.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContext {
  user?: FarcasterUser;
}

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { default: sdk } = await import('@farcaster/frame-sdk');
        await sdk.context;
        sdk.actions.ready();
      } catch (error) {
        console.error('Farcaster SDK error:', error);
      } finally {
        setIsSDKLoaded(true);
      }
    };
    
    load();
  }, []);

  // Langsung render children tanpa loading screen
  return <>{children}</>;
}