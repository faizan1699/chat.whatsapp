import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/message';

interface UseNotificationsReturn {
    requestPermission: () => Promise<void>;
    showNotification: (data: Message, username: string, selectedUser: string | null) => void;
    permission: NotificationPermission;
}

export function useNotifications(): UseNotificationsReturn {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const isWindowFocusedRef = useRef(true);

    useEffect(() => {
        const requestNotificationPermission = async () => {
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    try {
                        const perm = await Notification.requestPermission();
                        setPermission(perm);
                    } catch (error) {
                        setPermission('denied');
                    }
                } else {
                    setPermission(Notification.permission);
                }
            }
        };

        requestNotificationPermission();

        const handleFocus = () => {
            isWindowFocusedRef.current = true;
        };

        const handleBlur = () => {
            isWindowFocusedRef.current = false;
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const showNotification = (data: Message, username: string, selectedUser: string | null) => {
        if (!('Notification' in window)) {
            return;
        }

        if (permission !== 'granted') {
            return;
        }

        if (isWindowFocusedRef.current) {
            return;
        }

        if (selectedUser === data.from) {
            return;
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const isIncoming = data.from !== username;
        const notificationTitle = isIncoming ? `New message from ${data.from}` : 'Message sent';
        const notificationBody = isIncoming ? data.message : `You: ${data.message}`;

        const options: NotificationOptions = {
            body: notificationBody,
            icon: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.from}`,
            tag: 'chat-msg',
            requireInteraction: isMobile,
            silent: false,
            badge: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.from}`
        };

        if (isMobile && 'vibrate' in navigator) {
            navigator.vibrate([2000, 100]);
        }

        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(notificationTitle, options);
            }).catch(() => {
                try {
                    const notification = new Notification(notificationTitle, options);
                    setTimeout(() => {
                        if (notification.close) {
                            notification.close();
                        }
                    }, 5000);
                } catch (error) {
                    console.warn('Notification failed:', error);
                }
            });
        } else {
            try {
                const notification = new Notification(notificationTitle, options);
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
                notification.onerror = (error) => {};
                setTimeout(() => {
                    if (notification.close) {
                        notification.close();
                    }
                }, 5000);
            } catch (error) {
                console.warn('Notification failed:', error);
            }
        }
    };

    return {
        requestPermission: async () => {
            if ('Notification' in window) {
                try {
                    const perm = await Notification.requestPermission();
                    setPermission(perm);
                } catch (error) {
                    setPermission('denied');
                }
            }
        },
        showNotification,
        permission
    };
}
