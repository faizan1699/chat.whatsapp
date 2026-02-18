// Conversation Debug Test - Run this in browser console to debug conversation loading

// Test function to verify conversation data flow
export const debugConversationFlow = () => {
    console.log('=== DEBUGGING CONVERSATION FLOW ===');
    
    // Check current state
    const conversations = window.conversationsState || [];
    const selectedUser = window.selectedUser || '';
    
    console.log('1. Current conversations count:', conversations.length);
    console.log('2. Selected user:', selectedUser);
    
    // Find conversation for selected user
    const currentConversation = conversations.find(c => 
        c.participants && c.participants.some(p => p.user.username === selectedUser)
    );
    
    console.log('3. Found conversation:', currentConversation ? {
        id: currentConversation.id,
        hasParticipants: currentConversation.participants?.length || 0
    } : 'NOT FOUND');
    
    // Check if conversation has proper structure
    if (currentConversation) {
        console.log('4. Conversation structure OK ✅');
        console.log('5. Participants:', currentConversation.participants?.map(p => p.user.username));
    } else {
        console.log('❌ Conversation NOT FOUND - This is the issue!');
    }
    
    console.log('=== END DEBUG ===');
    
    return {
        conversations,
        selectedUser,
        currentConversation
    };
};

// Make function globally available
if (typeof window !== 'undefined') {
    window.debugConversationFlow = debugConversationFlow;
    console.log('🔧 Debug function loaded! Run debugConversationFlow() in console');
}
