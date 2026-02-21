export interface ReplyTo {
    id?: string;
    from: string;
    message: string;
}

export interface Message {
    id?: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
    status?: 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    replyTo?: ReplyTo;
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
    isDeletedFromMe?: Record<string, boolean>; // Store user IDs who deleted this message for themselves
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
