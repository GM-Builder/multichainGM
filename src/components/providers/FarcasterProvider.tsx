// src/components/providers/FarcasterProvider.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Dynamic import Farcaster SDK
        const { default: sdk } = await import('@farcaster/frame-sdk');
        
        // Get context first
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // CRITICAL: Call sdk.actions.ready() to signal app is ready
        sdk.actions.ready();
        
        console.log('✅ Farcaster SDK loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Farcaster SDK:', error);
      } finally {
        setIsSDKLoaded(true);
      }
    };
    
    load();
  }, []);

  // Show minimal loading while SDK initializes
  if (!isSDKLoaded) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0A1929'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(0, 229, 255, 0.2)',
              borderTop: '4px solid #00E5FF',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}
          />
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}