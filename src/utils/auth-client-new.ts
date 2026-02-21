// Unified client authentication utilities
import { frontendAuth } from './frontendAuth';
import { getClientCookies } from './cookies';
import { clearAllSessionData } from './sessionCleanup';

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

export const getClientSession = (): ClientSession | null => {
    try {
        // Check cookies first (faster than localStorage)
        const cookies = getClientCookies();
        const cookieUserId = cookies['user-id'];
        const cookieUsername = cookies['username'];
        
        if (cookieUserId && cookieUsername) {
            return {
                userId: cookieUserId,
                username: cookieUsername,
                user: {
                    id: cookieUserId,
                    username: cookieUsername
                }
            };
        }
        
        // Fallback to localStorage with error handling
        const localStorageSession = frontendAuth.getSession();
        if (localStorageSession) {
            return {
                userId: localStorageSession.user.id,
                username: localStorageSession.user.username,
                user: localStorageSession.user
            };
        }
        
        return null;
    } catch (error) {
        console.error('Session check error:', error);
        return null;
    }
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

// Handle 401 errors and redirect to login
export const handleAuthError = (error: any, defaultMessage: string = 'Authentication failed') => {
    if (error?.status === 401 || error?.message?.includes('Unauthorized') || error?.message?.includes('401')) {
        console.error('🔐 Authentication failed - redirecting to login');
        
        // Clear invalid session data using utility function
        clearAllSessionData();
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        
        throw new Error(defaultMessage);
    }
};
