'use client';

import React from 'react';
import { clsx } from 'clsx';
import { getInitials } from '@/utils/helpers';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover border-2 border-primary-500/30', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500 font-semibold text-white',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
