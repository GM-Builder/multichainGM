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
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
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

        {/* Your actual Mini App content here */}
        <div style={{ marginTop: '30px' }}>
          {/* Add your Mini App features here */}
        </div>
      </div>
    </div>
  );
}