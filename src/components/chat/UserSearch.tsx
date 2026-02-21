'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, Phone, Mail, Loader2 } from 'lucide-react';
import { apiService } from '@/services/apiService';

interface SearchForm {
    query: string;
}

interface UserSearchProps {
    onSelectUser: (user: any) => void;
}

export default function UserSearch({ onSelectUser }: UserSearchProps) {
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { register, handleSubmit } = useForm<SearchForm>();

    const onSubmit = async (data: SearchForm) => {
        if (!data.query) return;
        setIsLoading(true);
        try {
            const users = await apiService.searchUser(data.query);
            setResults(users);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = async (user: any) => {
        // Call the original onSelectUser callback
        onSelectUser(user);
        
        // Navigate to chat page
        router.push('/chat');
    };

    return (
        <div className="flex flex-col gap-4 p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="relative">
                <input
                    {...register('query')}
                    className="w-full rounded-lg bg-[#f0f2f5] px-10 py-2 text-[15px] outline-none placeholder:text-[#667781]"
                    placeholder="Search by username, email or phone..."
                />
                <Search className="absolute left-3 top-2.5 text-[#667781]" size={18} />
                {isLoading && <Loader2 className="absolute right-3 top-2.5 animate-spin text-[#00a884]" size={18} />}
            </form>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                {results.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-[#f5f6f6] transition-colors"
                    >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200">
                            <img
                                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt={user.username}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-medium text-[#111b21]">{user.username}</span>
                            <div className="flex items-center gap-2 text-[12px] text-[#667781]">
                                {user.email && <span className="truncate flex items-center gap-1"><Mail size={12} /> {user.email}</span>}
                                {user.phoneNumber && <span className="truncate flex items-center gap-1"><Phone size={12} /> {user.phoneNumber}</span>}
                            </div>
                        </div>
                        <UserPlus size={18} className="ml-auto text-[#00a884]" />
                    </button>
                ))}
                {!isLoading && results.length === 0 && (
                    <p className="text-center text-sm text-[#667781] py-4">No users found</p>
                )}
            </div>
        </div>
    );
}
