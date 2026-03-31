export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8ffff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: '#e58300',
          marginBottom: '1.5rem',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        RussMeister
      </div>
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          border: '3px solid #e5e7eb',
          borderTopColor: '#e58300',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
