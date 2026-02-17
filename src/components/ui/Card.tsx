'use client';

import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, glow = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass-card p-6 t-text',
        hover && 'hover-glow cursor-pointer',
        glow && 'glow-border',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
