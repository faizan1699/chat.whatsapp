interface RefreshResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
  };
}

// Client-side function to refresh tokens
export async function refreshTokens(): Promise<RefreshResponse | null> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.log('No refresh token found in localStorage');
      return null;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      // Clear tokens if refresh fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      return null;
    }

    const data: RefreshResponse = await response.json();
    
    // Store new tokens
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('username', data.user.username);
    
    console.log('✅ Tokens refreshed successfully');
    return data;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    // Clear tokens on error
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    return null;
  }
}

// Enhanced fetch function that handles token refresh automatically
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Get current access token
  let accessToken = localStorage.getItem('access_token');
  
  // If no token, try to refresh
  if (!accessToken) {
    const refreshResult = await refreshTokens();
    if (refreshResult) {
      accessToken = refreshResult.accessToken;
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {};
  
  // Copy existing headers
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }
  }

  // Add authorization header if we have a token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If we get a 401, try to refresh and retry once
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    console.log('🔄 Got 401, attempting token refresh...');
    
    const refreshResult = await refreshTokens();
    if (refreshResult) {
      // Retry the request with new token
      headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  return response;
}

// Function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

// Function to get current user info
export function getCurrentUser() {
  return {
    id: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
}

// Function to logout user
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
  console.log('👋 User logged out, tokens cleared');
}
