import React from 'react';

interface GoatKidIconProps {
  className?: string;
  size?: number;
}

/**
 * Realistic Goat Kid (Caprine Livestock) Icon
 * Designed to seamlessly match Lucide icon standards (24x24 viewBox, 2px stroke, round caps/joins):
 * - Anatomically realistic caprine head & horn profile
 * - Backward-sweeping caprine horn
 * - Natural pendulous/drooping goat ear
 * - Slender caprine muzzle, chin, and neat goatee beard
 * - Curved neck leading into withers
 * - Subtle realistic almond eye
 */
export const GoatKidIcon: React.FC<GoatKidIconProps> = ({
  className = 'w-4 h-4',
  size = 24,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Backwards-sweeping caprine horn */}
      <path d="M12 6c.5-2.5 2.2-4 4.5-4 1.8 0 2.5 1 3 2.5" />

      {/* Realistic drooping goat ear */}
      <path d="M14 7.5c2 .2 3.8 1.2 4.2 2.8-.7 1.2-2.2 1.4-3.5.7" />

      {/* Realistic goat head, forehead slope, muzzle, and jaw profile */}
      <path d="M12 6L9 9 6.5 12c-.6.8-.6 1.8 0 2.5l.8 1c.5.6 1.2.9 2 .8l2.2-.4" />

      {/* Caprine chin goatee beard */}
      <path d="M8.5 16l-.7 2.5 1.5-1.5" />

      {/* Throat and chest / neck line */}
      <path d="M11.5 15.5l2 3.5 1.5 3" />

      {/* Nape and withers / back of neck */}
      <path d="M13.5 8l3.5 7 1.5 6" />

      {/* Realistic subtle eye */}
      <circle cx="9.2" cy="10.8" r=".75" fill="currentColor" />
    </svg>
  );
};
