// src/pages/farcaster.tsx
import { useFarcasterContext } from '@/components/providers/FarcasterProvider';

export default function FarcasterPage() {
  const { context, isLoading, isReady } = useFarcasterContext();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1A1A2E',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🦅</div>
        
        <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>GannetX</h1>
        
        <p style={{ fontSize: '18px', color: '#888', margin: '0 0 30px 0' }}>
          Your Multichain GM Hub
        </p>

        {/* Status Indicator */}
        {isLoading && (
          <div style={{
            padding: '15px 30px',
            background: '#333',
            borderRadius: '12px',
            fontSize: '16px'
          }}>
            ⏳ Loading Mini App...
          </div>
        )}

        {isReady && (
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

        {/* Debug Info (optional, hapus di production) */}
        {context && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            background: '#222',
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left',
            fontFamily: 'monospace'
          }}>
            <div>FID: {context.user?.fid}</div>
            <div>Username: {context.user?.username}</div>
          </div>
        )}
      </div>
    </div>
  );
}