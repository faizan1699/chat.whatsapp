// Temporary debugging script for conversation loading issue
// Add this script tag to the bottom of your chat page body, just before the closing </body> tag

console.log('🔧 DEBUG SCRIPT LOADED');

// Override the chat page's loadMessages function to add debugging
if (typeof window !== 'undefined') {
    const originalLoadMessages = window.loadMessages;
    
    window.loadMessages = async function(selectedUsername) {
        console.log('🔧 DEBUG: loadMessages called with:', selectedUsername);
        console.log('🔧 DEBUG: Current conversations:', window.conversations?.length || 0);
        
        // Call the original function
        const result = await originalLoadMessages.call(this, selectedUsername);
        
        // Add debugging logs
        const currentConversation = window.conversations?.find(c => 
            c.participants && c.participants.some((p: any) => p.user.username === selectedUsername)
        );
        
        console.log('🔧 DEBUG: Found conversation:', currentConversation ? {
            id: currentConversation.id,
            hasParticipants: currentConversation.participants?.length || 0
        } : 'NOT FOUND');
        
        console.log('🔧 DEBUG: About to call setIsMessagesLoading(true)');
        
        // Call the rest of the original function
        window.setIsMessagesLoading(true);
        
        try {
            // Your existing loadMessages logic here...
            const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.frontendAuth?.getSession()?.accessToken || ''}`
                }
            });
            
            if (response.ok) {
                const messagesData = await response.json();
                console.log('🔧 DEBUG: Messages API loaded:', messagesData.length);
                
                const formattedMessages = messagesData
                    .filter((msg: any) => {
                        // Filter out messages deleted for everyone
                        if (msg.is_deleted) return false;
                        
                        // Filter out messages deleted by current user
                        const deletedFromMe = msg.is_deleted_from_me as Record<string, boolean> || {};
                        if (deletedFromMe[window.username]) return false;
                        
                        return true;
                    })
                    .map((msg: any) => ({
                        id: msg.id,
                        from: msg.sender?.username || 'Unknown',
                        to: msg.sender?.username === window.username ? selectedUsername : window.username,
                        message: msg.content,
                        timestamp: msg.timestamp,
                        status: msg.status,
                        // Add the missing fields that the chat page expects
                        isDeletedFromMe: msg.is_deleted_from_me || {}
                    }));
                
                console.log('🔧 DEBUG: Formatted messages:', formattedMessages.length);
                window.setMessages(formattedMessages);
                window.setIsMessagesLoading(false);
                
                console.log('🔧 DEBUG: loadMessages completed successfully');
            } else {
                console.error('🔧 DEBUG: Failed to load messages');
                window.setIsMessagesLoading(false);
            }
        } catch (error) {
            console.error('🔧 DEBUG: Error in loadMessages:', error);
            window.setIsMessagesLoading(false);
        }
        
        return result;
    };
    
    console.log('🔧 DEBUG: loadMessages function overridden with debugging');
}
