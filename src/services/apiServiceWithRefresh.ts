// Enhanced API Service with automatic token refresh on 401 errors

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  requiresLogin?: boolean;
  sessionRefreshed?: boolean;
}

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

class ApiServiceWithRefresh {
  private baseURL: string;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  // Add subscriber to wait for token refresh
  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  // Notify all subscribers that token is refreshed
  private notifyRefreshSubscribers(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve) => {
        this.addRefreshSubscriber((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        console.log('🔄 No refresh token found');
        this.notifyRefreshSubscribers('');
        return null;
      }

      console.log('🔄 Refreshing access token...');
      
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status);
        this.clearTokens();
        this.notifyRefreshSubscribers('');
        return null;
      }

      const data: RefreshResponse = await response.json();
      
      // Store new tokens
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('username', data.user.username);
      
      console.log('✅ Token refreshed successfully');
      this.notifyRefreshSubscribers(data.accessToken);
      return data.accessToken;

    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      this.clearTokens();
      this.notifyRefreshSubscribers('');
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Clear all tokens
  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
  }

  // Get current access token
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Make API request with automatic retry on 401
  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const maxRetries = 1; // Only retry once after refresh

    try {
      // Get current access token
      let accessToken = this.getAccessToken();

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.getHeadersFromOptions(options.headers),
      };

      // Add authorization header if we have a token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Make the request
      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        headers,
      });

      // Handle 401 - Unauthorized
      if (response.status === 401 && retryCount < maxRetries) {
        console.log('🔄 Got 401, attempting token refresh...');
        
        // Try to refresh the token
        const newAccessToken = await this.refreshAccessToken();
        
        if (newAccessToken) {
          // Retry the request with new token
          console.log('🔄 Retrying request with new token...');
          return this.makeRequest<T>(url, options, retryCount + 1);
        } else {
          // Refresh failed, user needs to login
          return {
            error: 'Session expired. Please login again.',
            requiresLogin: true,
          };
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      // Parse successful response
      const data = await response.json();
      
      return {
        data,
        sessionRefreshed: retryCount > 0, // Indicate if session was refreshed
      };

    } catch (error) {
      console.error('API request error:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Extract headers from options
  private getHeadersFromOptions(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (!headers) return result;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.assign(result, headers);
    }

    return result;
  }

  // HTTP Methods
  async get<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }

  async patch<T>(url: string, data?: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Get current user info
  getCurrentUser() {
    return {
      id: localStorage.getItem('user_id'),
      username: localStorage.getItem('username'),
      accessToken: this.getAccessToken(),
      refreshToken: localStorage.getItem('refresh_token'),
    };
  }

  // Logout user
  logout() {
    this.clearTokens();
    console.log('👋 User logged out');
  }
}

// Create singleton instance
export const apiService = new ApiServiceWithRefresh();

// Export individual methods for convenience
export const { get, post, put, delete: deleteMethod, patch, isAuthenticated, getCurrentUser, logout } = apiService;

// Export class for creating multiple instances if needed
export { ApiServiceWithRefresh };
