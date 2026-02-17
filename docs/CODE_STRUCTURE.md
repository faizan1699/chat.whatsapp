# 🏗️ Code Structure Architecture

## 📋 Overview

This document outlines the complete code structure of the Next.js WebRTC Chat Application, detailing the architecture patterns, component hierarchy, and data flow.

## 🗂️ Directory Structure

```
nextjs-webrtc-app/
├── app/                           # Next.js 14 App Router
│   ├── api/                       # API Routes
│   │   ├── auth/                  # Authentication endpoints
│   │   └── protected/             # Protected routes
│   ├── auth/                      # Authentication pages
│   │   └── reset-password/        # Password reset flow
│   ├── chat/                      # Chat interfaces
│   │   ├── clean/                 # Clean chat variant
│   │   ├── secure/                # Secure chat variant
│   │   ├── page.tsx               # Main chat page
│   │   └── page.tsx.backup        # Backup version
│   ├── faq/                       # FAQ section
│   │   └── page.tsx
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Homepage
│   ├── legal/                     # Legal pages
│   ├── login/                     # Login pages
│   └── pricing/                   # Pricing pages
├── assets/                        # Static assets
│   ├── ringtones/                 # Audio files
│   │   └── ringtone.mp3
│   └── svg/                       # SVG icons
│       ├── end-call.tsx
│       ├── mic-off.tsx
│       ├── mic.tsx
│       ├── phone-call.tsx
│       └── video.tsx
├── components/                    # React components
│   ├── VideoCall.tsx              # Main video call component
│   ├── audio/                     # Audio components
│   │   ├── AudioCall.tsx          # Audio call interface
│   │   └── VoiceRecorder.tsx       # Voice message recorder
│   ├── chat/                      # Chat components
│   │   ├── ChatFooter.tsx         # Chat input area
│   │   ├── ChatHeader.tsx         # Chat header
│   │   ├── EmptyChatState.tsx     # Empty chat display
│   │   ├── MessageItem.tsx        # Individual message
│   │   ├── MessageList.tsx        # Message list container
│   │   └── MessageStatus.tsx      # Message status indicators
│   ├── global/                    # Global components
│   │   ├── AuthOverlay.tsx        # Authentication modal
│   │   ├── CookieConsentBanner.tsx # GDPR compliance
│   │   ├── CustomToast.tsx        # Toast notifications
│   │   ├── EditProfileModal.tsx   # Profile editing
│   │   ├── IncomingCallModal.tsx  # Incoming call UI
│   │   ├── LoadingSpinner.tsx     # Loading states
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── ThemeToggle.tsx        # Theme switcher
│   │   ├── UsernameEntry.tsx      # Username input
│   │   └── index.ts               # Component exports
│   └── video/                     # Video components
│       ├── CallControls.tsx       # Call control buttons
│       ├── CallNotification.tsx   # Call notifications
│       ├── CallOverlay.tsx        # Call interface overlay
│       └── VideoGrid.tsx          # Video grid layout
├── hooks/                         # Custom React hooks
│   ├── useMessageApi.ts           # Message API hook
│   └── useSocket.ts               # Socket.IO connection hook
├── lib/                           # Library files
│   ├── auth-server.ts             # Server-side auth
│   └── jwt.ts                     # JWT utilities
├── models/                        # Data models (empty)
├── pages/                         # Pages API routes
│   └── api/                       # Legacy API endpoints
│       ├── auth/                  # Auth endpoints
│       ├── conversations/         # Conversation management
│       ├── messages/              # Message handling
│       └── socket.ts              # Socket.IO server
├── services/                      # External services
│   ├── apiService.ts              # API service layer
│   ├── consentService.ts          # Cookie consent
│   ├── otpService.ts              # OTP handling
│   └── whatsappService.ts         # WhatsApp integration
├── store/                         # Redux store
│   ├── Provider.tsx               # Redux provider
│   ├── index.ts                   # Store configuration
│   └── slices/                    # Redux slices
│       ├── authSlice.ts           # Authentication state
│       ├── callSlice.ts           # Call state
│       └── chatSlice.ts           # Chat state
├── supabase/                      # Database configuration
│   ├── migrations/                # Database migrations
│   ├── .gitignore                 # Git ignore file
│   └── config.toml                # Supabase config
├── types/                         # TypeScript definitions
│   └── emoji-picker-react.d.ts    # Emoji picker types
├── utils/                         # Utility functions
│   ├── api.ts                     # API utilities
│   ├── apiExamples.ts             # API examples
│   ├── auth.ts                    # Auth utilities
│   ├── cookieConsent.ts           # Cookie utilities
│   ├── encryption.ts              # Encryption helpers
│   ├── messageUtils.ts            # Message helpers
│   ├── socketHelpers.ts           # Socket helpers
│   ├── storage.ts                 # Local storage
│   ├── validation.ts              # Form validation
│   └── webrtc.ts                  # WebRTC utilities
├── docs/                          # Documentation
│   ├── SITE_EXAMINATION.md        # Site analysis
│   ├── WHATSAPP_FEATURES.md       # Feature analysis
│   ├── CODE_STRUCTURE.md          # This file
│   ├── REDUX_ARCHITECTURE.md      # Redux documentation
│   └── AGENT_RULES.md             # Development guidelines
├── public/                        # Public assets
│   ├── assets/                    # Static assets
│   └── images/                    # Image files
├── .env                           # Environment variables
├── .gitignore                     # Git ignore rules
├── FLOW.md                        # Application flow
├── README.md                      # Project documentation
├── envConfig.ts                   # Environment config
├── middleware.ts                  # Next.js middleware
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.js              # PostCSS config
├── supabase-schema.sql            # Database schema
├── tailwind.config.js             # Tailwind config
├── tsconfig.json                  # TypeScript config
└── test-*.js                      # Test files
```

