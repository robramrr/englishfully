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

  const flagButtonClass = (isActive: boolean) =>
    isCompact
      ? `p-0 border-0 bg-transparent text-xl leading-none transition-all duration-200 hover:scale-110 ${
          isActive ? 'opacity-100 scale-110' : 'opacity-55 hover:opacity-85'
        }`
      : `text-xl leading-none px-3 py-2 rounded-lg comic-border min-w-[2.75rem] flex items-center justify-center transition-all duration-200 ${
          isActive
            ? 'bg-[var(--comic-primary)] text-white comic-shadow-md scale-105'
            : 'bg-white text-[var(--comic-dark)] comic-shadow-sm hover:comic-shadow-md hover:scale-105'
        }`;

  return (
    <div
      className={`flex ${isCompact ? 'flex-col items-center pl-2.5' : 'items-center space-x-1'} ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => handleLanguageChange('en')}
        className={flagButtonClass(language === 'en')}
        aria-label="Switch to English"
        aria-pressed={language === 'en'}
      >
        <span aria-hidden="true">🇺🇸</span>
      </button>
      {isCompact && (
        <div
          className="h-0.5 w-6 bg-[var(--comic-black)] shrink-0 my-0.5"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => handleLanguageChange('th')}
        className={flagButtonClass(language === 'th')}
        aria-label="Switch to Thai"
        aria-pressed={language === 'th'}
      >
        <span aria-hidden="true">🇹🇭</span>
      </button>
    </div>
  );
};

export default LanguageToggle;

