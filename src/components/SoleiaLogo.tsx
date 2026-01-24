import React from 'react';

interface SoleiaLogoProps {
  className?: string;
  size?: number;
}

const SoleiaLogo: React.FC<SoleiaLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer radiating rays */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {/* Top ray */}
        <line x1="50" y1="8" x2="50" y2="20" />
        {/* Top-right rays */}
        <line x1="65" y1="12" x2="60" y2="22" />
        <line x1="78" y1="22" x2="70" y2="30" />
        <line x1="88" y1="35" x2="78" y2="40" />
        {/* Right ray */}
        <line x1="92" y1="50" x2="80" y2="50" />
        {/* Bottom-right rays */}
        <line x1="88" y1="65" x2="78" y2="60" />
        <line x1="78" y1="78" x2="70" y2="70" />
        <line x1="65" y1="88" x2="60" y2="78" />
        {/* Bottom ray */}
        <line x1="50" y1="92" x2="50" y2="80" />
        {/* Bottom-left rays */}
        <line x1="35" y1="88" x2="40" y2="78" />
        <line x1="22" y1="78" x2="30" y2="70" />
        <line x1="12" y1="65" x2="22" y2="60" />
        {/* Left ray */}
        <line x1="8" y1="50" x2="20" y2="50" />
        {/* Top-left rays */}
        <line x1="12" y1="35" x2="22" y2="40" />
        <line x1="22" y1="22" x2="30" y2="30" />
        <line x1="35" y1="12" x2="40" y2="22" />
      </g>
      
      {/* Center circle (hollow) */}
      <circle
        cx="50"
        cy="50"
        r="18"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      
      {/* Inner decorative circle */}
      <circle
        cx="50"
        cy="50"
        r="12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
};

export default SoleiaLogo;
