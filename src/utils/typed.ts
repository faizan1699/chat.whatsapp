import Typed from 'typed.js';

export interface TypedOptions {
    strings: string[];
    typeSpeed?: number;
    backSpeed?: number;
    backDelay?: number;
    loop?: boolean;
    showCursor?: boolean;
    cursorChar?: string;
    onComplete?: (self: Typed) => void;
    onBegin?: (self: Typed) => void;
    onStringTyped?: (arrayPos: number, self: Typed) => void;
    onLastStringBackspaced?: (self: Typed) => void;
    onTypingPaused?: (arrayPos: number, self: Typed) => void;
    onTypingResumed?: (arrayPos: number, self: Typed) => void;
    onReset?: (self: Typed) => void;
    onStop?: (arrayPos: number, self: Typed) => void;
    onStart?: (arrayPos: number, self: Typed) => void;
    onDestroy?: (self: Typed) => void;
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
