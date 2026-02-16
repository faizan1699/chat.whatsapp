// Frontend authentication utilities for localStorage-based session management

export interface UserData {
    id: string;
    username: string;
    email: string;
    phoneNumber: string;
}

export interface StoredSession {
    accessToken: string;
    refreshToken: string;
    user: UserData;
}

export const frontendAuth = {
    // Store session data in localStorage
    setSession(accessToken: string, refreshToken: string, user: UserData) {
        if (typeof window === 'undefined') return;
        
        localStorage.setItem('session_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user_data', JSON.stringify(user));
    },

    // Get stored session data
    getSession(): StoredSession | null {
        if (typeof window === 'undefined') return null;
        
        try {
            const accessToken = localStorage.getItem('session_token');
            const refreshToken = localStorage.getItem('refresh_token');
            const userData = localStorage.getItem('user_data');
            
            if (!accessToken || !refreshToken || !userData) {
                return null;
            }
            
            return {
                accessToken,
                refreshToken,
                user: JSON.parse(userData)
            };
        } catch (error) {
            console.error('Error parsing stored session:', error);
            return null;
        }
    },

    // Get access token for API calls
    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('session_token');
    },

    // Get refresh token
    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    },

    // Get user data
    getUser(): UserData | null {
        const session = this.getSession();
        return session?.user || null;
    },

    // Clear session data (logout)
    clearSession() {
        if (typeof window === 'undefined') return;
        
        localStorage.removeItem('session_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    },

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.getSession() !== null;
    },

    // Make authenticated API requests
    async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
        const token = this.getAccessToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        };

        return fetch(url, {
            ...options,
            headers,
        });
    },

    // Refresh session using refresh token
    async refreshSession(): Promise<boolean> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        try {
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setSession(data.accessToken, data.refreshToken || refreshToken, data.user);
                return true;
            }
        } catch (error) {
            console.error('Session refresh failed:', error);
        }

        // If refresh fails, clear session
        this.clearSession();
        return false;
    },
};
