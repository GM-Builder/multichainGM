// src/hooks/useFarcasterContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  isReady: boolean;
  isLoading: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isReady: false,
  isLoading: true,
});

export const useFarcasterUser = () => useContext(FarcasterContext);

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🚀 [Farcaster] Initializing...');
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Get context first
        try {
          const context = await sdk.context;
          console.log('📦 [Farcaster] Context:', context);
          
          if (context?.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          }
        } catch (ctxErr) {
          console.warn('⚠️ [Farcaster] No context (maybe running outside Mini App)');
        }
        
        // Wait for stability
        await new Promise(r => setTimeout(r, 300));
        
        // Call ready
        await sdk.actions.ready();
        console.log('✅ [Farcaster] Ready called!');
        setIsReady(true);
      } catch (err) {
        console.error('❌ [Farcaster] Error:', err);
        setIsReady(true); // Set anyway
      } finally {
        setIsLoading(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      init();
    }
  }, []);

  return (
    <FarcasterContext.Provider value={{ user, isReady, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
}