# 🚀 Next.js & WebRTC Premium Chat Application

A high-performance, real-time communication platform featuring video/audio calling, instant messaging, and voice notes. Built with modern web technologies for a seamless user experience.

![Chat App Preview](https://via.placeholder.com/1200x600/111/fff?text=Next.js+WebRTC+Premium+Chat)

---

## ✨ Features

### 📡 Real-time Communication
- **P2P Video & Audio Calls**: Secure peer-to-peer calling using WebRTC.
- **Instant Messaging**: Low-latency chat powered by Socket.IO.
- **Presence Tracking**: Real-time status of online users.

### 💬 Advanced Chat Features
- **Voice Messages**: Record, trim, and send audio messages with visual waveforms.
- **Message Management**: Edit, delete (with 1-hour "for everyone" rule), and pin messages.
- **Status Indicators**: Sent, Delivered, and Read receipts.
- **Rich Media**: Emoji picker support and large message handling via chunking.
- **Replies**: Reply to specific messages in a thread.

### 🛠️ Robust Architecture
- **PostgreSQL Persistence**: All messages and user data are stored in a PostgreSQL database.
- **Prisma ORM**: Type-safe database queries and automated migrations.
- **Reliable Messaging**: Local storage fallback for failed messages with auto-retry functionality.
- **Scalable Signaling**: Efficient Socket.IO implementation for real-time events.
- **Responsive UI**: Sleek, mobile-first design using Tailwind CSS and Framer Motion.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- NPM or Yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nextjs-webrtc-app.git
   cd nextjs-webrtc-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string.

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

---

## 🏗️ Project Structure

```text
├── prisma/               # Prisma Schema & Migrations
├── app/                  # Next.js App Router
│   ├── chat/             # Main Chat Interface
├── components/           # Reusable Components
├── pages/api/            # Socket.IO & Auth API Routes
├── utils/                # Prisma Client & Helpers
└── README.md
```

---

## 🛠️ Technology Stack

- **Core**: [Next.js 14](https://nextjs.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Logic**: [Socket.IO](https://socket.io/), [WebRTC](https://webrtc.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Auth**: JWT & BcryptJS

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
