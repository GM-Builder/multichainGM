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