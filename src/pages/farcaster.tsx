// src/pages/farcaster.tsx
export default function FarcasterPage() {
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
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🦅</div>
        <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>GannetX</h1>
        <p style={{ fontSize: '18px', color: '#888', margin: '0 0 30px 0' }}>
          Your Multichain GM Hub
        </p>
        <div style={{ 
          padding: '15px 30px', 
          background: '#00AA00', 
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          ✅ Ready to GM!
        </div>
      </div>
    </div>
  );
}
