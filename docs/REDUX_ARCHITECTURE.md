# 🔄 Redux Architecture & Global State Management

## 📋 Overview

This document details the Redux architecture used in the Next.js WebRTC Chat Application, covering state management patterns, slice definitions, and data flow.

## 🏗️ Redux Store Configuration

### Store Setup

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import callReducer from './slices/callSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        call: callReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore non-serializable objects like MediaStream and Socket
                ignoredActions: ['call/setLocalStream', 'call/setRemoteStream'],
                ignoredPaths: ['call.localStream', 'call.remoteStream'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Provider Integration

```typescript
// store/Provider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from './index';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
```

## 🔐 Authentication Slice

### Auth State Structure

```typescript
// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string;
  phone?: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitialized: false,
};
```

### Async Thunks

```typescript
// Login Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/auth/login', credentials);
      const { user, token } = response.data;
      
      // Store token in cookie
      document.cookie = `token=${token}; path=/; max-age=86400; secure; samesite=strict`;
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    password: string;
    username: string;
    phone?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      const { user, token } = response.data;
      
      document.cookie = `token=${token}; path=/; max-age=86400; secure; samesite=strict`;
      
      return { user, token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Logout Thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.post('/auth/logout');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

// Update Profile Thunk
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);
```

### Auth Slice Reducers

```typescript
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Initialize auth from cookie
    initializeAuth: (state) => {
      const token = getCookie('token');
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        // Verify token with server
        // This would be handled by an async thunk
      }
      state.isInitialized = true;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Update user status
    updateOnlineStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isOnline = action.payload;
        state.user.lastSeen = new Date();
      }
    },
    
    // Update last seen
    updateLastSeen: (state) => {
      if (state.user) {
        state.user.lastSeen = new Date();
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
    
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
    
    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
    
    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user!, ...action.payload };
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { initializeAuth, clearError, updateOnlineStatus, updateLastSeen } = authSlice.actions;
export default authSlice.reducer;
```

## 💬 Chat Slice

### Chat State Structure

```typescript
// store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ';
  isDeleted: boolean;
  isEdited: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  replyTo?: string;
  reactions?: Record<string, string>;
}

interface Conversation {
  id: string;
  participantId: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversationId -> messages
  activeConversation: string | null;
  typing: Record<string, boolean>; // userId -> isTyping
  onlineUsers: string[];
  loading: boolean;
  error: string | null;
  sendingMessage: boolean;
  searchQuery: string;
  filteredConversations: Conversation[];
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
  activeConversation: null,
  typing: {},
  onlineUsers: [],
  loading: false,
  error: null,
  sendingMessage: false,
  searchQuery: '',
  filteredConversations: [],
};
```

### Chat Async Thunks

```typescript
// Fetch Conversations
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/conversations');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

// Fetch Messages
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get(`/conversations/${conversationId}/messages`);
      return { conversationId, messages: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Send Message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData: {
    content: string;
    receiverId: string;
    type?: string;
    replyTo?: string;
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const tempId = `temp-${Date.now()}`;
      
      const message = {
        ...messageData,
        id: tempId,
        status: 'PENDING' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        isEdited: false,
        isPinned: false,
      };
      
      // Emit via socket
      socket.emit('send-message', message);
      
      // Save to server
      const response = await apiService.post('/messages', messageData);
      return { tempId, serverMessage: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Delete Message
export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await apiService.delete(`/messages/${messageId}`);
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

// Edit Message
export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ messageId, content }: { messageId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/messages/${messageId}`, { content });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to edit message');
    }
  }
);
```

### Chat Slice Reducers

```typescript
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Set active conversation
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversation = action.payload;
    },
    
    // Add real-time message
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.senderId === state.activeConversation 
        ? message.receiverId 
        : message.senderId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      state.messages[conversationId].push(message);
      
      // Update conversation last message
      const conversation = state.conversations.find(c => c.participantId === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = new Date();
      }
    },
    
    // Update message status
    updateMessageStatus: (state, action: PayloadAction<{
      messageId: string;
      status: Message['status'];
    }>) => {
      const { messageId, status } = action.payload;
      
      // Find and update message in all conversations
      Object.values(state.messages).forEach(messages => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.status = status;
        }
      });
    },
    
    // Set typing indicator
    setTyping: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      state.typing[userId] = isTyping;
    },
    
    // Update online users
    updateOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    
    // Search conversations
    searchConversations: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredConversations = state.conversations.filter(conv =>
        conv.participant.username.toLowerCase().includes(action.payload.toLowerCase()) ||
        conv.participant.email.toLowerCase().includes(action.payload.toLowerCase())
      );
    },
    
    // Pin/Unpin message
    togglePinMessage: (state, action: PayloadAction<string>) => {
      const messageId = action.payload;
      
      Object.values(state.messages).forEach(messages => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.isPinned = !message.isPinned;
        }
      });
    },
    
    // React to message
    reactToMessage: (state, action: PayloadAction<{
      messageId: string;
      userId: string;
      emoji: string;
    }>) => {
      const { messageId, userId, emoji } = action.payload;
      
      Object.values(state.messages).forEach(messages => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
          if (!message.reactions) {
            message.reactions = {};
          }
          message.reactions[userId] = emoji;
        }
      });
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
        state.filteredConversations = action.payload;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Fetch Messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;
        state.messages[conversationId] = messages;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const { tempId, serverMessage } = action.payload;
        
        // Replace temp message with server message
        Object.values(state.messages).forEach(messages => {
          const tempIndex = messages.findIndex(m => m.id === tempId);
          if (tempIndex !== -1) {
            messages[tempIndex] = serverMessage;
          }
        });
        
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload as string;
      });
    
    // Delete Message
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        
        Object.values(state.messages).forEach(messages => {
          const message = messages.find(m => m.id === messageId);
          if (message) {
            message.isDeleted = true;
            message.content = 'This message was deleted';
          }
        });
      });
    
    // Edit Message
    builder
      .addCase(editMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        
        Object.values(state.messages).forEach(messages => {
          const message = messages.find(m => m.id === updatedMessage.id);
          if (message) {
            message.content = updatedMessage.content;
            message.isEdited = true;
            message.updatedAt = updatedMessage.updatedAt;
          }
        });
      });
  },
});

