import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8ffff',
        padding: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '4rem',
          fontWeight: 700,
          color: '#e58300',
          marginBottom: '0.5rem',
        }}
      >
        404
      </h1>
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#3d6b6b',
          marginBottom: '0.75rem',
        }}
      >
        Page not found
      </h2>
      <p
        style={{
          color: '#3d6b6b',
          marginBottom: '1.5rem',
          textAlign: 'center',
          maxWidth: '28rem',
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          backgroundColor: '#e58300',
          color: '#ffffff',
          fontWeight: 600,
          padding: '0.625rem 1.5rem',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
