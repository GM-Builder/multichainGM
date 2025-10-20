// src/hooks/useFarcasterContext.ts
import { useState, useEffect } from 'react';

interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContext {
  user?: FarcasterUser;
}

export function useFarcasterContext() {
  const [context, setContext] = useState<FarcasterContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const { default: sdk } = await import('@farcaster/frame-sdk');
        const frameContext = await sdk.context;
        setContext(frameContext as FarcasterContext);
      } catch (error) {
        console.error('Error loading Farcaster context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContext();
  }, []);

  return { context, isLoading };
}

export function useFarcasterUser() {
  const { context, isLoading } = useFarcasterContext();

  return {
    user: context?.user,
    fid: context?.user?.fid,
    username: context?.user?.username,
    displayName: context?.user?.displayName,
    pfpUrl: context?.user?.pfpUrl,
    isLoading,
  };
}