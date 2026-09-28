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
  variant?: 'default' | 'brand' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose';
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
  // Theme Spec styles: clean card surface with hairline border (#E3E1D8 / #33322E)
  let variantStyles = 'bg-white dark:bg-[#1F1F1D] border-[#E3E1D8] dark:border-[#33322E] text-[#1F1F1D] dark:text-[#F1F0EA]';
  let defaultIconBg = 'bg-[#E7F4EE] dark:bg-[#04342C] text-[#0F6E56] dark:text-[#5DCAA5]';
  let labelColor = 'text-[#5F5E5A] dark:text-[#B4B2A9]';

  // Strict anti-AI & brand green specification: replace purple with brand green
  if (variant === 'purple' || variant === 'emerald' || variant === 'brand') {
    variantStyles = 'bg-white dark:bg-[#1F1F1D] border-[#E3E1D8] dark:border-[#33322E] text-[#1F1F1D] dark:text-[#F1F0EA]';
    defaultIconBg = 'bg-[#E7F4EE] dark:bg-[#04342C] text-[#0F6E56] dark:text-[#5DCAA5]';
    labelColor = 'text-[#0F6E56] dark:text-[#5DCAA5]';
  } else if (variant === 'amber') {
    variantStyles = 'bg-white dark:bg-[#1F1F1D] border-[#E3E1D8] dark:border-[#33322E] text-[#1F1F1D] dark:text-[#F1F0EA]';
    defaultIconBg = 'bg-[#FAEEDA] dark:bg-[#412402] text-[#854F0B] dark:text-[#EF9F27]';
    labelColor = 'text-[#854F0B] dark:text-[#EF9F27]';
  } else if (variant === 'rose') {
    variantStyles = 'bg-white dark:bg-[#1F1F1D] border-[#E3E1D8] dark:border-[#33322E] text-[#1F1F1D] dark:text-[#F1F0EA]';
    defaultIconBg = 'bg-[#FCEBEB] dark:bg-[#501313] text-[#A32D2D] dark:text-[#F09595]';
    labelColor = 'text-[#A32D2D] dark:text-[#F09595]';
  } else if (variant === 'blue') {
    variantStyles = 'bg-white dark:bg-[#1F1F1D] border-[#E3E1D8] dark:border-[#33322E] text-[#1F1F1D] dark:text-[#F1F0EA]';
    defaultIconBg = 'bg-[#E7F4EE] dark:bg-[#04342C] text-[#0F6E56] dark:text-[#5DCAA5]';
    labelColor = 'text-[#5F5E5A] dark:text-[#B4B2A9]';
  }

  const isClickable = Boolean(onClick);

  return (
    <div
      id={id}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`group relative rounded-xl border p-4 shadow-none transition-colors flex flex-col justify-between ${variantStyles} ${
        isClickable
          ? 'cursor-pointer hover:border-[#0F6E56] dark:hover:border-[#5DCAA5]'
          : ''
      } ${className}`}
    >
      <div>
        {/* Top Header: Eyebrow Label (12px, 500, 1.4, tracking 0.03em) + Icon */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-[12px] font-medium uppercase tracking-[0.03em] leading-[1.4] ${labelColor}`}
          >
            {label}
          </span>
          {badge && <div className="ml-auto mr-2">{badge}</div>}
          {icon && (
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                iconBgColor || defaultIconBg
              }`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Big Stat Number: 26px, 500, 1.2, tabular figures */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[26px] font-medium leading-[1.2] font-mono tabular-nums text-[#1F1F1D] dark:text-[#F1F0EA]">
            {value}
          </span>
          {unit && (
            <span className="text-[12px] font-normal text-[#8A897F] dark:text-[#7C7A72]">
              {unit}
            </span>
          )}
        </div>

        {/* Optional subtext: 13px, 400, 1.5 */}
        {subtext && (
          <div className="mt-1 text-[13px] font-normal leading-[1.5] text-[#5F5E5A] dark:text-[#B4B2A9]">
            {subtext}
          </div>
        )}
      </div>

      {/* Optional Card Footer: 13px, 400, 1.5 */}
      {footer && (
        <div className="mt-3 pt-2.5 border-t border-[#E3E1D8] dark:border-[#33322E] text-[13px] font-normal leading-[1.5]">
          {footer}
        </div>
      )}
    </div>
  );
};
