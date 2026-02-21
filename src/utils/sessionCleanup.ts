// Session cleanup utilities
export const clearAllSessionData = () => {
    if (typeof window === 'undefined') return;
    
    try {
        // Clear all localStorage data
        localStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Clear sessionStorage as well
        sessionStorage.clear();
        
        console.log('🧹 All session data cleared');
    } catch (error) {
        console.error('Error clearing session data:', error);
    }
};

export const handleAuthFailure = (router?: any) => {
    clearAllSessionData();
    
    // Redirect to login if router is available
    if (router && typeof router.push === 'function') {
        router.push('/login');
    } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};
