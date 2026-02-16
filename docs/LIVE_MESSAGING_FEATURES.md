# 💬 Live Messaging Features Documentation

## 📋 Overview

This document details the live messaging features of the Next.js WebRTC Chat Application, covering real-time communication, message handling, and user interactions.

## 🚀 Core Messaging Architecture

### Real-time Communication Stack

```typescript
// Socket.IO Configuration
const socketConfig = {
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
  timeout: 5000,
  forceNew: true,
};

// Connection Management
class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      ...socketConfig,
      auth: { token },
    });
    
    this.setupEventListeners();
    this.setupReconnectLogic();
  }
  
  private setupEventListeners() {
    this.socket?.on('connect', () => {
      console.log('Connected to server');
      this.reconnectAttempts = 0;
    });
    
    this.socket?.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.handleReconnect();
    });
    
    this.socket?.on('message-received', this.handleNewMessage);
    this.socket?.on('message-status-updated', this.handleMessageStatus);
    this.socket?.on('user-typing', this.handleTypingIndicator);
    this.socket?.on('user-online-status', this.handleOnlineStatus);
  }
}
```

### Message Flow Architecture

```typescript
// Message Sending Flow
1. User types message → 2. Client validation → 3. Redux action
4. Socket emit → 5. Server processing → 6. Database storage
7. Broadcast to receiver → 8. Update UI

// Message Types
interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  status: MessageStatus;
  metadata: MessageMetadata;
  createdAt: Date;
  updatedAt: Date;
}

enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  VOICE_NOTE = 'VOICE_NOTE',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
}

enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}
```

## 🎨 User Interface Components

### Message Input Component

