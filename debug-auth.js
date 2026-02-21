// Run this in the browser console to debug authentication issues
console.log('=== Authentication Debug ===');

// Check localStorage
console.log('localStorage:');
console.log('  session_token:', localStorage.getItem('session_token') ? 'EXISTS' : 'MISSING');
console.log('  refresh_token:', localStorage.getItem('refresh_token') ? 'EXISTS' : 'MISSING');
console.log('  user_data:', localStorage.getItem('user_data') ? 'EXISTS' : 'MISSING');

// Check cookies
console.log('\nCookies:');
document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    console.log(`  ${name}:`, value ? 'EXISTS' : 'MISSING');
});

// Check frontendAuth
if (typeof window !== 'undefined' && window.frontendAuth) {
    const session = window.frontendAuth.getSession();
    console.log('\nfrontendAuth session:', session ? 'EXISTS' : 'MISSING');
    if (session) {
        console.log('  User ID:', session.user?.id);
        console.log('  Username:', session.user?.username);
    }
}

// Test API call
async function testMessagesAPI() {
    console.log('\n=== Testing Messages API ===');
    
    // Get auth headers
    const session = window.frontendAuth?.getSession();
    if (!session) {
        console.error('❌ No session found');
        return;
    }
    
    try {
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
            },
            body: JSON.stringify({
                conversationId: 'test',
                senderId: session.user.id,
                content: 'Test message',
                to: 'test',
                from: session.user.username
            })
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            console.log('✅ Messages API working!');
        } else {
            console.error('❌ Messages API failed:', data.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Uncomment to test
// testMessagesAPI();
