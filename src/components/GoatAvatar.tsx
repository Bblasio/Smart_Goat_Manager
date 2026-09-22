import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, X } from 'lucide-react';

interface GoatAvatarProps {
  photoUrl?: string;
  gender: 'Male' | 'Female' | string;
  name?: string;
  tagNumber?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  canUpload?: boolean;
  onPhotoChange?: (photoDataUrl: string | undefined) => void;
  className?: string;
}

export const GoatAvatar: React.FC<GoatAvatarProps> = ({
  photoUrl,
  gender,
  name,
  tagNumber,
  size = 'md',
  canUpload = false,
  onPhotoChange,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMale = (gender || '').toLowerCase().startsWith('m');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  }[size];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 500px dimension for fast local storage & RTDB persistence
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImageError(false);
          onPhotoChange?.(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoChange?.(undefined);
    setImageError(false);
  };

  const fallbackPhoto = isMale ? '/jamunapari-goats.png' : '/images/nav/doe.jpg';
  const effectivePhoto = (photoUrl && !imageError) ? photoUrl : fallbackPhoto;

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      {/* Hidden file input only if canUpload is explicitly true */}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      {/* Main Avatar Container */}
      <div
        onClick={() => {
          if (canUpload) fileInputRef.current?.click();
        }}
        className={`relative overflow-hidden rounded-full flex items-center justify-center transition-all bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs ${sizeClasses} ${
          canUpload ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500' : ''
        }`}
        title={tagNumber || name || (isMale ? 'Male Buck' : 'Female Doe')}
      >
        <img
          src={effectivePhoto}
          alt={tagNumber || name || (isMale ? 'Buck' : 'Doe')}
          referrerPolicy="no-referrer"
          onError={() => {
            if (photoUrl && !imageError) setImageError(true);
          }}
          className="w-full h-full object-cover rounded-full"
        />

        {/* Hover Camera Overlay if canUpload */}
        {canUpload && (
          <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[1px]">
            {isProcessing ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4 text-white drop-shadow-sm" />
            )}
          </div>
        )}
      </div>

      {/* Tiny gender indicator badge at bottom right */}
      {size !== 'sm' && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border border-white dark:border-stone-900 flex items-center justify-center font-bold text-[9px] shadow-xs ${
            size === 'xl' ? 'w-5 h-5 text-[11px]' : 'w-4 h-4 text-[9px]'
          } ${
            isMale
              ? 'bg-blue-600 text-white'
              : 'bg-rose-500 text-white'
          }`}
          title={isMale ? 'Male (Buck)' : 'Female (Doe)'}
        >
          {isMale ? '♂' : '♀'}
        </div>
      )}

      {/* Remove photo button only if canUpload and user uploaded a custom photo */}
      {canUpload && photoUrl && !imageError && (size === 'lg' || size === 'xl') && (
        <button
          type="button"
          onClick={handleRemovePhoto}
          className="absolute -top-1 -right-1 p-1 bg-stone-900/90 text-white hover:bg-rose-600 rounded-full shadow-md border border-white/40 transition-colors"
          title="Remove photo"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
