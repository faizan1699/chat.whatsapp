// Script to check for unsent/failed messages in the chat application
// Run this in the browser console on the chat page

(function checkUnsentMessages() {
    console.log('🔍 Checking for unsent messages...');
    
    // Check localStorage for failed messages
    const failedMessages = localStorage.getItem('webrtc-chat-failedMessages');
    if (failedMessages) {
        try {
            const parsed = JSON.parse(failedMessages);
            console.log('❌ Failed messages in localStorage:', parsed);
            console.log(`Found ${parsed.length} failed messages`);
        } catch (e) {
            console.log('❌ Error parsing failed messages:', e);
        }
    } else {
        console.log('✅ No failed messages in localStorage');
    }
    
    // Check current message state in React
    // This requires access to the React component internals
    const messageElements = document.querySelectorAll('[id^="msg-"]');
    let failedCount = 0;
    let sendingCount = 0;
    let pendingCount = 0;
    
    messageElements.forEach(element => {
        const text = element.textContent || '';
        if (text.includes('Failed to send')) {
            failedCount++;
        }
        const statusIcon = element.querySelector('.animate-spin');
        if (statusIcon) {
            sendingCount++;
        }
    });
    
    console.log(`📊 Message status summary:`);
    console.log(`  - Failed messages: ${failedCount}`);
    console.log(`  - Sending messages: ${sendingCount}`);
    console.log(`  - Pending messages: ${pendingCount}`);
    
    // Check network connectivity
    console.log(`🌐 Network status:`, navigator.onLine ? 'Online' : 'Offline');
    
    // Check WebSocket connection if available
    if (window.socket) {
        console.log(`🔌 Socket status:`, window.socket.connected ? 'Connected' : 'Disconnected');
    }
    
    // Check for any error messages in console
    console.log(`💡 To manually retry failed messages, click the "Failed to send. Click to retry." button or use the retry functionality.`);
    
    return {
        failedMessages: failedMessages ? JSON.parse(failedMessages) : [],
        failedCount,
        sendingCount,
        pendingCount,
        isOnline: navigator.onLine
    };
})();
