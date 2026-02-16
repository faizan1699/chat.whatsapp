'use client';

import React, { useState } from 'react';
import RegistrationForm from './RegistrationForm';
import LoginForm from './LoginForm';
import VerifyEmailForm from './VerifyEmailForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthOverlayProps {
    username: string;
    onUsernameCreated: (username: string, userId?: string) => void;
    onClearData: () => void;
}

type AuthView = 'login' | 'register' | 'verify' | 'forgot';

export default function AuthOverlay({ username, onUsernameCreated, onClearData }: AuthOverlayProps) {
    const [view, setView] = useState<AuthView>('login');
    const [pendingEmail, setPendingEmail] = useState<string>('');
    const [pendingUser, setPendingUser] = useState<{ username: string; userId?: string } | null>(null);

    const handleRegisterSuccess = (user: { username: string; userId?: string }, email?: string) => {
        if (email) {
            setPendingEmail(email);
            setPendingUser({ username: user.username, userId: user.userId });
            setView('verify');
        } else {
            onUsernameCreated(user.username, user.userId);
        }
    };

    const handleVerified = () => {
        if (pendingUser) {
            console.log('Email verified, triggering login callback...');
            onUsernameCreated(pendingUser.username, pendingUser.userId);
            setPendingUser(null);
            setPendingEmail('');
        }
    };

    const handleSuccess = (user: { username: string; userId?: string }) => {
        onUsernameCreated(user.username, user.userId);
    };

    if (username !== '') return null;

    if (view === 'forgot') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f0f2f5] md:bg-black/60 md:backdrop-blur-sm p-4">
                <ForgotPasswordForm
                    onSuccess={() => setView('login')}
                    onBack={() => setView('login')}
                />
            </div>
        );
    }

    if (view === 'verify' && pendingEmail) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f0f2f5] md:bg-black/60 md:backdrop-blur-sm p-4">
                <VerifyEmailForm
                    email={pendingEmail}
                    onVerified={handleVerified}
                />
            </div>
        );
    }

    if (view === 'login') {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f0f2f5] md:bg-black/60 md:backdrop-blur-sm p-4">
                <LoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={() => setView('register')}
                    onForgotPassword={() => setView('forgot')}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f0f2f5] md:bg-black/60 md:backdrop-blur-sm p-4">
            <RegistrationForm
                onSuccess={(user, email) => handleRegisterSuccess(user, email)}
                onSwitchToLogin={() => setView('login')}
            />
        </div>
    );
}
