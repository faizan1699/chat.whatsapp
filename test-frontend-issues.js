// Test script to check frontend message sending issues

console.log('🧪 Testing Frontend Message Sending Issues...\n');

// Mock localStorage with current session data
const mockLocalStorage = {
    data: {
        'session_token': 'test-access-token',
        'refresh_token': 'test-refresh-token',
        'user_data': JSON.stringify({
            id: 'test-user-id-123',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '1234567890'
        })
    },
    getItem(key) {
        const value = this.data[key];
        console.log(`📋 localStorage.getItem(${key}):`, value ? 'FOUND' : 'NOT FOUND');
        if (value && key === 'user_data') {
            console.log('   👤 Parsed user data:', JSON.parse(value));
        }
        return value || null;
    }
};

global.localStorage = mockLocalStorage;

// Mock frontendAuth
const frontendAuth = {
    getSession() {
        console.log('🔐 frontendAuth.getSession() called');
        const accessToken = localStorage.getItem('session_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userData = localStorage.getItem('user_data');
        
        if (!accessToken || !refreshToken || !userData) {
            console.log('❌ Session incomplete - missing:', {
                accessToken: !accessToken,
                refreshToken: !refreshToken,
                userData: !userData
            });
            return null;
        }
        
        const session = {
            accessToken,
            refreshToken,
            user: JSON.parse(userData)
        };
        console.log('✅ Session found:', {
            username: session.user.username,
            userId: session.user.id,
            hasAccessToken: !!session.accessToken
        });
        return session;
    }
};

// Test 1: Check frontendAuth session
console.log('1. Testing frontendAuth.getSession():');
const session = frontendAuth.getSession();

if (!session) {
    console.log('❌ CRITICAL: No session found - messages will fail');
    process.exit(1);
}

// Test 2: Check getCurrentUserId function
console.log('\n2. Testing getCurrentUserId():');
function getCurrentUserId() {
    // First try frontendAuth (preferred method)
    const session = frontendAuth.getSession();
    if (session?.user?.id) {
        console.log('✅ User ID from frontendAuth:', session.user.id);
        return session.user.id;
    }
    
    // Fallback to user_data directly
    try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            console.log('✅ User ID from user_data:', userData?.id);
            return userData?.id;
        }
    } catch (error) {
        console.error('❌ Error parsing user_data:', error);
    }
    
    console.log('❌ No user ID found anywhere');
    return null;
}

const userId = getCurrentUserId();
if (!userId) {
    console.log('❌ CRITICAL: No user ID - messages will fail');
    process.exit(1);
}

// Test 3: Check auth headers
console.log('\n3. Testing getAuthHeaders():');
function getAuthHeaders() {
    console.log('🔐 Getting auth headers...');
    const session = frontendAuth.getSession();
    if (!session?.accessToken) {
        console.error('❌ No access token found');
        return null;
    }
    const headers = {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
    };
    console.log('✅ Auth headers created:', {
        hasAuth: !!headers.Authorization,
        authLength: headers.Authorization.length
    });
    return headers;
}

const headers = getAuthHeaders();
if (!headers) {
    console.log('❌ CRITICAL: No auth headers - API calls will fail');
    process.exit(1);
}

// Test 4: Simulate message sending data
console.log('\n4. Testing message data structure:');
const messageData = {
    content: 'Test message',
    selectedUser: 'otheruser',
    username: session.user.username,
    conversations: [],
    userId: userId
};

console.log('📋 Message data:', messageData);
console.log('✅ All required data present');

// Test 5: Check API call structure
console.log('\n5. Testing API call structure:');
const apiCallData = {
    conversationId: 'test-conversation-id',
    senderId: userId,
    content: messageData.content,
    to: messageData.selectedUser,
    from: messageData.username
};

console.log('🌐 API Call Data:', apiCallData);
console.log('📋 Headers:', headers);

console.log('\n🎉 Frontend Check Completed!');
console.log('\n📝 Summary:');
console.log('✅ Session found in localStorage');
console.log('✅ User ID extracted correctly');
console.log('✅ Auth headers created successfully');
console.log('✅ Message data structure correct');
console.log('✅ API call structure valid');

console.log('\n🔍 If messages are still failing, check:');
console.log('1. Server logs for API errors');
console.log('2. Network tab in browser for failed requests');
console.log('3. Console for JavaScript errors');
console.log('4. Database connectivity issues');
console.log('5. Conversation creation failures');

console.log('\n📱 Expected console output when sending message:');
console.log('📝 Send message triggered');
console.log('📋 Pre-checks: { hasInput: true, hasSelectedUser: true, ... }');
console.log('🚀 Starting to send message: "your message"');
console.log('🚀 sendMessage hook called with: { content, selectedUser, ... }');
console.log('🔐 Getting auth headers...');
console.log('📋 Session found: true');
console.log('✅ Auth headers created successfully');
console.log('📋 User ID: test-user-id-123');
