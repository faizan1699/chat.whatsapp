
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
    setSession(accessToken: string, refreshToken: string, user: UserData) {
        if (typeof window === 'undefined') return;
        
        localStorage.setItem('session_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user_data', JSON.stringify(user));
    },

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

    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('session_token');
    },

    getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    },

    getUser(): UserData | null {
        const session = this.getSession();
        return session?.user || null;
    },

    clearSession() {
        if (typeof window === 'undefined') return;
        localStorage.clear();
    },

    isAuthenticated(): boolean {
        return this.getSession() !== null;
    },

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

        this.clearSession();
        return false;
    },
};
