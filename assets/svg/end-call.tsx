import React from 'react';

export default function EndCallSVG({ size = 28, className = "" }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className}>
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.994.994 0 0 1 0-1.41C2.75 9.21 6.92 7 12 7s9.25 2.21 11.71 4.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29s-.53-.1-.7-.28c-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1c-1.45-.48-3-.73-4.6-.73z"></path>
        </svg>
    );
}
