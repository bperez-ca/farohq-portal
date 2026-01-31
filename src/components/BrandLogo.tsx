"use client";

import React from 'react';
import { useBrandTheme } from '@/components/branding/BrandThemeProvider';
import { Loader2 } from 'lucide-react';

export interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  text?: string;
  fallbackText?: string;
  logoUrl?: string;
  alt?: string;
}

/**
 * BrandLogo component that displays the logo from brand theme
 * Shows spinner while loading or when no logo is available
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  text,
  fallbackText = '',
  logoUrl: propLogoUrl,
  alt: propAlt,
}) => {
  const { theme, loading } = useBrandTheme();

  // Use prop logoUrl if provided, otherwise use brandTheme logo_url
  const logoUrl = propLogoUrl || theme?.logo_url;
  const alt = propAlt || text || fallbackText || 'Logo';

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Show spinner while theme is loading or if no logo URL is available
  if ((loading && !propLogoUrl) || !logoUrl || imageError) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses[size]} flex items-center justify-center`}>
          <Loader2 className={`${iconSizes[size]} text-gray-500 animate-spin`} />
        </div>
        {showText && text && (
          <span className={`${textSizes[size]} font-bold text-gray-900 dark:text-white`}>
            {text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className={`${iconSizes[size]} text-gray-500 animate-spin`} />
          </div>
        )}
        <img
          src={logoUrl}
          alt={alt}
          className={`w-full h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          onLoad={() => {
            setImageError(false);
            setImageLoading(false);
          }}
        />
      </div>
      {showText && text && (
        <span className={`${textSizes[size]} font-bold text-gray-900 dark:text-white`}>
          {text}
        </span>
      )}
    </div>
  );
};

// Alias for backward compatibility
export const BrandLogoSimple: React.FC<BrandLogoProps> = BrandLogo;
