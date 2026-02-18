import React from 'react';

export default function UserSVG({ width = "40", height = "40", className = "", stroke = "#00a884" }) {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" className={className}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
