import React, { useRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'premium' | 'glow' | 'outline';
  hover3dTilt?: boolean;
  tiltMaxAngle?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'premium',
  hover3dTilt = false,
  tiltMaxAngle = 10,
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover3dTilt || !cardRef.current) return;

    // Performance bypass: Disable tilt on mobile/tablets
    if (window.innerWidth < 1024 || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top;  // y position within the element
    
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    
    // Calculate rotation angles (degrees)
    const rotateY = ((x - midX) / midX) * tiltMaxAngle;
    const rotateX = ((midY - y) / midY) * tiltMaxAngle;

    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    el.style.transition = 'transform 0.1s ease-out';
  };

  const handleMouseLeave = () => {
    if (!hover3dTilt || !cardRef.current) return;
    const el = cardRef.current;
    el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    el.style.transition = 'transform 0.5s ease';
  };

  const variantStyles = {
    premium: 'bg-bg-secondary border border-border-subtle shadow-premium-sm hover:shadow-premium-md text-text-primary rounded-md',
    glow: 'bg-bg-secondary border border-accent-gold/30 shadow-glow-gold hover:shadow-premium-lg rounded-md',
    outline: 'border border-border-subtle bg-transparent text-text-primary rounded-md',
  };

  const dynamicStyle: React.CSSProperties = hover3dTilt
    ? {
        transformStyle: 'preserve-3d',
      }
    : {};

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative p-6 overflow-hidden ${variantStyles[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      {/* Light shimmer overlay reflection when 3D tilt is enabled */}
      {hover3dTilt && (
        <div 
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100" 
          style={{ transform: 'translateZ(20px)' }}
        />
      )}
      <div style={hover3dTilt ? { transform: 'translateZ(10px)' } : undefined}>
        {children}
      </div>
    </div>
  );
};
