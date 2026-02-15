# Application Flow

This document describes the current flow and architecture of the Next.js WebRTC Chat Application.

## 1. Authentication Flow
- **Account Creation**: Users can create an account using **Email or Phone Number**.
- **Backend Storage**: User data is stored in **PostgreSQL** via **Prisma ORM**.
- **Security**: Passwords are hashed using `bcryptjs`. JWT-based sessions are managed via cookies.
- **Socket Join**: On successful authentication, the client joins the socket server with their unique username.

## 2. Real-time Messaging & Persistence
- **Message Storage**: All messages are persisted in PostgreSQL.
- **Sending Messages**: 
    - Messages are emitted via `send-message` event.
    - Large messages are chunked and reassembled.
    - Message statuses: `pending` -> `sent` -> `delivered` -> `read`.
- **Message Deletion**: Users can "Delete for Everyone" within a **1-hour window**. After 1 hour, messages can only be deleted locally (for "me").
- **Message States**:
    - `isDeleted`: If true, shows "This message was deleted".
    - `isEdited`: If true, shows "edited" tag.
    - `isPinned`: If true, message is pinned to the chat.

## 3. WebRTC Video/Audio Calls
- **Initiating a Call**:
    - User A clicks the call button.
    - User A gets local media stream (`getUserMedia`).
    - User A creates a PeerConnection and an offer, then sends it via `offer` socket event.
- **Receiving a Call**:
    - User B receives the `offer` and shows an `IncomingCallModal`.
    - User B accepts, gets local media stream, creates a PeerConnection with the remote offer, creates an answer, and sends it via `answer` socket event.

## 4. Error Handling & Persistence
- **Failed Messages**: Saved to `localStorage` for auto-retry when reconnected.
- **Database Consistency**: Prisma ensures type-safe interactions with PostgreSQL.

## 5. Components Structure
- `app/chat/page.tsx`: Main container managing state and socket listeners.
- `components/chat/MessageList.tsx`: Renders the scrollable list of messages.
- `components/chat/MessageItem.tsx`: Individual message bubble with actions.
- `components/chat/ChatFooter.tsx`: Input area with voice recording.
- `components/chat/ChatHeader.tsx`: Shows participant info and call buttons.

## 6. Technology Stack Update
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Email/Phone based with JWT & Bcrypt
