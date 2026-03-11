export default function LoadingScreen({ error }) {
  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#040804',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", gap: 20,
    }}>
      <img src="/logo.png" alt="GRIDZILLA" style={{ height: 80, animation: 'pulse 1.5s infinite' }} />

      {error ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#EF4444', fontSize: 14, marginBottom: 8 }}>Connection failed</div>
          <div style={{ color: '#778', fontSize: 12, maxWidth: 400, lineHeight: 1.6 }}>
            {error}
          </div>
          <div style={{ color: '#778', fontSize: 12, marginTop: 12 }}>
            Make sure the backend is running on port 3001
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>
            Loading 10,000 validator nodes...
          </div>
          <div style={{
            width: 200, height: 3, background: '#142014', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: '#4ADE80', borderRadius: 2,
              animation: 'loadbar 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes loadbar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
