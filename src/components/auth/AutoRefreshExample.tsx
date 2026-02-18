'use client';

import { useState } from 'react';
import { useGet, usePost, apiService } from '@/hooks/useApiWithRefresh';

export default function AutoRefreshExample() {
  const [manualCallResult, setManualCallResult] = useState<any>(null);

  // Example 1: Using useGet hook with automatic refresh
  const {
    data: protectedData,
    loading: protectedLoading,
    error: protectedError,
    sessionRefreshed,
    requiresLogin,
    refetch
  } = useGet<any>('/api/protected', {
    immediate: true,
    onSuccess: (data) => {
      console.log('✅ API call successful:', data);
    },
    onError: (error) => {
      console.error('❌ API call failed:', error);
    },
    requiresLogin: (requiresLogin) => {
      if (requiresLogin) {
        console.log('🔐 User needs to login');
        // Redirect to login or show login modal
        // window.location.href = '/login';
      }
    }
  });

  // Example 2: Manual API call with automatic refresh
  const handleManualApiCall = async () => {
    try {
      console.log('🔄 Making manual API call...');
      const response = await apiService.get('/api/protected');
      
      if (response.error) {
        console.error('❌ Manual call failed:', response.error);
        setManualCallResult({ error: response.error, requiresLogin: response.requiresLogin });
      } else {
        console.log('✅ Manual call successful:', response.data);
        setManualCallResult({ 
          success: true, 
          data: response.data,
          sessionRefreshed: response.sessionRefreshed 
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setManualCallResult({ error: 'Unexpected error occurred' });
    }
  };

  // Example 3: POST request with automatic refresh
  const handlePostRequest = async () => {
    try {
      console.log('🔄 Making POST request...');
      const response = await apiService.post('/api/protected', { 
        message: 'Hello from client!',
        timestamp: new Date().toISOString()
      });
      
      if (response.error) {
        console.error('❌ POST request failed:', response.error);
        setManualCallResult({ error: response.error, requiresLogin: response.requiresLogin });
      } else {
        console.log('✅ POST request successful:', response.data);
        setManualCallResult({ 
          success: true, 
          data: response.data,
          sessionRefreshed: response.sessionRefreshed 
        });
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setManualCallResult({ error: 'Unexpected error occurred' });
    }
  };

  // Example 4: Force token expiration test (simulate expired token)
  const simulateTokenExpiry = () => {
    // Remove access token to simulate expiry
    localStorage.removeItem('access_token');
    console.log('🕐 Access token removed, simulating expiry...');
    setManualCallResult(null);
  };

  const currentUser = apiService.getCurrentUser();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔄 Auto Token Refresh Example</h2>
      
      {/* Current User Info */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h3>👤 Current User</h3>
        <p><strong>Username:</strong> {currentUser.username || 'Not logged in'}</p>
        <p><strong>User ID:</strong> {currentUser.id || 'Not available'}</p>
        <p><strong>Has Access Token:</strong> {currentUser.accessToken ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Has Refresh Token:</strong> {currentUser.refreshToken ? '✅ Yes' : '❌ No'}</p>
      </div>

      {/* Automatic Hook Example */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🪝 Automatic Hook Example</h3>
        {protectedLoading && <p>⏳ Loading...</p>}
        {protectedError && (
          <p style={{ color: 'red' }}>
            ❌ Error: {protectedError}
            {requiresLogin && ' (Please login)'}
          </p>
        )}
        {sessionRefreshed && (
          <p style={{ color: 'green', fontWeight: 'bold' }}>
            ✅ Session was automatically refreshed!
          </p>
        )}
        {protectedData && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e8f5e8', 
            borderRadius: '5px'
          }}>
            <h4>✅ Protected Data:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(protectedData, null, 2)}
            </pre>
          </div>
        )}
        <button onClick={refetch} style={{ marginTop: '10px' }}>
          🔄 Refetch Data
        </button>
      </div>

      {/* Manual API Call Example */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🎯 Manual API Call Example</h3>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={handleManualApiCall} style={{ marginRight: '10px' }}>
            📡 GET Request
          </button>
          <button onClick={handlePostRequest} style={{ marginRight: '10px' }}>
            📤 POST Request
          </button>
          <button onClick={simulateTokenExpiry} style={{ marginRight: '10px' }}>
            🕐 Simulate Token Expiry
          </button>
        </div>
        
        {manualCallResult && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: manualCallResult.success ? '#e8f5e8' : '#ffe8e8', 
            borderRadius: '5px'
          }}>
            <h4>{manualCallResult.success ? '✅ Success' : '❌ Result'}:</h4>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(manualCallResult, null, 2)}
            </pre>
            {manualCallResult.sessionRefreshed && (
              <p style={{ color: 'green', fontWeight: 'bold' }}>
                ✅ Session was automatically refreshed!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>📖 How it works:</h4>
        <ol>
          <li><strong>401 Error Detection:</strong> When API returns 401, system automatically tries to refresh token</li>
          <li><strong>Automatic Retry:</strong> After successful refresh, the original request is retried automatically</li>
          <li><strong>Seamless Experience:</strong> User doesn't notice the token refresh happening</li>
          <li><strong>Fallback:</strong> If refresh fails, user is prompted to login again</li>
        </ol>
        <p><strong>💡 Tip:</strong> Click "Simulate Token Expiry" to test the refresh functionality!</p>
      </div>
    </div>
  );
}
