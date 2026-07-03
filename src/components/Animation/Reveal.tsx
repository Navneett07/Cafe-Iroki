import React from 'react';
import { motion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  scale?: boolean;
  className?: string;
  width?: 'w-full' | 'w-auto' | string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.4,
  scale = false,
  className = '',
  width = 'w-full',
}) => {
  // Performance bypass: Disable Framer Motion animations on mobile devices (< 768px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) {
    return <div className={`${width} ${className}`}>{children}</div>;
  }

  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
    none: { x: 0, y: 0 },
  };

  const initial = {
    opacity: 0,
    ...directions[direction],
    scale: scale ? 0.95 : 1,
  };

  const animate = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Custom Apple cubic bezier ease-out-expo
      }}
      className={`${width} ${className}`}
    >
      {children}
    </motion.div>
  );
};
