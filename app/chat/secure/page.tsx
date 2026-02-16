'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { frontendAuth } from '@/utils/frontendAuth';

export default function SecureChatPage() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshStatus, setRefreshStatus] = useState('');
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check session using frontend auth utility
                const storedSession = frontendAuth.getSession();
                
                if (storedSession) {
                    setSession(storedSession.user);
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('❌ Auth check failed:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleRefresh = async () => {
        setRefreshStatus('Refreshing...');
        try {
            const success = await frontendAuth.refreshSession();
            
            if (success) {
                const updatedSession = frontendAuth.getSession();
                setSession(updatedSession?.user || null);
                setRefreshStatus('✅ Session refreshed successfully!');
                console.log('Session refreshed:', updatedSession);
            } else {
                setRefreshStatus('❌ Refresh failed');
                router.push('/login');
            }
        } catch (error) {
            console.error('Refresh error:', error);
            setRefreshStatus('❌ Network error during refresh');
        }
        
        setTimeout(() => setRefreshStatus(''), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-red-600">Authentication required</p>
                    <button 
                        onClick={() => router.push('/login')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold mb-4">Secure Chat - 1 Month Session</h1>
                    <p className="text-gray-600">Welcome, {session.username}!</p>
                    <p className="text-sm text-gray-500 mt-2">User ID: {session.userId}</p>
                    
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                        <h2 className="text-green-800 font-semibold">✅ Authentication Successful</h2>
                        <p className="text-green-700 mt-2">
                            This page is protected by server-side authentication using HTTP-only cookies with auto-refresh tokens.
                        </p>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                            <h3 className="text-blue-800 font-semibold">🔐 Token System:</h3>
                            <ul className="text-blue-700 mt-2 list-disc list-inside space-y-1">
                                <li><strong>Access Token:</strong> 1 hour expiry (auto-refreshed)</li>
                                <li><strong>Refresh Token:</strong> 30 days expiry</li>
                                <li><strong>Auto-Refresh:</strong> Automatic token renewal</li>
                                <li><strong>Security:</strong> Separate secrets for each token type</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                            <h3 className="text-purple-800 font-semibold">🔄 Session Management:</h3>
                            <ul className="text-purple-700 mt-2 list-disc list-inside space-y-1">
                                <li>Session lasts up to 30 days</li>
                                <li>Tokens refresh automatically when expired</li>
                                <li>No user interruption required</li>
                                <li>Secure logout clears all tokens</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Manual Refresh
                            </button>
                            
                            <button 
                                onClick={() => router.push('/chat')}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Go to Chat App
                            </button>
                        </div>

                        {refreshStatus && (
                            <div className="p-3 bg-gray-100 border border-gray-300 rounded">
                                <p className="text-sm text-gray-700">{refreshStatus}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
