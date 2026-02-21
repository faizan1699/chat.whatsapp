// Optimized session management with caching
import { getClientSession } from './auth-client-new';

let cachedSession: any = null;
let lastSessionCheck = 0;
const SESSION_CACHE_DURATION = 5000; // 5 seconds

export const getClientSessionOptimized = () => {
    const now = Date.now();
    
    // Return cached session if still valid
    if (cachedSession && (now - lastSessionCheck) < SESSION_CACHE_DURATION) {
        return cachedSession;
    }
    
    // Otherwise check and cache new session
    cachedSession = getClientSession();
    lastSessionCheck = now;
    
    return cachedSession;
};

export const invalidateSessionCache = () => {
    cachedSession = null;
    lastSessionCheck = 0;
};