## 🧩 Component Architecture

### Component Hierarchy

```
App Layout (layout.tsx)
├── Global Components
│   ├── ThemeToggle
│   ├── CookieConsentBanner
│   └── CustomToast
├── AuthOverlay (conditional)
├── Page Components
│   ├── Homepage (page.tsx)
│   ├── Chat Pages
│   │   ├── Chat Interface (chat/page.tsx)
│   │   │   ├── ChatHeader
│   │   │   ├── MessageList
│   │   │   │   └── MessageItem[]
│   │   │   └── ChatFooter
│   │   ├── Clean Chat (chat/clean/page.tsx)
│   │   └── Secure Chat (chat/secure/page.tsx)
│   ├── Auth Pages
│   │   ├── Login
│   │   └── Reset Password
│   └── Other Pages
│       ├── FAQ
│       ├── Pricing
│       └── Legal
└── VideoCall (overlay)
    ├── CallControls
    ├── CallNotification
    └── CallOverlay
```

### Component Patterns

#### 1. Container/Presentation Pattern
```typescript
// Container Component (logic)
const ChatContainer = () => {
  const { messages, sendMessage } = useChat();
  return <ChatList messages={messages} onSend={sendMessage} />;
};

// Presentation Component (UI)
const ChatList = ({ messages, onSend }) => (
  <div>
    {messages.map(msg => <MessageItem key={msg.id} {...msg} />}
    <MessageInput onSend={onSend} />
  </div>
);
```

#### 2. Custom Hooks Pattern
```typescript
// Custom hook for socket connection
const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const socketInstance = io();
    setSocket(socketInstance);
    
    socketInstance.on('connect', () => setConnected(true));
    
    return () => socketInstance.disconnect();
  }, []);
  
  return { socket, connected };
};
```

#### 3. Higher-Order Component Pattern
```typescript
// HOC for authentication
const withAuth = (Component) => {
  return (props) => {
    const { user } = useSelector(state => state.auth);
    
    if (!user) {
      return <AuthOverlay />;
    }
    
    return <Component {...props} />;
  };
};
```

## 🗃️ State Management Architecture

### Redux Store Structure

```typescript
interface RootState {
  auth: AuthState;
  chat: ChatState;
  call: CallState;
}

// Auth Slice
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Chat Slice
interface ChatState {
  messages: Message[];
  conversations: Conversation[];
  activeConversation: string | null;
  typing: Record<string, boolean>;
  onlineUsers: string[];
}

// Call Slice
interface CallState {
  isCallActive: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callTimer: number;
  connectionState: 'connecting' | 'connected' | 'disconnected';
  isMuted: boolean;
  isVideoOn: boolean;
}
```

### State Flow Pattern

```
User Action → Dispatch Action → Reducer → State Update → Component Re-render
     ↓
Socket Event → Action Creator → Dispatch → State Update → UI Update
```

## 🔌 API Architecture

### API Layer Structure

```typescript
// Service Layer
class ApiService {
  private axiosInstance: AxiosInstance;
  
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  // API Methods
  async sendMessage(message: Message): Promise<Message> {
    const response = await this.axiosInstance.post('/messages', message);
    return response.data;
  }
  
  async getConversations(): Promise<Conversation[]> {
    const response = await this.axiosInstance.get('/conversations');
    return response.data;
  }
}
```

### Socket.IO Architecture

