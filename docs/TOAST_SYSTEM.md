# Toast Notification System

This application includes a comprehensive toast notification system using `react-hot-toast` with custom styling and predefined functions for common use cases.

## Setup

The toast system is already configured in the application:

1. **CustomToast Component**: Located at `/components/global/CustomToast.tsx`
2. **Toast Utilities**: Located at `/utils/toast.ts`
3. **Global Toaster**: Added to `/app/layout.tsx`

## Usage

### Basic Toast Functions

```typescript
import { toast } from '@/utils/toast';

// Success message
toast.success('Operation completed successfully!');

// Error message
toast.error('Something went wrong!');

// Info message
toast.info('Here is some information');

// Warning message
toast.warning('Please be careful');

// Default message
toast.default('Simple notification');
```

### Authentication Toasts

```typescript
import { authToast } from '@/utils/toast';

// Login success (with optional username)
authToast.loginSuccess('username');

// Login error (with optional custom message)
authToast.loginError('Invalid credentials');

// Registration success
authToast.registerSuccess();

// Registration error
authToast.registerError('Email already exists');

// Logout success
authToast.logoutSuccess();

// Session expired
authToast.sessionExpired();

// Password reset success/error
authToast.passwordResetSuccess();
authToast.passwordResetError('Failed to send reset link');
```

### Chat Toasts

```typescript
import { chatToast } from '@/utils/toast';

// Message operations
chatToast.messageSent();
chatToast.messageError('Failed to send message');
chatToast.messageDeleted();
chatToast.messageEdited();

// User status
chatToast.userOnline('John');
chatToast.userOffline('Jane');

// Call operations
chatToast.callStarted(false); // video call
chatToast.callStarted(true);  // audio call
chatToast.callEnded();
chatToast.callMissed('Alice');
```

### General App Toasts

```typescript
import { appToast } from '@/utils/toast';

// Common operations
appToast.networkError();
appToast.somethingWentWrong();
appToast.success('Profile updated');
appToast.error('upload file');
appToast.saved();
appToast.deleted();
appToast.loading('Processing your request...');
```

### Custom Toast

```typescript
import { toast } from '@/utils/toast';

toast.custom({
    message: 'Custom notification',
    type: 'success',
    duration: 5000,
    showClose: true,
    icon: <YourCustomIcon />
});
```

## Features

- **Auto-dismiss**: Toasts automatically dismiss after 4-5 seconds
- **Manual dismiss**: Users can click the X button to dismiss
- **Stacking**: Multiple toasts stack nicely
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Animated**: Smooth enter/exit animations
- **Themed**: Matches application design system

## Toast Types

1. **Success**: Green checkmark icon
2. **Error**: Red alert icon (longer duration - 5 seconds)
3. **Info**: Blue info icon
4. **Warning**: Yellow warning icon
5. **Default**: Gray bell icon

## Integration in Components

The toast system is already integrated in:

- **Login Page**: Success/error notifications for authentication
- **Register Page**: Success/error notifications for registration
- **Chat Page**: Message sending, call operations, logout notifications

## Testing

Use the demo function to test all toast types:

```typescript
import { testToasts } from '@/utils/toast-demo';

// Run in browser console
testToasts();
```

## Best Practices

1. **Use specific toast functions** (authToast, chatToast) for domain-specific messages
2. **Keep messages short and clear**
3. **Use appropriate toast types** (success for positive actions, error for failures)
4. **Avoid spamming** - limit success notifications for frequent actions like short messages
5. **Provide context** - include relevant information like usernames or action details

## Styling

The toast components use Tailwind CSS classes and can be customized by modifying:
- `/components/global/CustomToast.tsx` for component styling
- `/app/globals.css` for animation classes
- Toast positioning is set to top-right by default