```typescript
// ChatFooter.tsx - Enhanced message input
interface ChatFooterProps {
  onSendMessage: (content: string, type: MessageType) => void;
  onTyping: (isTyping: boolean) => void;
  onVoiceRecord: () => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  onSendMessage,
  onTyping,
  onVoiceRecord,
  onFileUpload,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Send typing indicator
    onTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing indicator after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };
  
  // Send message
  const handleSend = () => {
    if (message.trim() || uploadedFiles.length > 0) {
      onSendMessage(message.trim(), MessageType.TEXT);
      setMessage('');
      setUploadedFiles([]);
      setShowEmojiPicker(false);
      onTyping(false);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };
  
  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    files.forEach(file => onFileUpload(file));
  };
  
  // Handle voice recording
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    onVoiceRecord();
  };
  
  return (
    <div className="chat-footer border-t bg-white p-4">
      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="file-preview mb-2">
          {uploadedFiles.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => {
                setUploadedFiles(prev => prev.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 rounded-full"
          disabled={disabled}
        >
          <PaperclipIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Message Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={disabled}
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>
        
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 hover:bg-gray-100 rounded-full"
          disabled={disabled}
        >
          <SmileIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Voice Record Button */}
        <button
          onClick={handleVoiceRecord}
          className={`p-2 rounded-full ${
            isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          {isRecording ? (
            <StopIcon className="w-5 h-5" />
          ) : (
            <MicrophoneIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && uploadedFiles.length === 0)}
          className="p-2 bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
```

### Message Display Component

```typescript
// MessageItem.tsx - Enhanced message display
interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  sender: User;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onForward: (messageId: string) => void;
  onPin: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  sender,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onForward,
  onPin,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiReactions, setShowEmojiReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  
  // Format message time
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };
  
  // Handle message actions
  const handleEdit = () => {
    if (isOwn) {
      setIsEditing(true);
      setShowActions(false);
    }
  };
  
  const handleSaveEdit = () => {
    onEdit(message.id, editContent);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    onDelete(message.id);
    setShowActions(false);
  };
  
  const handleReact = (emoji: string) => {
    onReact(message.id, emoji);
    setShowEmojiReactions(false);
  };
  
  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md`}>
        {/* Sender Info (for received messages) */}
        {!isOwn && (
          <div className="flex items-center mb-1">
            <Avatar
              src={sender.avatar}
              alt={sender.username}
              size="sm"
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              {sender.username}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}
        
        {/* Message Bubble */}
        <div
          className={`
            relative px-4 py-2 rounded-2xl
            ${isOwn
              ? 'bg-primary text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }
            ${message.isDeleted ? 'opacity-60' : ''}
          `}
        >
          {/* Reply Reference */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-black bg-opacity-10 rounded-lg">
              <div className="text-xs opacity-75">Replying to</div>
              <div className="text-sm truncate">
                {message.replyTo.content}
              </div>
            </div>
          )}
          
          {/* Message Content */}
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 px-2 py-1 bg-white bg-opacity-20 rounded text-white placeholder-white placeholder-opacity-70"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="text-white hover:text-green-300"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="text-white hover:text-red-300"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {message.isDeleted ? (
                <span className="italic">This message was deleted</span>
              ) : (
                <MessageContent message={message} />
              )}
              
              {/* Message Status */}
              {isOwn && (
                <div className="flex items-center justify-end mt-1 space-x-1">
                  {message.isEdited && (
                    <span className="text-xs opacity-75">(edited)</span>
                  )}
                  <MessageStatus status={message.status} />
                  <span className="text-xs opacity-75">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Message Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap mt-1 space-x-1">
            {Object.entries(message.reactions).map(([userId, emoji]) => (
              <div
                key={userId}
                className="flex items-center space-x-1 bg-gray-200 rounded-full px-2 py-1"
              >
                <span>{emoji}</span>
                <span className="text-xs">1</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Message Actions */}
        {showActions && !message.isDeleted && (
          <div className="absolute top-0 right-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isOwn && (
              <>
                <button
                  onClick={handleEdit}
                  className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <EditIcon className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <TrashIcon className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
            <button
              onClick={() => onReply(message.id)}
              className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <ReplyIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onForward(message.id)}
              className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <ForwardIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onPin(message.id)}
              className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <PinIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setShowEmojiReactions(!showEmojiReactions)}
              className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              <SmileIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
        
        {/* Emoji Reaction Picker */}
        {showEmojiReactions && (
          <div className="absolute bottom-full mb-2 right-0 z-50">
            <EmojiReactionPicker
              onEmojiSelect={handleReact}
              onClose={() => setShowEmojiReactions(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
```

## 🔄 Real-time Features

### Typing Indicators

```typescript
// TypingIndicator.tsx
interface TypingIndicatorProps {
  users: User[];
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users, isVisible }) => {
  if (!isVisible || users.length === 0) return null;
  
  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].username} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].username} and ${users[1].username} are typing...`;
    } else {
      return `${users.length} people are typing...`;
    }
  };
  
  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

// Hook for managing typing indicators
const useTypingIndicator = (socket: Socket, currentUserId: string) => {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const sendTypingIndicator = (isTyping: boolean, receiverId: string) => {
    socket.emit('typing', {
      isTyping,
      receiverId,
      senderId: currentUserId,
    });
  };
  
  useEffect(() => {
    socket.on('user-typing', ({ userId, isTyping, user }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return [...prev.filter(u => u.id !== userId), user];
        } else {
          return prev.filter(u => u.id !== userId);
        }
      });
    });
    
    return () => {
      socket.off('user-typing');
    };
  }, [socket]);
  
  return {
    typingUsers,
    sendTypingIndicator,
  };
};
```

### Online Status Management

```typescript
// OnlineStatus.tsx
interface OnlineStatusProps {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
  showText?: boolean;
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({
  userId,
  isOnline,
  lastSeen,
  showText = false,
}) => {
  const getStatusText = () => {
    if (isOnline) return 'Online';
    
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(lastSeen);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className={`
          w-3 h-3 rounded-full
          ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
        `} />
        {isOnline && (
          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        )}
      </div>
      {showText && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

// Hook for managing online status
const useOnlineStatus = (socket: Socket) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    socket.on('user-online', (userId: string) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });
    
    socket.on('user-offline', (userId: string) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    
    socket.on('online-users', (users: string[]) => {
      setOnlineUsers(new Set(users));
    });
    
    return () => {
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('online-users');
    };
  }, [socket]);
  
  const isUserOnline = (userId: string) => onlineUsers.has(userId);
  
  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
  };
};
```

## 📱 Message Types Implementation

### Voice Messages

```typescript
// VoiceMessage.tsx
interface VoiceMessageProps {
  message: Message;
  isOwn: boolean;
  onPlay: () => void;
  onPause: () => void;
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({
  message,
  isOwn,
  onPlay,
  onPause,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };
    
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [message.content]);
  
