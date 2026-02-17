'use client';

import { useGet } from '@/hooks/useApiWithRefresh';

// Simple component that shows automatic token refresh
export default function SimpleApiExample() {
  // Just one line - automatic token refresh on 401!
  const { data, loading, error, sessionRefreshed } = useGet<any>('/api/protected', {
    immediate: true
  });

  if (loading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3>✅ Protected Data Loaded</h3>
      {sessionRefreshed && (
        <p style={{ color: 'green' }}>
          🔄 Session was automatically refreshed!
        </p>
      )}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
