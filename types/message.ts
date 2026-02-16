export interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    replyTo?: Message;
    isPinned?: boolean;
    isHidden?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    isVoiceMessage?: boolean;
    isEdited?: boolean;
    // Chunking metadata
    groupId?: string;
    chunkIndex?: number;
    totalChunks?: number;
    isDeleted?: boolean;
    // Failed message tracking
    retryCount?: number;
    lastRetryTime?: Date;
    // Additional properties for failed message handling
    conversationId?: string | null;
    senderId?: string | null;
    // Additional properties for MessageList compatibility
    content?: string;
    reactions?: Record<string, string[]>;
}