  const togglePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`
      flex items-center space-x-3 p-3 rounded-lg
      ${isOwn ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}
    `}>
      <audio ref={audioRef} src={message.content} />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="p-2 rounded-full hover:bg-black hover:bg-opacity-10"
      >
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5" />
        )}
      </button>
      
      {/* Waveform Visualization */}
      <div className="flex-1">
        <VoiceWaveform
          audioUrl={message.content}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />
      </div>
      
      {/* Duration */}
      <span className="text-sm opacity-75">
        {formatTime(duration)}
      </span>
    </div>
  );
};
```

### Image Messages

```typescript
// ImageMessage.tsx
interface ImageMessageProps {
  message: Message;
  isOwn: boolean;
  onImageClick: (imageUrl: string) => void;
}

const ImageMessage: React.FC<ImageMessageProps> = ({
  message,
  isOwn,
  onImageClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleImageClick = () => {
    setShowPreview(true);
    onImageClick(message.content);
  };
  
  return (
    <>
      <div className={`
        relative rounded-lg overflow-hidden cursor-pointer
        ${isOwn ? 'bg-primary' : 'bg-gray-100'}
      `}>
        {!imageLoaded && (
          <div className="w-64 h-48 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        
        <img
          src={message.content}
          alt="Shared image"
          className={`
            max-w-xs rounded-lg
            ${imageLoaded ? 'block' : 'hidden'}
          `}
          onLoad={() => setImageLoaded(true)}
          onClick={handleImageClick}
        />
        
        {/* Image Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
          <ZoomInIcon className="w-6 h-6 text-white opacity-0 hover:opacity-100" />
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {showPreview && (
        <ImagePreview
          imageUrl={message.content}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
```

## 🔔 Notification System

### Message Notifications

```typescript
// NotificationService.ts
class NotificationService {
  private permission: NotificationPermission = 'default';
  
  constructor() {
    this.requestPermission();
  }
  
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }
    return false;
  }
  
  showNotification(message: Message, sender: User) {
    if (this.permission !== 'granted') return;
    
    const notification = new Notification(`${sender.username}`, {
      body: this.getNotificationBody(message),
      icon: sender.avatar || '/default-avatar.png',
      badge: '/favicon.ico',
      tag: message.id,
      requireInteraction: false,
      silent: false,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to chat
      this.navigateToChat(sender.id);
    };
    
    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
  
  private getNotificationBody(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content;
      case MessageType.IMAGE:
        return '📷 Photo';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.AUDIO:
        return '🎵 Audio';
      case MessageType.VOICE_NOTE:
        return '🎤 Voice message';
      case MessageType.DOCUMENT:
        return '📄 Document';
      default:
        return 'New message';
    }
  }
  
  private navigateToChat(userId: string) {
    // Implementation for navigation
    window.location.href = `/chat?user=${userId}`;
  }
}

// Hook for notifications
const useNotifications = () => {
  const notificationService = useRef(new NotificationService());
  const { user } = useAuth();
  
  const showNewMessageNotification = useCallback((
    message: Message,
    sender: User
  ) => {
    // Only show notification if user is not active in chat
    if (document.hidden || !isActiveChat(sender.id)) {
      notificationService.current.showNotification(message, sender);
    }
  }, []);
  
  return {
    showNewMessageNotification,
  };
};
```

## 🔍 Search and Filtering

### Message Search

```typescript
// MessageSearch.tsx
interface MessageSearchProps {
  onSearch: (query: string) => void;
  onFilter: (filters: MessageFilters) => void;
}

interface MessageFilters {
  messageType?: MessageType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sender?: string;
  hasMedia?: boolean;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  onSearch,
  onFilter,
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MessageFilters>({});
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  
  const handleSearch = debounce((searchQuery: string) => {
    onSearch(searchQuery);
  }, 300);
  
  const handleFilterChange = (newFilters: MessageFilters) => {
    setFilters(newFilters);
    onFilter(newFilters);
  };
  
  return (
    <div className="message-search p-4 border-b">
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Search messages..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="mt-2 flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <FilterIcon className="w-4 h-4" />
        <span>Filters</span>
      </button>
      
      {/* Filter Options */}
      {showFilters && (
        <MessageFilters
          filters={filters}
          onChange={handleFilterChange}
        />
      )}
      
      {/* Search Results */}
      {searchResults.length > 0 && (
        <SearchResults
          results={searchResults}
          query={query}
          onSelectMessage={(messageId) => {
            // Navigate to message
            navigateToMessage(messageId);
          }}
        />
      )}
    </div>
  );
};
```

## 📊 Message Analytics

### Message Statistics

```typescript
// MessageAnalytics.tsx
interface MessageAnalyticsProps {
  conversationId: string;
}

const MessageAnalytics: React.FC<MessageAnalyticsProps> = ({
  conversationId,
}) => {
  const [analytics, setAnalytics] = useState<MessageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await messageService.getAnalytics(conversationId);
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [conversationId]);
  
  if (loading) return <LoadingSpinner />;
  if (!analytics) return <div>No analytics available</div>;
  
  return (
    <div className="message-analytics p-4">
      <h3 className="text-lg font-semibold mb-4">Chat Statistics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {analytics.totalMessages}
          </div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {analytics.mediaCount}
          </div>
          <div className="text-sm text-gray-600">Media Shared</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {analytics.averageResponseTime}
          </div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {analytics.mostActiveHour}
          </div>
          <div className="text-sm text-gray-600">Most Active Hour</div>
        </div>
      </div>
      
      {/* Message Type Distribution */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Message Types</h4>
        <MessageTypeDistribution data={analytics.messageTypeDistribution} />
      </div>
      
      {/* Activity Timeline */}
      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Activity Timeline</h4>
        <ActivityTimeline data={analytics.activityTimeline} />
      </div>
    </div>
  );
};
```

## 🎯 Performance Optimizations

### Message Virtualization

```typescript
// VirtualizedMessageList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedMessageListProps {
  messages: Message[];
  onMessageAction: (action: MessageAction) => void;
}

const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> = ({
  messages,
  onMessageAction,
}) => {
  const listRef = useRef<List>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1);
    }
  }, [messages.length]);
  
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    const isOwn = message.senderId === currentUserId;
    
    return (
      <div style={style}>
        <MessageItem
          message={message}
          isOwn={isOwn}
          onAction={onMessageAction}
        />
      </div>
    );
  };
  
  return (
    <div className="virtualized-message-list">
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={messages.length}
        itemSize={120} // Approximate height of each message
        overscanCount={5} // Render 5 extra items above/below
      >
        {Row}
      </List>
    </div>
  );
};
```

### Message Caching

```typescript
// MessageCache.ts
class MessageCache {
  private cache = new Map<string, Message[]>();
  private maxCacheSize = 100;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  set(conversationId: string, messages: Message[]) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(conversationId, {
      messages,
      timestamp: Date.now(),
    });
  }
  
  get(conversationId: string): Message[] | null {
    const cached = this.cache.get(conversationId);
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(conversationId);
      return null;
    }
    
    return cached.messages;
  }
  
  clear() {
    this.cache.clear();
  }
  
  invalidate(conversationId: string) {
    this.cache.delete(conversationId);
  }
}

// Hook for using message cache
const useMessageCache = () => {
  const cache = useRef(new MessageCache());
  
  const getCachedMessages = useCallback((conversationId: string) => {
    return cache.current.get(conversationId);
  }, []);
  
  const setCachedMessages = useCallback((conversationId: string, messages: Message[]) => {
    cache.current.set(conversationId, messages);
  }, []);
  
  const invalidateCache = useCallback((conversationId: string) => {
    cache.current.invalidate(conversationId);
  }, []);
  
  return {
    getCachedMessages,
    setCachedMessages,
    invalidateCache,
  };
};
```

This comprehensive live messaging documentation covers all the essential features and implementations needed for a modern, real-time messaging application similar to WhatsApp Web.