export const {
  setActiveConversation,
  addMessage,
  updateMessageStatus,
  setTyping,
  updateOnlineUsers,
  searchConversations,
  togglePinMessage,
  reactToMessage,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
```

## 📞 Call Slice

### Call State Structure

```typescript
// store/slices/callSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'AUDIO' | 'VIDEO';
  status: 'INITIATING' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'REJECTED';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface CallState {
  isCallActive: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callData: CallData | null;
  callTimer: number;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

const initialState: CallState = {
  isCallActive: false,
  isIncomingCall: false,
  isOutgoingCall: false,
  localStream: null,
  remoteStream: null,
  callData: null,
  callTimer: 0,
  connectionState: 'disconnected',
  isMuted: false,
  isVideoOn: true,
  isScreenSharing: false,
  error: null,
};
```

### Call Slice Reducers

```typescript
const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    // Start call
    startCall: (state, action: PayloadAction<{
      receiverId: string;
      type: 'AUDIO' | 'VIDEO';
    }>) => {
      state.isOutgoingCall = true;
      state.isCallActive = true;
      state.connectionState = 'connecting';
      state.callData = {
        id: `call-${Date.now()}`,
        callerId: 'current-user', // Would come from auth state
        receiverId: action.payload.receiverId,
        type: action.payload.type,
        status: 'INITIATING',
        startTime: new Date(),
      };
      state.error = null;
    },
    
    // Receive incoming call
    receiveIncomingCall: (state, action: PayloadAction<CallData>) => {
      state.isIncomingCall = true;
      state.isCallActive = true;
      state.callData = action.payload;
      state.error = null;
    },
    
    // Accept call
    acceptCall: (state) => {
      state.isIncomingCall = false;
      state.connectionState = 'connected';
      if (state.callData) {
        state.callData.status = 'CONNECTED';
        state.callData.startTime = new Date();
      }
    },
    
    // Reject call
    rejectCall: (state) => {
      state.isIncomingCall = false;
      state.isCallActive = false;
      state.connectionState = 'disconnected';
      if (state.callData) {
        state.callData.status = 'REJECTED';
        state.callData.endTime = new Date();
      }
    },
    
    // End call
    endCall: (state) => {
      state.isCallActive = false;
      state.isIncomingCall = false;
      state.isOutgoingCall = false;
      state.connectionState = 'disconnected';
      state.callTimer = 0;
      if (state.callData) {
        state.callData.status = 'ENDED';
        state.callData.endTime = new Date();
        if (state.callData.startTime) {
          state.callData.duration = Math.floor(
            (new Date().getTime() - state.callData.startTime.getTime()) / 1000
          );
        }
      }
    },
    
    // Set local stream
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.localStream = action.payload;
    },
    
    // Set remote stream
    setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.remoteStream = action.payload;
    },
    
    // Update connection state
    updateConnectionState: (state, action: PayloadAction<CallState['connectionState']>) => {
      state.connectionState = action.payload;
    },
    
    // Toggle mute
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach(track => {
          track.enabled = !state.isMuted;
        });
      }
    },
    
    // Toggle video
    toggleVideo: (state) => {
      state.isVideoOn = !state.isVideoOn;
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach(track => {
          track.enabled = state.isVideoOn;
        });
      }
    },
    
    // Toggle screen sharing
    toggleScreenShare: (state) => {
      state.isScreenSharing = !state.isScreenSharing;
    },
    
    // Update call timer
    updateCallTimer: (state) => {
      if (state.isCallActive && state.connectionState === 'connected') {
        state.callTimer += 1;
      }
    },
    
    // Set call error
    setCallError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.connectionState = 'failed';
    },
    
    // Clear call data
    clearCallData: (state) => {
      state.callData = null;
      state.error = null;
    },
  },
});

