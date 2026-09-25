import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface NavIconImageProps {
  src: string;
  alt: string;
  fallbackIcon: LucideIcon;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NavIconImage: React.FC<NavIconImageProps> = ({
  src,
  alt,
  fallbackIcon: FallbackIcon,
  isActive = false,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-7 h-7 rounded-lg',
    lg: 'w-8 h-8 rounded-xl',
  }[size];

  const iconSizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center shrink-0 ${sizeClasses} ${
          isActive
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-stone-800 text-stone-400'
        } ${className}`}
        aria-hidden="true"
      >
        <FallbackIcon className={iconSizeClasses} />
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden shadow-2xs transition-all duration-200 ${sizeClasses} ${
        isActive
          ? 'ring-2 ring-emerald-300 shadow-sm shadow-emerald-950/40 scale-105'
          : 'ring-1 ring-stone-700/70 opacity-90 group-hover:opacity-100 group-hover:ring-stone-400'
      } ${className}`}
      aria-hidden="true"
    >
      <img
        src={src}
        alt={alt}
        loading="eager"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />
      {isActive && (
        <span className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
      )}
    </div>
  );
};
