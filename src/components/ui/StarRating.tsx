'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  return (
    <div className={clsx('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = i === Math.floor(rating) && rating % 1 !== 0;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={clsx(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              size={size}
              className={clsx(
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : partial
                  ? 'fill-yellow-400/50 text-yellow-400/50'
                  : 'text-dark-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
