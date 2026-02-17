import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { conversationsManager } from '@/utils/conversationsManager';

export const useRouteChangeConversations = () => {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only trigger on route changes, not initial load
    if (previousPathRef.current !== null && previousPathRef.current !== pathname && pathname) {
      console.log('🔄 Route change detected:', previousPathRef.current, '->', pathname);
      
      // Only load conversations if navigating to chat-related pages
      if (pathname === '/chat' || pathname.startsWith('/chat/')) {
        console.log('📱 Loading conversations due to route change to chat page');
        conversationsManager.loadConversations('route-change').catch(error => {
          console.warn('⚠️ Failed to load conversations on route change:', error);
        });
      }
    }
    
    previousPathRef.current = pathname;
  }, [pathname]);
};
