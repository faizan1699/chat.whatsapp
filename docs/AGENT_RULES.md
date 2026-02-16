# 🤖 Agent Development Rules & Guidelines

## 📋 Overview

This document outlines the rules, guidelines, and best practices for AI agents working on the Next.js WebRTC Chat Application. These rules ensure consistency, quality, and maintainability across all development work.

## 🎯 Core Development Principles

### 1. Code Quality Standards
- **Clean Code**: Write readable, maintainable, and self-documenting code
- **TypeScript First**: Always use TypeScript with proper type definitions
- **Error Handling**: Implement comprehensive error handling with user-friendly messages
- **Performance**: Optimize for performance without sacrificing readability
- **Security**: Follow security best practices at all times

### 2. Architecture Adherence
- **Redux Pattern**: Use Redux Toolkit for global state management
- **Component Composition**: Build reusable, composable components
- **Custom Hooks**: Extract logic into custom hooks for reusability
- **API Layer**: Use the established API service layer
- **Socket Integration**: Follow the Socket.IO integration patterns

## 📝 Code Style Guidelines

### TypeScript Rules

```typescript
// ✅ Good: Proper typing with interfaces
interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ❌ Bad: Using 'any' type
const message: any = {
  id: '123',
  content: 'Hello',
  // Missing proper typing
};

// ✅ Good: Generic functions with proper constraints
function createAsyncThunk<T, U>(
  typePrefix: string,
  payloadCreator: (arg: U) => Promise<T>
): AsyncThunk<T, U, {}> {
  // Implementation
}

// ❌ Bad: Unclear parameter types
function processData(data: any): any {
  // Implementation
}
```

### Component Structure

```typescript
// ✅ Good: Proper component structure with types
interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  onEdit,
  onDelete,
  onReact,
}) => {
  // Component implementation
};

export default MessageItem;

// ❌ Bad: Missing props interface and typing
const MessageItem = ({ message, isOwn, onEdit, onDelete, onReact }) => {
  // Component implementation
};
```

### Redux Pattern Rules

```typescript
// ✅ Good: Proper slice structure
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.senderId === state.activeConversation 
        ? message.receiverId 
        : message.senderId;
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      state.messages[conversationId].push(message);
    },
  },
});

// ❌ Bad: Mutating state incorrectly
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      // Don't push directly without proper logic
      state.messages.push(action.payload);
    },
  },
});
```

## 🚀 Feature Development Rules

### 1. New Feature Implementation

#### Before Implementation
- [ ] **Requirements Analysis**: Understand the complete requirements
- [ ] **API Design**: Design API endpoints and data structures
- [ ] **State Planning**: Plan Redux state structure and actions
- [ ] **Component Planning**: Design component hierarchy and props
- [ ] **Testing Strategy**: Plan unit and integration tests

#### During Implementation
- [ ] **Type Safety**: Ensure all code is properly typed
- [ ] **Error Handling**: Implement comprehensive error handling
- [ ] **Loading States**: Add proper loading and error states
- [ ] **Accessibility**: Ensure accessibility standards are met
- [ ] **Performance**: Optimize for performance

#### After Implementation
- [ ] **Code Review**: Ensure code passes review standards
- [ ] **Testing**: Write and pass all tests
- [ ] **Documentation**: Update relevant documentation
- [ ] **Integration**: Test with existing features
- [ ] **Deployment**: Ensure deployment readiness

### 2. API Development Rules

```typescript
// ✅ Good: Proper API service structure
class MessageService {
  private apiClient: AxiosInstance;
  
  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
    });
    
    this.setupInterceptors();
  }
  
  async sendMessage(messageData: CreateMessageDto): Promise<Message> {
    try {
      const response = await this.apiClient.post<Message>('/messages', messageData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
  
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await this.apiClient.get<Message[]>(`/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }
}

// ❌ Bad: Direct API calls without service layer
const sendMessage = async (messageData: any) => {
  const response = await fetch('/api/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return response.json();
};
```

### 3. Component Development Rules

```typescript
// ✅ Good: Proper component with hooks and error handling
const ChatInterface: React.FC = () => {
  const { 
    conversations, 
    activeConversation, 
    loading, 
    error,
    loadConversations,
    selectConversation,
    clearError 
  } = useChat();
  
  const { user } = useAuth();
  
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={loadConversations}
        onDismiss={clearError}
      />
    );
  }
  
  return (
    <div className="chat-interface">
      <ConversationList
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={selectConversation}
        currentUserId={user?.id}
      />
      <MessageArea conversationId={activeConversation} />
    </div>
  );
};

