import { useEffect, RefObject } from 'react';

interface UseClickOutsideProps {
    ref: RefObject<HTMLElement>;
    handler: () => void;
    enabled?: boolean;
}

/**
 * Hook to handle clicks outside a component
 * @param ref - Reference to the element to watch for outside clicks
 * @param handler - Function to call when click outside occurs
 * @param enabled - Whether the click outside functionality is enabled (default: true)
 */
export function useClickOutside({ ref, handler, enabled = true }: UseClickOutsideProps) {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, handler, enabled]);
}