```typescript
// Socket Events
interface SocketEvents {
  // Client → Server
  'send-message': (message: Message) => void;
  'join-room': (roomId: string) => void;
  'offer': (offer: RTCSessionDescriptionInit) => void;
  'answer': (answer: RTCSessionDescriptionInit) => void;
  'ice-candidate': (candidate: RTCIceCandidate) => void;
  
  // Server → Client
  'message-received': (message: Message) => void;
  'user-joined': (user: User) => void;
  'user-left': (user: User) => void;
  'incoming-call': (call: CallData) => void;
  'call-accepted': () => void;
}
```

## 🎨 UI Architecture

### Theme System

```typescript
// Theme Configuration
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
  };
}

// Tailwind Configuration
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#075E54',
        secondary: '#128C7E',
        background: '#ECE5DD',
        surface: '#FFFFFF',
      },
    },
  },
};
```

### Component Styling Pattern

```typescript
// Styled Components with Tailwind
const MessageItem = ({ message, isOwn }) => (
  <div className={`
    flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2
  `}>
    <div className={`
      max-w-xs lg:max-w-md px-4 py-2 rounded-lg
      ${isOwn 
        ? 'bg-primary text-white' 
        : 'bg-white text-gray-800'
      }
    `}>
      <p className="text-sm">{message.content}</p>
      <MessageStatus status={message.status} />
    </div>
  </div>
);
```

## 🔐 Security Architecture

### Authentication Flow

```typescript
// JWT Authentication
interface AuthFlow {
  1. User Login → 
  2. Server Validation → 
  3. JWT Token Generation → 
  4. Cookie Storage → 
  5. Protected Route Access
}

// Middleware Protection
const withAuth = (handler) => {
  return async (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};
```

## 📡 Real-time Architecture

### WebRTC Implementation

```typescript
// WebRTC Connection Setup
class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream;
  private remoteStream: MediaStream;
  
  async initializeCall(): Promise<void> {
    // Get user media
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    
    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
      ],
    });
    
    // Add local stream
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };
  }
}
```

### Socket.IO Real-time Events

```typescript
// Socket Service
class SocketService {
  private socket: Socket;
  
  connect(token: string): void {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.socket.on('message-received', (message: Message) => {
      store.dispatch(chatSlice.actions.addMessage(message));
    });
    
    this.socket.on('user-typing', (data: TypingData) => {
      store.dispatch(chatSlice.actions.setTyping(data));
    });
    
    this.socket.on('incoming-call', (callData: CallData) => {
      store.dispatch(callSlice.actions.setIncomingCall(callData));
    });
  }
}
```

## 🗄️ Database Architecture

### Prisma Schema

```prisma
// User Model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  phone     String?  @unique
  username  String   @unique
  password  String
  avatar    String?
  isOnline  Boolean  @default(false)
  lastSeen  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  messages      Message[]
  conversations Conversation[]
}

// Message Model
model Message {
  id          String   @id @default(cuid())
  content     String
  senderId    String
  receiverId  String
  type        MessageType @default(TEXT)
  status      MessageStatus @default(PENDING)
  isDeleted   Boolean  @default(false)
  isEdited    Boolean  @default(false)
  isPinned    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  sender    User   @relation(fields: [senderId], references: [id])
  receiver  User   @relation(fields: [receiverId], references: [id])
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
}
```

## 🧪 Testing Architecture

### Test Structure

```typescript
// Unit Tests
describe('MessageService', () => {
  test('should send message successfully', async () => {
    const message = { content: 'Hello', receiverId: '123' };
    const result = await messageService.send(message);
    expect(result).toBeDefined();
  });
});

// Integration Tests
describe('Chat Integration', () => {
  test('should handle real-time messaging', async () => {
    const socket = createMockSocket();
    const component = render(<ChatInterface socket={socket} />);
    
    fireEvent.change(screen.getByPlaceholderText('Type a message'), {
      target: { value: 'Hello World' }
    });
    
    fireEvent.click(screen.getByText('Send'));
    
    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith('send-message', {
        content: 'Hello World'
      });
    });
  });
});
```

## 🚀 Performance Optimizations

### Code Splitting

```typescript
// Dynamic Imports
const VideoCall = dynamic(() => import('../components/VideoCall'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const ChatInterface = dynamic(() => import('../components/ChatInterface'), {
  loading: () => <LoadingSpinner />,
});
```

### Memoization

```typescript
// React.memo for component optimization
const MessageItem = React.memo(({ message, isOwn }) => {
  return (
    <div className={getMessageStyles(isOwn)}>
      <p>{message.content}</p>
    </div>
  );
});

// useMemo for expensive calculations
const filteredMessages = useMemo(() => {
  return messages.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [messages, searchTerm]);
```

## 📦 Build & Deployment

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['your-cdn-domain.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};
```

### Environment Configuration

```typescript
// envConfig.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
```

This code structure provides a solid foundation for building a scalable, maintainable, and feature-rich WhatsApp-like application using modern web technologies.
