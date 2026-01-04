"use client";

import { useEffect } from 'react';
import { useTheme } from '@farohq/ui';

/**
 * Favicon component that updates the favicon based on brand theme
 * This should be placed in the layout or root component
 */
export function Favicon() {
  const { brandTheme } = useTheme();

  useEffect(() => {
    if (!brandTheme?.faviconUrl) {
      return;
    }

    // Validate URL before trying to load
    let faviconUrl: URL | null = null;
    try {
      faviconUrl = new URL(brandTheme.faviconUrl);
    } catch (e) {
      // Invalid URL, skip favicon update
      console.warn('Invalid favicon URL:', brandTheme.faviconUrl);
      return;
    }

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel~='icon']");
    existingLinks.forEach((link) => link.remove());

    // Create new favicon link with error handling
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl.href;
    
    // Handle image load errors
    const img = new Image();
    img.onerror = () => {
      console.warn('Failed to load favicon:', faviconUrl.href);
      link.remove();
    };
    img.onload = () => {
      document.head.appendChild(link);
    };
    img.src = faviconUrl.href;

    // Cleanup function
    return () => {
      const links = document.querySelectorAll("link[rel~='icon']");
      links.forEach((l) => {
        if (l.getAttribute('href') === faviconUrl?.href) {
          l.remove();
        }
      });
    };
  }, [brandTheme?.faviconUrl]);

  return null; // This component doesn't render anything
}

