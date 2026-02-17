import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export const useRouteChangeConversations = () => {
  const pathname = usePathname();
  const hasLoadedConversations = useRef(false);

  useEffect(() => {
    // Only load conversations once when first visiting chat pages
    if (pathname && (pathname === '/chat' || pathname.startsWith('/chat/')) && !hasLoadedConversations.current) {
      hasLoadedConversations.current = true;
    }
  }, [pathname]);
};