// ❌ Bad: Component without proper error handling and hooks
const ChatInterface = () => {
  const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => setConversations(data));
  }, []);
  
  return (
    <div>
      {conversations.map(conv => (
        <div key={conv.id}>{conv.name}</div>
      ))}
    </div>
  );
};
```

## 🔒 Security Rules

### 1. Authentication & Authorization
- **JWT Validation**: Always validate JWT tokens on protected routes
- **Input Sanitization**: Sanitize all user inputs
- **Password Security**: Use bcryptjs for password hashing
- **Session Management**: Implement proper session timeout and refresh

### 2. Data Protection
- **Environment Variables**: Never expose sensitive data in client code
- **API Security**: Implement rate limiting and CORS properly
- **XSS Prevention**: Sanitize user-generated content
- **CSRF Protection**: Implement CSRF tokens for state-changing requests

```typescript
// ✅ Good: Secure API route with validation
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validate JWT token
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Validate input
    const { content, receiverId } = sendMessageSchema.parse(req.body);
    
    // Process request
    const message = await messageService.createMessage({
      content: sanitizeHtml(content),
      senderId: decoded.userId,
      receiverId,
    });
    
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ❌ Bad: Insecure API route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { content, receiverId } = req.body;
  
  const message = await prisma.message.create({
    data: { content, receiverId },
  });
  
  res.json(message);
}
```

## 🧪 Testing Rules

### 1. Unit Testing
- **Coverage**: Maintain at least 80% test coverage
- **Redux Testing**: Test all reducers and async thunks
- **Component Testing**: Test component rendering and interactions
- **Hook Testing**: Test custom hooks with React Testing Library

### 2. Integration Testing
- **API Testing**: Test all API endpoints
- **Socket Testing**: Test Socket.IO events and connections
- **E2E Testing**: Test critical user flows end-to-end

```typescript
// ✅ Good: Comprehensive component test
describe('MessageItem', () => {
  const mockMessage: Message = {
    id: '1',
    content: 'Hello World',
    senderId: 'user1',
    receiverId: 'user2',
    type: 'TEXT',
    status: 'SENT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  it('renders message content correctly', () => {
    render(<MessageItem message={mockMessage} isOwn={false} />);
    
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<MessageItem message={mockMessage} isOwn={true} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(onEdit).toHaveBeenCalledWith('1', 'Hello World');
  });
  
  it('shows edited indicator for edited messages', () => {
    const editedMessage = { ...mockMessage, isEdited: true };
    render(<MessageItem message={editedMessage} isOwn={true} />);
    
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });
});

// ❌ Bad: Insufficient testing
describe('MessageItem', () => {
  it('renders', () => {
    render(<MessageItem message={{}} isOwn={false} />);
    expect(true).toBe(true);
  });
});
```

## 📁 File Organization Rules

### 1. Directory Structure
```
src/
├── components/          # Reusable components
│   ├── chat/           # Chat-specific components
│   ├── global/         # Global components
│   └── video/          # Video call components
├── hooks/              # Custom React hooks
├── store/              # Redux store and slices
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

### 2. Naming Conventions
- **Components**: PascalCase (e.g., `MessageItem.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useChat.ts`)
- **Services**: camelCase (e.g., `messageService.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`)
- **Types**: camelCase (e.g., `messageTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

## 🔄 Git Workflow Rules

### 1. Branch Naming
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `refactor/code-improvement` - Code refactoring

### 2. Commit Messages
```
type(scope): description

feat(chat): add message reactions
fix(auth): resolve login validation issue
refactor(components): optimize message list rendering
docs(readme): update installation instructions
test(api): add message service tests
```

### 3. Pull Request Requirements
- [ ] **Description**: Clear description of changes
- [ ] **Testing**: All tests passing
- [ ] **Code Review**: At least one approval
- [ ] **Documentation**: Updated if necessary
- [ ] **No Conflicts**: Merge conflicts resolved

## 🎨 UI/UX Rules

### 1. Design System
- **Consistency**: Follow established design patterns
- **Responsive**: Mobile-first responsive design
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimize images and animations

### 2. Component Guidelines
- **Reusable**: Build components for reusability
- **Composable**: Design for composition
- **Testable**: Make components easy to test
- **Accessible**: Include proper ARIA labels

```typescript
// ✅ Good: Accessible and reusable component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  'aria-label': ariaLabel,
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  
  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? <LoadingSpinner size="sm" /> : children}
    </button>
  );
};