export const {
  startCall,
  receiveIncomingCall,
  acceptCall,
  rejectCall,
  endCall,
  setLocalStream,
  setRemoteStream,
  updateConnectionState,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  updateCallTimer,
  setCallError,
  clearCallData,
} = callSlice.actions;

export default callSlice.reducer;
```

## 🎣 Custom Hooks for Redux

### Typed Hooks

```typescript
// hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Auth Hook

```typescript
// hooks/useAuth.ts
import { useAppSelector, useAppDispatch } from './redux';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  updateProfile,
  clearError,
  updateOnlineStatus 
} from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  
  const login = (credentials: { email: string; password: string }) => {
    return dispatch(loginUser(credentials));
  };
  
  const register = (userData: {
    email: string;
    password: string;
    username: string;
    phone?: string;
  }) => {
    return dispatch(registerUser(userData));
  };
  
  const logout = () => {
    return dispatch(logoutUser());
  };
  
  const updateProfileData = (profileData: Partial<User>) => {
    return dispatch(updateProfile(profileData));
  };
  
  const clearAuthError = () => {
    dispatch(clearError());
  };
  
  const setOnlineStatus = (isOnline: boolean) => {
    dispatch(updateOnlineStatus(isOnline));
  };
  
  return {
    ...auth,
    login,
    register,
    logout,
    updateProfileData,
    clearAuthError,
    setOnlineStatus,
  };
};
```

### Chat Hook

```typescript
// hooks/useChat.ts
import { useAppSelector, useAppDispatch } from './redux';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  deleteMessage,
  editMessage,
  setActiveConversation,
  addMessage,
  updateMessageStatus,
  setTyping,
  updateOnlineUsers,
  searchConversations,
  togglePinMessage,
  reactToMessage,
  clearError,
} from '../store/slices/chatSlice';

export const useChat = () => {
  const dispatch = useAppDispatch();
  const chat = useAppSelector(state => state.chat);
  
  const loadConversations = () => {
    return dispatch(fetchConversations());
  };
  
  const loadMessages = (conversationId: string) => {
    return dispatch(fetchMessages(conversationId));
  };
  
  const sendNewMessage = (messageData: {
    content: string;
    receiverId: string;
    type?: string;
    replyTo?: string;
  }) => {
    return dispatch(sendMessage(messageData));
  };
  
  const deleteMessageById = (messageId: string) => {
    return dispatch(deleteMessage(messageId));
  };
  
  const editMessageById = (messageId: string, content: string) => {
    return dispatch(editMessage({ messageId, content }));
  };
  
  const selectConversation = (conversationId: string | null) => {
    dispatch(setActiveConversation(conversationId));
  };
  
  const handleTyping = (userId: string, isTyping: boolean) => {
    dispatch(setTyping({ userId, isTyping }));
  };
  
  const updateOnlineUsersList = (users: string[]) => {
    dispatch(updateOnlineUsers(users));
  };
  
  const searchInConversations = (query: string) => {
    dispatch(searchConversations(query));
  };
  
  const pinMessage = (messageId: string) => {
    dispatch(togglePinMessage(messageId));
  };
  
  const addReaction = (messageId: string, userId: string, emoji: string) => {
    dispatch(reactToMessage({ messageId, userId, emoji }));
  };
  
  const clearChatError = () => {
    dispatch(clearError());
  };
  
  return {
    ...chat,
    loadConversations,
    loadMessages,
    sendNewMessage,
    deleteMessageById,
    editMessageById,
    selectConversation,
    handleTyping,
    updateOnlineUsersList,
    searchInConversations,
    pinMessage,
    addReaction,
    clearChatError,
  };
};
```

### Call Hook

