'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavigationProps {
  items?: NavigationItem[];
  logoText?: string;
  showThemeToggle?: boolean;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  items = [],
  logoText = 'Faro',
  showThemeToggle = true,
  className = ''
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={clsx('sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-800', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo text={logoText} />

          {/* Desktop Navigation */}
          {items.length > 0 && (
            <div className="hidden md:flex items-center space-x-8">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="nav-link"
                  {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {showThemeToggle && <ThemeToggle variant="minimal" />}
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && items.length > 0 && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="px-4 py-4 space-y-4">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};



