// src/pages/farcaster.tsx
import { useEffect, useState } from 'react';

export default function FarcasterPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    let mounted = true;
    let readyCalled = false;

    async function init() {
      try {
        addLog('🚀 Starting initialization...');
        
        // Check if we're in Farcaster context
        const userAgent = navigator.userAgent;
        addLog(`📱 User Agent: ${userAgent.substring(0, 50)}...`);
        
        // Import SDK
        addLog('📦 Importing Farcaster SDK...');
        const sdk = await import('@farcaster/frame-sdk');
        addLog('✅ SDK imported successfully');
        
        // Get context
        addLog('⏳ Getting context...');
        const ctx = await sdk.default.context;
        addLog(`✅ Context received: ${JSON.stringify(ctx).substring(0, 80)}...`);
        
        // Wait a bit to ensure everything is ready
        addLog('⏳ Waiting 300ms before calling ready...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!mounted) {
          addLog('⚠️ Component unmounted, aborting');
          return;
        }
        
        // Call ready
        addLog('📢 Calling sdk.actions.ready()...');
        sdk.default.actions.ready();
        readyCalled = true;
        addLog('✅ sdk.actions.ready() called successfully!');
        
        setStatus('ready');
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        addLog(`❌ ERROR: ${errMsg}`);
        if (mounted) {
          setStatus('error');
        }
      }
    }

    init();

    return () => {
      mounted = false;
      if (readyCalled) {
        addLog('🧹 Cleanup: Component unmounting');
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
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
          background: status === 'ready' ? '#003300' : status === 'error' ? '#330000' : '#333300',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {status === 'loading' && '⏳ LOADING...'}
          {status === 'ready' && '✅ READY!'}
          {status === 'error' && '❌ ERROR'}
        </div>

        {/* Logs */}
        <div style={{
          background: '#000',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '15px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <div style={{ color: '#0f0', fontSize: '11px', lineHeight: '1.6' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '3px' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}