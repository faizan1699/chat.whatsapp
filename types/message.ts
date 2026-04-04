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
    replyToMessageId?: string;
    isPinned?: boolean;
    pinnedBy?: string;
    isHidden?: boolean;
    hideFromAll?: boolean;
    audioUrl?: string;
    audioDuration?: number;
    isVoiceMessage?: boolean;
    isEdited?: boolean;
    groupId?: string;
    chunkIndex?: number;
    totalChunks?: number;
    isDeleted?: boolean;
    retryCount?: number;
    lastRetryTime?: Date;
    conversationId?: string | null;
    senderId?: string | null;
    content?: string;
    reactions?: Record<string, string[]>;
    file?: {
        url: string;
        filename: string;
        size: number;
        type: string;
        isImage: boolean;
        caption?: string;
    };
}
