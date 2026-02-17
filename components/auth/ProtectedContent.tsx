'use client';

import { useState, useEffect } from 'react';
import { authenticatedFetch, isAuthenticated, getCurrentUser, logout } from '@/utils/auth-client';

export default function ProtectedContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the authenticatedFetch function which handles token refresh automatically
        const response = await authenticatedFetch('/api/protected');
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Authentication failed. Please log in again.');
            logout();
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (isAuthenticated()) {
      fetchProtectedData();
    } else {
      setError('Please log in to access this content');
      setLoading(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    try {
      const response = await authenticatedFetch('/api/protected');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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

  const user = getCurrentUser();

  return (
    <div>
      <h2>Protected Content</h2>
      <div>
        <strong>Current User:</strong> {user?.username || 'Unknown'}
      </div>
      <div>
        <strong>User ID:</strong> {user?.id || 'Unknown'}
      </div>
      
      {data && (
        <div>
          <h3>API Response:</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          {data.sessionRefreshed && (
            <p style={{ color: 'green' }}>
              ✅ Session was automatically refreshed!
            </p>
          )}
        </div>
      )}

      <button onClick={handleManualRefresh} style={{ marginTop: '10px' }}>
        Refresh Data
      </button>

      <button 
        onClick={logout} 
        style={{ marginLeft: '10px', marginTop: '10px' }}
      >
        Logout
      </button>
    </div>
  );
}