// ❌ Bad: Non-accessible, non-reusable button
const MyButton = ({ onClick, children }) => {
  return (
    <button onClick={onClick} style={{ background: 'blue' }}>
      {children}
    </button>
  );
};
```

## 📊 Performance Rules

### 1. Optimization Requirements
- **Code Splitting**: Implement lazy loading for large components
- **Memoization**: Use React.memo and useMemo appropriately
- **Bundle Size**: Keep bundle size under 1MB
- **Load Times**: Target < 3 seconds initial load

### 2. Monitoring
- **Performance Metrics**: Monitor Core Web Vitals
- **Error Tracking**: Implement error tracking
- **Analytics**: Track user interactions
- **A/B Testing**: Test feature improvements

```typescript
// ✅ Good: Optimized component with memoization
const MessageList = React.memo<MessageListProps>(({ messages, onMessageAction }) => {
  const sortedMessages = useMemo(() => {
    return messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);
  
  const messageItems = useMemo(() => {
    return sortedMessages.map(message => (
      <MessageItem
        key={message.id}
        message={message}
        onAction={onMessageAction}
      />
    ));
  }, [sortedMessages, onMessageAction]);
  
  return (
    <div className="message-list">
      {messageItems}
    </div>
  );
});

// ❌ Bad: Unoptimized component
const MessageList = ({ messages, onMessageAction }) => {
  const sortedMessages = messages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  return (
    <div className="message-list">
      {sortedMessages.map(message => (
        <MessageItem
          key={message.id}
          message={message}
          onAction={onMessageAction}
        />
      ))}
    </div>
  );
};
```

## 🚨 Error Handling Rules

### 1. Error Boundaries
- **Component Boundaries**: Implement error boundaries for components
- **Fallback UI**: Provide user-friendly error fallbacks
- **Error Reporting**: Log errors to monitoring services
- **Recovery**: Provide recovery options when possible

### 2. API Error Handling
- **Consistent Format**: Use consistent error response format
- **User Messages**: Provide user-friendly error messages
- **Logging**: Log errors for debugging
- **Retry Logic**: Implement retry logic for failed requests

```typescript
// ✅ Good: Comprehensive error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
    errorReportingService.report(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}

// ❌ Bad: No error handling
const App = () => {
  return <ChatInterface />;
};
```

## 📚 Documentation Rules

### 1. Code Documentation
- **JSDoc**: Document all functions and classes
- **Type Comments**: Add comments for complex types
- **README**: Keep README files updated
- **API Docs**: Document API endpoints

### 2. Component Documentation
- **Props Documentation**: Document all component props
- **Usage Examples**: Provide usage examples
- **Storybook**: Use Storybook for component documentation
- **Changelog**: Maintain changelog for major changes

```typescript
// ✅ Good: Well-documented component
/**
 * MessageItem component displays a single message in the chat interface.
 * 
 * @example
 * ```tsx
 * <MessageItem
 *   message={message}
 *   isOwn={true}
 *   onEdit={(id, content) => editMessage(id, content)}
 *   onDelete={(id) => deleteMessage(id)}
 * />
 * ```
 */
interface MessageItemProps {
  /** The message object to display */
  message: Message;
  /** Whether the message was sent by the current user */
  isOwn: boolean;
  /** Callback function when message is edited */
  onEdit?: (messageId: string, content: string) => void;
  /** Callback function when message is deleted */
  onDelete?: (messageId: string) => void;
  /** Callback function when reaction is added */
  onReact?: (messageId: string, emoji: string) => void;
}

// ❌ Bad: Undocumented component
const MessageItem = ({ message, isOwn, onEdit, onDelete, onReact }) => {
  // Component implementation
};
```

## 🔍 Code Review Rules

### 1. Review Checklist
- [ ] **Functionality**: Does the code work as intended?
- [ ] **Type Safety**: Is all code properly typed?
- [ ] **Performance**: Is the code optimized?
- [ ] **Security**: Are security best practices followed?
- [ ] **Testing**: Are tests included and passing?
- [ ] **Documentation**: Is the code well documented?
- [ ] **Style**: Does the code follow style guidelines?

### 2. Review Process
- **Constructive Feedback**: Provide helpful, specific feedback
- **Discussion**: Discuss significant changes
- **Approval**: Only approve when all requirements are met
- **Follow-up**: Ensure issues are resolved

## 📈 Monitoring & Analytics Rules

### 1. Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle Analysis**: Regular bundle size analysis
- **API Performance**: Monitor API response times
- **Error Rates**: Track error rates and patterns

### 2. User Analytics
- **User Flows**: Track critical user journeys
- **Feature Usage**: Monitor feature adoption
- **Error Tracking**: Track user-facing errors
- **Performance Metrics**: Monitor user experience metrics

## 🎯 Success Metrics

### 1. Code Quality Metrics
- **Test Coverage**: > 80%
- **TypeScript Coverage**: > 95%
- **Bundle Size**: < 1MB
- **Performance**: < 3s load time

### 2. Development Metrics
- **Code Review Time**: < 24 hours
- **Bug Resolution**: < 48 hours
- **Feature Delivery**: On-time delivery
- **Documentation**: Up-to-date docs

### 3. User Experience Metrics
- **User Satisfaction**: > 4.5/5
- **Error Rate**: < 1%
- **Load Time**: < 3 seconds
- **Feature Adoption**: > 70%

---

## 📋 Quick Reference

### Do's
- ✅ Use TypeScript with proper typing
- ✅ Follow Redux Toolkit patterns
- ✅ Implement comprehensive error handling
- ✅ Write tests for all new code
- ✅ Document your code
- ✅ Follow security best practices
- ✅ Optimize for performance
- ✅ Use consistent naming conventions

### Don'ts
- ❌ Use `any` type
- ❌ Skip error handling
- ❌ Write code without tests
- ❌ Commit sensitive data
- ❌ Ignore accessibility
- ❌ Skip code review
- ❌ Write undocumented code
- ❌ Ignore performance optimization

These rules ensure high-quality, maintainable, and secure code for the Next.js WebRTC Chat Application. All agents must follow these guidelines when working on the project.
