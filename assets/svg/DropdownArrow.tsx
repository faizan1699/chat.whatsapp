import React from 'react';

interface DropdownArrowProps {
    isOpen?: boolean;
    className?: string;
}

const DropdownArrow = ({ isOpen = false, className = '' }: DropdownArrowProps) => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${className}`} 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
        >
            <path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );
};

export default DropdownArrow;
