'use client';

import React from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { Language } from '../i18n/types';

interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '', variant = 'default' }) => {
  const { language, setLanguage } = useI18n();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`flex items-center ${isCompact ? 'space-x-1' : 'space-x-1'} ${className}`}>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`
          comic-text font-bold transition-all duration-200
          ${isCompact ? 'text-xs px-2 py-1 rounded-md border-2 border-[var(--comic-black)]' : 'text-base px-3 py-2 rounded-lg comic-border'}
          ${language === 'en' 
            ? `${isCompact ? 'bg-[var(--comic-primary)] text-white' : 'bg-[var(--comic-primary)] text-white comic-shadow-md scale-105'}`
            : `${isCompact ? 'bg-white/70 text-[var(--comic-dark)] hover:bg-white' : 'bg-white text-[var(--comic-dark)] comic-shadow-sm hover:comic-shadow-md hover:scale-105'}`
          }
          ${isCompact ? 'hover:opacity-90' : ''}
        `}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className={`text-[var(--comic-dark)] font-bold ${isCompact ? 'text-xs opacity-70' : 'text-lg'}`}>|</span>
      <button
        onClick={() => handleLanguageChange('th')}
        className={`
          comic-text font-bold transition-all duration-200
          ${isCompact ? 'text-xs px-2 py-1 rounded-md border-2 border-[var(--comic-black)]' : 'text-base px-3 py-2 rounded-lg comic-border'}
          ${language === 'th' 
            ? `${isCompact ? 'bg-[var(--comic-primary)] text-white' : 'bg-[var(--comic-primary)] text-white comic-shadow-md scale-105'}`
            : `${isCompact ? 'bg-white/70 text-[var(--comic-dark)] hover:bg-white' : 'bg-white text-[var(--comic-dark)] comic-shadow-sm hover:comic-shadow-md hover:scale-105'}`
          }
          ${isCompact ? 'hover:opacity-90' : ''}
        `}
        aria-label="Switch to Thai"
      >
        TH
      </button>
    </div>
  );
};

export default LanguageToggle;