```typescript
// hooks/useCall.ts
import { useAppSelector, useAppDispatch } from './redux';
import {
  startCall,
  receiveIncomingCall,
  acceptCall,
  rejectCall,
  endCall,
  setLocalStream,
  setRemoteStream,
  updateConnectionState,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  updateCallTimer,
  setCallError,
  clearCallData,
} from '../store/slices/callSlice';

export const useCall = () => {
  const dispatch = useAppDispatch();
  const call = useAppSelector(state => state.call);
  
  const initiateCall = (receiverId: string, type: 'AUDIO' | 'VIDEO') => {
    dispatch(startCall({ receiverId, type }));
  };
  
  const handleIncomingCall = (callData: CallData) => {
    dispatch(receiveIncomingCall(callData));
  };
  
  const acceptIncomingCall = () => {
    dispatch(acceptCall());
  };
  
  const rejectIncomingCall = () => {
    dispatch(rejectCall());
  };
  
  const terminateCall = () => {
    dispatch(endCall());
  };
  
  const setLocalMediaStream = (stream: MediaStream | null) => {
    dispatch(setLocalStream(stream));
  };
  
  const setRemoteMediaStream = (stream: MediaStream | null) => {
    dispatch(setRemoteStream(stream));
  };
  
  const updateCallConnectionState = (state: CallState['connectionState']) => {
    dispatch(updateConnectionState(state));
  };
  
  const muteUnmute = () => {
    dispatch(toggleMute());
  };
  
  const videoOnOff = () => {
    dispatch(toggleVideo());
  };
  
  const screenShareToggle = () => {
    dispatch(toggleScreenShare());
  };
  
  const incrementCallTimer = () => {
    dispatch(updateCallTimer());
  };
  
  const handleCallError = (error: string) => {
    dispatch(setCallError(error));
  };
  
  const clearCallState = () => {
    dispatch(clearCallData());
  };
  
  return {
    ...call,
    initiateCall,
    handleIncomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    terminateCall,
    setLocalMediaStream,
    setRemoteMediaStream,
    updateCallConnectionState,
    muteUnmute,
    videoOnOff,
    screenShareToggle,
    incrementCallTimer,
    handleCallError,
    clearCallState,
  };
};
```

## 🔄 Data Flow Patterns

### Socket Integration with Redux

```typescript
// utils/socketReduxIntegration.ts
import { store } from '../store';
import { addMessage, updateMessageStatus, setTyping, updateOnlineUsers } from '../store/slices/chatSlice';
import { receiveIncomingCall, updateConnectionState } from '../store/slices/callSlice';

export const setupSocketListeners = (socket: Socket) => {
  // Message events
  socket.on('message-received', (message: Message) => {
    store.dispatch(addMessage(message));
  });
  
  socket.on('message-status-updated', ({ messageId, status }) => {
    store.dispatch(updateMessageStatus({ messageId, status }));
  });
  
  socket.on('user-typing', ({ userId, isTyping }) => {
    store.dispatch(setTyping({ userId, isTyping }));
  });
  
  socket.on('online-users-updated', (users: string[]) => {
    store.dispatch(updateOnlineUsers(users));
  });
  
  // Call events
  socket.on('incoming-call', (callData: CallData) => {
    store.dispatch(receiveIncomingCall(callData));
  });
  
  socket.on('call-accepted', () => {
    store.dispatch(updateConnectionState('connected'));
  });
  
  socket.on('call-rejected', () => {
    store.dispatch(updateConnectionState('disconnected'));
  });
};
```

### Persistence with Redux

```typescript
// utils/reduxPersistence.ts
import { RootState } from '../store';

// Save state to localStorage
export const saveStateToLocalStorage = (state: Partial<RootState>) => {
  try {
    const serializedState = JSON.stringify({
      auth: {
        user: state.auth?.user,
        isAuthenticated: state.auth?.isAuthenticated,
      },
      chat: {
        conversations: state.chat?.conversations,
      },
    });
    localStorage.setItem('reduxState', serializedState);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

// Load state from localStorage
export const loadStateFromLocalStorage = (): Partial<RootState> | undefined => {
  try {
    const serializedState = localStorage.getItem('reduxState');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return undefined;
  }
};
```

## 🧪 Testing Redux

### Slice Testing

```typescript
// __tests__/authSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, logoutUser, clearError } from '../store/slices/authSlice';

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });
  
  test('should handle login pending', () => {
    store.dispatch(loginUser.pending);
    const state = store.getState().auth;
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
  
  test('should handle login fulfilled', () => {
    const mockUser = { id: '1', email: 'test@example.com', username: 'test' };
    const mockToken = 'mock-token';
    
    store.dispatch(loginUser.fulfilled({ user: mockUser, token: mockToken }, '', {
      email: 'test@example.com',
      password: 'password',
    }));
    
    const state = store.getState().auth;
    
    expect(state.loading).toBe(false);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe(mockToken);
    expect(state.isAuthenticated).toBe(true);
  });
  
  test('should handle clear error', () => {
    store.dispatch({ type: 'auth/login/rejected', payload: 'Login failed' });
    store.dispatch(clearError());
    
    const state = store.getState().auth;
    expect(state.error).toBeNull();
  });
});
```

This Redux architecture provides a robust, type-safe, and scalable state management solution for the WhatsApp-like application, with proper separation of concerns and comprehensive testing capabilities.
