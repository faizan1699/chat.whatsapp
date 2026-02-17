import { getClientCookies } from './cookies';

// Secure session utilities - replaces localStorage for sensitive data
export class SecureSession {
  // Get user data from secure cookies
  static getUser() {
    try {
      const cookies = getClientCookies();
      return {
        username: cookies.username || '',
        userId: cookies['user-id'] || '',
        authToken: cookies['auth-token'] || ''
      };
    } catch (error) {
      console.error('Error getting user from secure cookies:', error);
      return {
        username: '',
        userId: '',
        authToken: ''
      };
    }
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const user = this.getUser();
    return !!(user.username && user.userId && user.authToken);
  }

  // Get user ID safely
  static getUserId(): string {
    return this.getUser().userId;
  }

  // Get username safely
  static getUsername(): string {
    return this.getUser().username;
  }

  // Get auth token safely
  static getAuthToken(): string {
    return this.getUser().authToken;
  }

  // Clear user session (requires server-side cookie clearing)
  static clearSession() {
    console.warn('clearSession: Session clearing must be done server-side');
    // This should be handled by server API endpoint that clears cookies
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'user-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Validate session integrity
  static validateSession(): boolean {
    const user = this.getUser();
    return !!(user.username && user.userId && user.authToken);
  }
}

// Export as default for easy usage
export default SecureSession;
