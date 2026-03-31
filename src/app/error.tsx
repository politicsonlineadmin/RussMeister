'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Runtime error:', error);
  }, [error]);

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
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#3d6b6b',
          marginBottom: '0.75rem',
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          color: '#3d6b6b',
          marginBottom: '1.5rem',
          textAlign: 'center',
          maxWidth: '28rem',
        }}
      >
        An unexpected error occurred. Please try again, and if the problem
        persists, refresh the page.
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: '#e58300',
          color: '#ffffff',
          fontWeight: 600,
          padding: '0.625rem 1.5rem',
          borderRadius: '0.5rem',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
