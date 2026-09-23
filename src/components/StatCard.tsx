import React from 'react';

export interface StatCardProps {
  id?: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  iconBgColor?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose';
  footer?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  label,
  value,
  unit,
  subtext,
  icon,
  iconBgColor,
  badge,
  onClick,
  className = '',
  variant = 'default',
  footer,
}) => {
  // Border and background variants (keeping existing visual identity intact)
  let variantStyles = 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100';
  let defaultIconBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400';
  let labelColor = 'text-stone-500 dark:text-stone-400';

  if (variant === 'purple') {
    variantStyles = 'bg-purple-50/40 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/70 hover:border-purple-500/80';
    defaultIconBg = 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300';
    labelColor = 'text-purple-800 dark:text-purple-300';
  } else if (variant === 'amber') {
    variantStyles = 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/70 hover:border-amber-500/80';
    defaultIconBg = 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300';
    labelColor = 'text-amber-800 dark:text-amber-300';
  } else if (variant === 'blue') {
    variantStyles = 'bg-sky-50/40 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/70 hover:border-sky-500/80';
    defaultIconBg = 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300';
    labelColor = 'text-sky-800 dark:text-sky-300';
  } else if (variant === 'rose') {
    variantStyles = 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/70 hover:border-rose-500/80';
    defaultIconBg = 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300';
    labelColor = 'text-rose-800 dark:text-rose-300';
  }

  const isClickable = Boolean(onClick);

  return (
    <div
      id={id}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`group relative rounded-2xl border p-4 sm:p-5 shadow-xs transition-all flex flex-col justify-between ${variantStyles} ${
        isClickable
          ? 'cursor-pointer hover:shadow-sm hover:border-emerald-500/80 dark:hover:border-emerald-500/80'
          : ''
      } ${className}`}
      style={{
        padding: 'var(--space-4, 16px)',
      }}
    >
      <div>
        {/* Top Header: Label + Icon */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`font-semibold uppercase tracking-wider ${labelColor}`}
            style={{ fontSize: 'var(--text-xs, 12px)' }}
          >
            {label}
          </span>
          {badge && <div className="ml-auto mr-2">{badge}</div>}
          {icon && (
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                iconBgColor || defaultIconBg
              }`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Hero Stat Number: strictly unified with --text-xl (28px) */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="hero-stat-number text-stone-900 dark:text-stone-100 font-bold"
            style={{
              fontSize: 'var(--text-xl, 28px)',
              lineHeight: 1.15,
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              className="text-stone-500 dark:text-stone-400 font-medium"
              style={{ fontSize: 'var(--text-xs, 12px)' }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Optional subtext */}
        {subtext && (
          <div
            className="mt-1 text-stone-500 dark:text-stone-400 font-normal"
            style={{ fontSize: 'var(--text-xs, 12px)' }}
          >
            {subtext}
          </div>
        )}
      </div>

      {/* Optional Card Footer */}
      {footer && (
        <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/80 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
};
