import Typed from 'typed.js';

export interface TypedOptions {
    strings: string[];
    typeSpeed?: number;
    backSpeed?: number;
    backDelay?: number;
    loop?: boolean;
    showCursor?: boolean;
    cursorChar?: string;
}

export const createTypedInstance = (element: HTMLElement, options: TypedOptions) => {
    return new Typed(element, {
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1000,
        loop: true,
        showCursor: true,
        cursorChar: '|',
        ...options
    });
};

export const defaultLoaderStrings = [
    'Initializing NexChat...',
    'Connecting to servers...',
    'Securing your connection...',
    'Preparing your workspace...',
    'Loading...'
];
