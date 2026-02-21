'use client';

import { useState } from 'react';
import Link from 'next/link';

interface UserListProps {
  users: { [key: string]: string };
  currentUser: string;
  onStartCall: (user: string) => void;
  onEditUser?: () => void;
}

export default function UserList({ users, currentUser, onStartCall, onEditUser }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = Object.entries(users).filter(([user]) =>
    user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-full md:w-[30%] lg:w-[25%] flex flex-col h-full bg-white border-r border-[#e9edef]">
      {/* Header */}
      <header className="flex h-[60px] items-center justify-between bg-[#f0f2f5] px-4 py-2 flex-shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-300">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser || 'default'}`} alt="avatar" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-4 text-[#54656f]">
          <Link href="/chat" title="Open Messenger" className="hover:bg-black/5 p-2 rounded-full transition-colors">
            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </Link>
          {onEditUser && (
            <button onClick={onEditUser} className="hover:bg-black/5 p-2 rounded-full transition-colors" title="Edit Profile">
              <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 4.001A2 2 0 0 0 12 15z"></path>
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-4 rounded-lg bg-[#f0f2f5] px-3 py-1.5 shadow-sm">
          <span className="text-[#54656f]">
            <svg viewBox="0 0 24 24" height="20" width="20" fill="currentColor">
              <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.183 5.183 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"></path>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-sm text-[#111b21] outline-none placeholder:text-[#667781]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
        {filteredUsers.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center p-8 text-center text-[#667781]">
            <p className="text-sm italic">No contacts found</p>
          </div>
        ) : (
          filteredUsers.map(([user]) => (
            <div
              key={user}
              className="flex w-full items-center gap-3 px-3 py-3 transition-colors hover:bg-[#f5f6f6] cursor-pointer group"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`} alt={user} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium text-[#111b21]">{user}</span>
                  {user === currentUser && (
                    <span className="text-[10px] text-[#00a884] font-bold uppercase tracking-wider bg-[#d9fdd3] px-1.5 py-0.5 rounded">You</span>
                  )}
                </div>
                <span className="truncate text-xs text-[#667781]">Online</span>
              </div>

              {user !== currentUser && (
                <button
                  onClick={() => onStartCall(user)}
                  className="hidden group-hover:flex items-center justify-center h-8 w-8 bg-[#00a884] text-white rounded-full transition-transform hover:scale-110 active:scale-95 shadow-md"
                  title="Start Call"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
