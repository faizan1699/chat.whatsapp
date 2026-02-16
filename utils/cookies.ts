import { serialize, parse } from 'cookie';

// Cookie utilities for session management
export const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
};

export const setAuthCookie = (res: any, token: string, userId: string, username: string) => {
    res.setHeader('Set-Cookie', [
        serialize('auth-token', token, cookieOptions),
        serialize('user-id', userId, cookieOptions),
        serialize('username', username, cookieOptions),
    ]);
};

export const parseCookies = (cookieHeader: string) => {
    return parse(cookieHeader || '');
};

// Client-side helper to parse document.cookie
export const getClientCookies = () => {
    return parse(document.cookie || '');
};

export const getAuthFromCookies = (req: any) => {
    const cookies = parseCookies(req);
    return {
        token: cookies['auth-token'],
        userId: cookies['user-id'],
        username: cookies['username'],
    };
};
