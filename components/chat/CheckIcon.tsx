import React from 'react';

interface CheckIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const CheckIcon = ({ size = 10, color = "currentColor", className = "" }: CheckIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
};

export default CheckIcon;
