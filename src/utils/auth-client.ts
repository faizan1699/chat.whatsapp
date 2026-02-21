// Unified client authentication utilities
import { frontendAuth } from './frontendAuth';
import { getClientCookies } from './cookies';

export interface ClientSession {
    userId: string;
    username: string;
    user?: {
        id: string;
        username: string;
        email?: string;
        phoneNumber?: string;
        avatar?: string;
    };
}

// Get session from cookies first, fallback to localStorage
export const getClientSession = (): ClientSession | null => {
    // Try cookies first (server-side set cookies)
    const cookies = getClientCookies();
    const cookieUserId = cookies['user-id'];
    const cookieUsername = cookies['username'];
    
    if (cookieUserId && cookieUsername) {
        console.log('🍪 Using cookie-based session');
        return {
            userId: cookieUserId,
            username: cookieUsername,
            user: {
                id: cookieUserId,
                username: cookieUsername
            }
        };
    }
    
    // Fallback to localStorage (client-side storage)
    const localStorageSession = frontendAuth.getSession();
    if (localStorageSession) {
        console.log('💾 Using localStorage session');
        return {
            userId: localStorageSession.user.id,
            username: localStorageSession.user.username,
            user: localStorageSession.user
        };
    }
    
    console.log('❌ No session found');
    return null;
};

// Check if user is authenticated
export const isClientAuthenticated = (): boolean => {
    return getClientSession() !== null;
};

// Get auth headers for API calls
export const getAuthHeaders = (): { [key: string]: string } => {
    const session = getClientSession();
    
    if (!session) {
        return {};
    }
    
    // Try to get token from cookies first
    const cookies = getClientCookies();
    const accessToken = cookies['access_token'] || cookies['auth-token'] || frontendAuth.getAccessToken();
    
    return {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
    };
};

// Legacy exports for backward compatibility
export const authenticatedFetch = frontendAuth.authenticatedFetch;
export const isAuthenticated = frontendAuth.isAuthenticated;
export const getCurrentUser = frontendAuth.getUser;
export const logout = frontendAuth.clearSession;
