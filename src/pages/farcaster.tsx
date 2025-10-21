// src/pages/farcaster.tsx
import { useEffect, useState } from 'react';

export default function FarcasterPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initFarcaster() {
      try {
        console.log('🚀 Initializing Farcaster SDK...');
        
        // Import SDK
        const { default: sdk } = await import('@farcaster/frame-sdk');
        console.log('✅ SDK imported');
        
        // Wait for context
        console.log('⏳ Waiting for context...');
        const context = await sdk.context;
        console.log('✅ Context loaded:', context);
        
        // Small delay to ensure everything is mounted
        await new Promise(resolve => setTimeout(resolve, 150));
        
        if (!mounted) {
          console.log('⚠️ Component unmounted, skipping ready signal');
          return;
        }
        
        // Signal ready
        console.log('📢 Signaling ready...');
        sdk.actions.ready();
        console.log('✅ Ready signal sent!');
        
        setStatus('ready');
      } catch (err) {
        console.error('❌ Farcaster init error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setStatus('error');
        }
      }
    }

    initFarcaster();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A1A2E',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>
          🦅
        </div>
        
        <h1 style={{ fontSize: '32px', marginBottom: '10px', margin: 0 }}>
          GannetX
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: '#888',
          marginBottom: '30px',
          margin: '10px 0 30px 0'
        }}>
          Your Multichain GM Hub
        </p>

        {status === 'loading' && (
          <div style={{
            padding: '15px 30px',
            background: '#333',
            borderRadius: '12px',
            fontSize: '16px'
          }}>
            ⏳ Loading...
          </div>
        )}

        {status === 'ready' && (
          <div style={{
            padding: '15px 30px',
            background: '#00AA00',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            ✅ Ready to GM!
          </div>
        )}

        {status === 'error' && (
          <div style={{
            padding: '15px 30px',
            background: '#AA0000',
            borderRadius: '12px',
            fontSize: '14px'
          }}>
            ❌ Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}