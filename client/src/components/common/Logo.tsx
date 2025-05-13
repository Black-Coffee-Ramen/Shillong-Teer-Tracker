import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
        <div className="relative bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-full flex items-center justify-center p-1.5 font-bold" style={{ width: '100%', height: '100%' }}>
          <span className="text-2xl">S</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-foreground font-bold leading-tight">Shillong</span>
        <span className="text-primary/80 text-sm leading-tight">Teer India</span>
      </div>
    </div>
  );
}

export function LogoIcon({ size = 'md', className }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-md"></div>
      <div className="relative bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-full flex items-center justify-center w-full h-full font-bold">
        <span className={cn(
          'text-primary-foreground',
          size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
        )}>S</span>
      </div>
    </div>
  );
}