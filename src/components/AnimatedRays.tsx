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
      
      {/* Solar Flares - replacing particles */}
      <div className="absolute inset-0">
        {/* Left flare */}
        <div
          className="absolute w-48 h-32 rounded-full animate-solar-flare"
          style={{
            left: '5%',
            top: '10%',
            background: 'radial-gradient(ellipse at center, hsl(38 92% 50% / 0.3) 0%, hsl(38 92% 50% / 0) 70%)',
            filter: 'blur(8px)',
          }}
        />
        
        {/* Center-left flare */}
        <div
          className="absolute w-64 h-40 rounded-full animate-solar-flare-alt"
          style={{
            left: '25%',
            top: '20%',
            background: 'radial-gradient(ellipse at center, hsl(45 90% 55% / 0.25) 0%, hsl(45 90% 55% / 0) 70%)',
            filter: 'blur(12px)',
          }}
        />
        
        {/* Center flare */}
        <div
          className="absolute w-80 h-48 rounded-full animate-solar-flare"
          style={{
            left: '40%',
            top: '5%',
            background: 'radial-gradient(ellipse at center, hsl(32 85% 45% / 0.2) 0%, hsl(32 85% 45% / 0) 70%)',
            filter: 'blur(15px)',
            animationDelay: '3s',
          }}
        />
        
        {/* Right flare */}
        <div
          className="absolute w-56 h-36 rounded-full animate-solar-flare-alt"
          style={{
            right: '15%',
            top: '15%',
            background: 'radial-gradient(ellipse at center, hsl(38 92% 50% / 0.25) 0%, hsl(38 92% 50% / 0) 70%)',
            filter: 'blur(10px)',
            animationDelay: '1s',
          }}
        />
        
        {/* Far right subtle flare */}
        <div
          className="absolute w-40 h-28 rounded-full animate-solar-flare"
          style={{
            right: '3%',
            top: '25%',
            background: 'radial-gradient(ellipse at center, hsl(45 90% 55% / 0.2) 0%, hsl(45 90% 55% / 0) 70%)',
            filter: 'blur(6px)',
            animationDelay: '5s',
          }}
        />
      </div>
      
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent shimmer-slow" />
    </div>
  );
};

export default AnimatedRays;