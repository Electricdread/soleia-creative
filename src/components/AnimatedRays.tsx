import React from 'react';

const AnimatedRays: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
      
      {/* Animated golden rays */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        viewBox="0 0 1200 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="rayGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(38 92% 50% / 0)" />
            <stop offset="50%" stopColor="hsl(38 92% 50% / 0.4)" />
            <stop offset="100%" stopColor="hsl(38 92% 50% / 0)" />
          </linearGradient>
          <linearGradient id="rayGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(45 90% 55% / 0)" />
            <stop offset="50%" stopColor="hsl(45 90% 55% / 0.3)" />
            <stop offset="100%" stopColor="hsl(45 90% 55% / 0)" />
          </linearGradient>
        </defs>
        
        {/* Ray 1 - slow moving */}
        <rect
          x="-400"
          y="20"
          width="800"
          height="1"
          fill="url(#rayGradient1)"
          className="animate-ray-slow"
        />
        
        {/* Ray 2 - medium speed */}
        <rect
          x="-300"
          y="45"
          width="600"
          height="0.5"
          fill="url(#rayGradient2)"
          className="animate-ray-medium"
        />
        
        {/* Ray 3 - fast */}
        <rect
          x="-500"
          y="70"
          width="700"
          height="1"
          fill="url(#rayGradient1)"
          className="animate-ray-fast"
        />
      </svg>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40 animate-float-particle"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>
      
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent shimmer-slow" />
    </div>
  );
};

export default AnimatedRays;
