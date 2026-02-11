'use client';

import { useState } from 'react';

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
    <aside className="w-full md:flex-basis-[30rem] md:border-r md:border-black h-full bg-white md:w-80 overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <h1 className="p-4 md:p-4 text-[1.4rem] md:text-[1.9rem] font-lora font-semibold">Contacts</h1>
        
        {/* Search Input */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-[1.3rem] md:text-[1.4rem] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
      </div>

      <div className="p-2 md:p-2">
        <ul className="caller-list space-y-2">
          {filteredUsers.map(([user]) => (
            <li
              key={user}
              className="flex justify-between items-center p-4 md:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer text-[1.3rem] md:text-[1.6rem] transition-all active:scale-[0.98] border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-[1.2rem] md:text-[1.4rem]">
                  {user.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{user}</span>
                  {user === currentUser && (
                    <span className="ml-2 text-xs md:text-sm text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-full">You</span>
                  )}
                </div>
              </div>
              {user === currentUser && onEditUser && (
                <button
                  onClick={onEditUser}
                  className="border-none bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg"
                  title="Edit user"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              )}
              {user !== currentUser && (
                <button
                  onClick={() => onStartCall(user)}
                  className="call-btn border-none bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-all active:scale-95 shadow-md hover:shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="md:w-5 md:h-5">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                  </svg>
                </button>
              )}
            </li>
          ))}
          {filteredUsers.length === 0 && (
            <li className="p-8 text-center text-gray-500 text-[1.3rem] md:text-[1.6rem]">
              <div className="flex flex-col items-center space-y-3">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m23 21-3.5-3.5M21 11.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
                </svg>
                <span>No users found</span>
              </div>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}
