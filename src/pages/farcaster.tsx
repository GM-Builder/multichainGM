// src/pages/farcaster.tsx
import { useEffect, useState } from 'react';

export default function FarcasterPage() {
  const [readyCalled, setReadyCalled] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, msg]);
  };

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        addLog('🚀 [FarcasterPage] Starting initialization...');
        addLog('📍 [FarcasterPage] URL: ' + window.location.href);
        addLog('📍 [FarcasterPage] User Agent: ' + navigator.userAgent.substring(0, 50));
        
        // Import SDK
        addLog('📦 [FarcasterPage] Importing SDK...');
        const { sdk } = await import('@farcaster/miniapp-sdk');
        addLog('✅ [FarcasterPage] SDK imported successfully');
        
        // Wait for DOM to be fully ready
        addLog('⏳ [FarcasterPage] Waiting 1000ms for stability...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Call ready
        addLog('📢 [FarcasterPage] Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        addLog('✅ [FarcasterPage] Ready called successfully!');
        
        setReadyCalled(true);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        addLog('❌ [FarcasterPage] Error: ' + errMsg);
        console.error('[FarcasterPage] Full error:', err);
        // Set ready anyway to prevent infinite loading
        setReadyCalled(true);
      }
    };
    
    // Only run on client side
    if (typeof window !== 'undefined') {
      addLog('🌐 [FarcasterPage] Client-side detected, starting init...');
      initMiniApp();
    } else {
      addLog('⚠️ [FarcasterPage] Server-side detected, skipping init');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #333'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🦅</div>
          <h1 style={{ fontSize: '24px', margin: '0 0 5px 0' }}>GannetX</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
            Your Multichain GM Hub
          </p>
        </div>

        {/* Status */}
        <div style={{
          padding: '15px',
          background: readyCalled ? '#003300' : '#333300',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {readyCalled ? '✅ READY!' : '⏳ INITIALIZING...'}
        </div>

        {/* Logs Display */}
        <div style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ color: '#0f0', fontSize: '11px', lineHeight: '1.8' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#ff0' }}>⚠️ No logs yet... Waiting for initialization...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '3px' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#1a1a1a',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#888'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>
            🔍 Debug Info:
          </div>
          <div>• If you see logs above, SDK is loading correctly</div>
          <div>• If no logs appear, check browser console (F12)</div>
          <div>• Error "Ready not called" should disappear when status shows ✅ READY</div>
        </div>
      </div>
    </div>
  );
}