// src/pages/farcaster.tsx
import { useEffect, useState } from 'react';

export default function FarcasterPage() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeFarcaster = async () => {
      try {
        console.log('🚀 Initializing Farcaster SDK...');
        
        // Import SDK
        const { default: sdk } = await import('@farcaster/frame-sdk');
        
        // Wait for context to be ready
        console.log('⏳ Waiting for context...');
        const context = await sdk.context;
        console.log('✅ Context loaded:', context);
        
        // Small delay to ensure everything is mounted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isMounted) {
          // Signal ready
          console.log('📢 Signaling ready...');
          sdk.actions.ready();
          console.log('✅ Ready signal sent!');
          setIsReady(true);
        }
      } catch (err) {
        console.error('❌ Error initializing Farcaster:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initializeFarcaster();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#1A1A2E',
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1>🦅 GannetX</h1>
        <p>Your Multichain GM Hub</p>
        
        {error && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            background: '#ff4444', 
            borderRadius: '8px' 
          }}>
            Error: {error}
          </div>
        )}
        
        {isReady ? (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            background: '#44ff44', 
            color: '#000',
            borderRadius: '8px' 
          }}>
            ✅ App Ready!
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            ⏳ Loading...
          </div>
        )}
      </div>
    </div>
  );
}