'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium t-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 t-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-xl px-4 py-2.5 t-text placeholder:t-text-muted transition-all duration-200',
              'focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20',
              icon && 'pl-10',
              error && 'border-red-500/50',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
