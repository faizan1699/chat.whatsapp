# Next.js WebRTC Video Calling App

A complete WebRTC video calling application built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time video calling using WebRTC
- Socket.IO for signaling
- User presence and contact list
- Responsive design with Tailwind CSS
- TypeScript for type safety

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a username to join the video calling platform
2. See other users in the contact list
3. Click the phone icon next to a user to start a video call
4. Use the end call button to disconnect

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.IO** - Real-time communication
- **WebRTC** - Peer-to-peer video calling

## Project Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── UserList.tsx
│   └── VideoCall.tsx
├── hooks/
│   └── useSocket.ts
├── pages/api/
│   └── socket.ts
├── public/
│   └── images/
└── README.md
```

## License

This project is open source and available under the [MIT License](LICENSE).
