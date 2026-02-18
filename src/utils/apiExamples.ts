// Example usage of frontendAuth utility for authenticated API calls

import { frontendAuth } from '@/utils/frontendAuth';

// Example: Making an authenticated API call to get messages
export async function fetchMessages(conversationId: string, limit = 50, offset = 0) {
    try {
        const response = await frontendAuth.authenticatedFetch(
            `/api/messages?conversationId=${conversationId}&limit=${limit}&offset=${offset}`,
            {
                method: 'GET',
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await frontendAuth.refreshSession();
                if (refreshed) {
                    // Retry the request with new token
                    const retryResponse = await frontendAuth.authenticatedFetch(
                        `/api/messages?conversationId=${conversationId}&limit=${limit}&offset=${offset}`
                    );
                    return retryResponse.json();
                } else {
                    // Refresh failed, redirect to login
                    window.location.href = '/login';
                    return null;
                }
            }
            throw new Error('Failed to fetch messages');
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }
}

// Example: Sending a message with authentication
export async function sendMessage(conversationId: string, content: string, isVoice = false, audioUrl?: string, audioDuration?: number) {
    const user = frontendAuth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    try {
        const response = await frontendAuth.authenticatedFetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                conversationId,
                senderId: user.id,
                content,
                isVoice,
                audioUrl,
                audioDuration,
                from: user.username,
                to: '', // Add recipient if needed
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Handle expired token
                const refreshed = await frontendAuth.refreshSession();
                if (refreshed) {
                    const retryResponse = await frontendAuth.authenticatedFetch('/api/messages', {
                        method: 'POST',
                        body: JSON.stringify({
                            conversationId,
                            senderId: user.id,
                            content,
                            isVoice,
                            audioUrl,
                            audioDuration,
                            from: user.username,
                            to: '',
                        }),
                    });
                    return retryResponse.json();
                } else {
                    window.location.href = '/login';
                    return null;
                }
            }
            throw new Error('Failed to send message');
        }

        return response.json();
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

// Example: Editing a message with authentication
export async function editMessage(messageId: string, newContent: string) {
    const user = frontendAuth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    try {
        const response = await frontendAuth.authenticatedFetch('/api/messages', {
            method: 'PUT',
            body: JSON.stringify({
                messageId,
                content: newContent,
                from: user.username,
                to: '', // Add recipient if needed
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                const refreshed = await frontendAuth.refreshSession();
                if (refreshed) {
                    const retryResponse = await frontendAuth.authenticatedFetch('/api/messages', {
                        method: 'PUT',
                        body: JSON.stringify({
                            messageId,
                            content: newContent,
                            from: user.username,
                            to: '',
                        }),
                    });
                    return retryResponse.json();
                } else {
                    window.location.href = '/login';
                    return null;
                }
            }
            throw new Error('Failed to edit message');
        }

        return response.json();
    } catch (error) {
        console.error('Error editing message:', error);
        throw error;
    }
}

// Example: Deleting a message with authentication
export async function deleteMessage(messageId: string) {
    const user = frontendAuth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    try {
        const response = await frontendAuth.authenticatedFetch('/api/messages', {
            method: 'DELETE',
            body: JSON.stringify({
                messageId,
                from: user.username,
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                const refreshed = await frontendAuth.refreshSession();
                if (refreshed) {
                    const retryResponse = await frontendAuth.authenticatedFetch('/api/messages', {
                        method: 'DELETE',
                        body: JSON.stringify({
                            messageId,
                            from: user.username,
                        }),
                    });
                    return retryResponse.json();
                } else {
                    window.location.href = '/login';
                    return null;
                }
            }
            throw new Error('Failed to delete message');
        }

        return response.json();
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
}

// Example: Logout function
export function logout() {
    frontendAuth.clearSession();
    window.location.href = '/login';
}

// Example: Check if user is logged in
export function isLoggedIn(): boolean {
    return frontendAuth.isAuthenticated();
}

// Example: Get current user
export function getCurrentUser() {
    return frontendAuth.getUser();
}
