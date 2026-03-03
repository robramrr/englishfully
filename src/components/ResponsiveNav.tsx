'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n/I18nProvider';
import LanguageToggle from './LanguageToggle';

interface ResponsiveNavProps {
  className?: string;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({ className = '' }) => {
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveDropdown(null);
    setActiveMobileSection(null);
  };

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const toggleMobileSection = (section: string) => {
    setActiveMobileSection(activeMobileSection === section ? null : section);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest('nav')) {
        closeMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // If you resize from desktop->mobile while a desktop dropdown is open, reset it.
  useEffect(() => {
    if (!isMenuOpen) return;
    setActiveDropdown(null);
  }, [isMenuOpen]);

  const studentDropdown = [
    { href: '/online-learning', label: t.nav.onlineLearning },
    { href: '/in-person-learning', label: t.nav.inPersonLearning },
  ];

  const aiDropdown = [
    { href: '/ai/language-tutor', label: t.ai.voiceCoach },
    { href: '/ai/lesson-hub', label: t.ai.lessonGenerator },
    { href: '/ai/video-lab', label: t.ai.videoLab },
  ];

  const aboutDropdown = [
    { href: '/about', label: t.nav.companyOverview },
    { href: '/rd-technology', label: t.nav.rdTechnology },
    { href: '/contact', label: t.nav.contact },
  ];

  const topLevelLinks: Array<{ href: string; label: string }> = [];

  return (
    <nav className={`relative ${className}`}>
      {/* Desktop Navigation */}
      <div className="hidden lg:flex flex-col items-end">
        {/* Row 1: Main menu */}
        <div className="flex items-center space-x-4">

        {/* AI Features Dropdown - First Item */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('ai')}
            onMouseEnter={() => setActiveDropdown('ai')}
            className="comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 text-white"
            style={{ backgroundColor: 'var(--comic-success)' }}
          >
            {t.nav.aiFeatures} ▼
          </button>
          {activeDropdown === 'ai' && (
            <div 
              className="absolute top-full left-0 pt-2 w-64 z-50"
              onMouseEnter={() => setActiveDropdown('ai')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="bg-white comic-border-thick comic-shadow-xl rounded-lg overflow-hidden">
              {aiDropdown.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block px-4 py-3 text-[var(--comic-dark)] font-bold text-lg hover:bg-[var(--comic-light)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Students Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('students')}
            onMouseEnter={() => setActiveDropdown('students')}
            className="comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 text-white"
            style={{ backgroundColor: 'var(--comic-accent)' }}
          >
            {t.nav.students} ▼
          </button>
          {activeDropdown === 'students' && (
            <div 
              className="absolute top-full left-0 pt-2 w-48 z-50"
              onMouseEnter={() => setActiveDropdown('students')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="bg-white comic-border-thick comic-shadow-xl rounded-lg overflow-hidden">
              {studentDropdown.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block px-4 py-3 text-[var(--comic-dark)] font-bold text-lg hover:bg-[var(--comic-light)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Teachers Link */}
        <Link
          href="/teacher-resources"
          className="comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 text-white"
          style={{ backgroundColor: 'var(--comic-danger)' }}
        >
          {t.nav.teachers}
        </Link>

        {/* About Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('about')}
            onMouseEnter={() => setActiveDropdown('about')}
            className="comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 text-black"
            style={{ backgroundColor: 'var(--comic-warning)' }}
          >
            {t.nav.about} ▼
          </button>
          {activeDropdown === 'about' && (
            <div 
              className="absolute top-full left-0 pt-2 w-56 z-50"
              onMouseEnter={() => setActiveDropdown('about')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <div className="bg-white comic-border-thick comic-shadow-xl rounded-lg overflow-hidden">
              {aboutDropdown.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="block px-4 py-3 text-[var(--comic-dark)] font-bold text-lg hover:bg-[var(--comic-light)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Level Links */}
        {topLevelLinks.map((link, index) => {
          const colors = ['var(--comic-warning)', 'var(--comic-dark)'];
          const textColors = ['text-black', 'text-white'];
          
          return (
            <Link
              key={index}
              href={link.href}
              className={`comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 ${textColors[index]}`}
              style={{ backgroundColor: colors[index] }}
            >
              {link.label}
            </Link>
          );
        })}

        {/* Download App CTA */}
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href="#download"
            className="comic-text font-bold text-lg px-3 py-2 rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200 hover:scale-105 text-black"
            style={{ backgroundColor: 'var(--comic-yellow)' }}
          >
            {t.nav.downloadApp}
          </Link>
        </div>

        </div>

        {/* Row 2: Language toggle (own line, right-aligned) */}
        <div className="w-full flex justify-end mt-2">
          <LanguageToggle variant="compact" />
        </div>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden w-12 h-12 bg-[var(--comic-primary)] rounded-lg comic-border-thick comic-shadow-md flex flex-col items-center justify-center space-y-1 hover:comic-shadow-lg transition-all duration-200 hover:scale-105"
        aria-label="Toggle navigation menu"
      >
        <span 
          className={`w-6 h-1 bg-white rounded-full transition-all duration-300 ${
            isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
          }`}
        />
        <span 
          className={`w-6 h-1 bg-white rounded-full transition-all duration-300 ${
            isMenuOpen ? 'opacity-0' : ''
          }`}
        />
        <span 
          className={`w-6 h-1 bg-white rounded-full transition-all duration-300 ${
            isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`}
        />
      </button>

      {/* Mobile Dropdown Menu */}
      <div 
        className={`lg:hidden fixed top-20 right-4 w-80 bg-[var(--comic-white)] comic-border-thick comic-shadow-xl rounded-lg overflow-hidden transition-all duration-300 transform z-[9999] ${
          isMenuOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="p-0">

          {/* AI Features Section - First Item */}
          <div className="comic-border-b-2 border-b-4 border-[var(--comic-black)]">
            <button
              type="button"
              onClick={() => toggleMobileSection('ai')}
              className="w-full text-left px-6 py-3 comic-text font-bold text-xl text-white flex items-center justify-between"
              style={{ backgroundColor: 'var(--comic-success)' }}
              aria-expanded={activeMobileSection === 'ai'}
              aria-controls="mobile-section-ai"
            >
              <span>🤖 {t.nav.aiFeatures}</span>
              <span className="font-bold">{activeMobileSection === 'ai' ? '−' : '+'}</span>
            </button>
            {activeMobileSection === 'ai' && (
              <div id="mobile-section-ai">
                {aiDropdown.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    onClick={closeMenu}
                    className="block px-8 py-3 comic-text font-bold text-lg hover:brightness-110 transition-all duration-200 text-white"
                    style={{ backgroundColor: 'var(--comic-success)', opacity: 0.8 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Students Section */}
          <div className="comic-border-b-2 border-b-4 border-[var(--comic-black)]">
            <button
              type="button"
              onClick={() => toggleMobileSection('students')}
              className="w-full text-left px-6 py-3 comic-text font-bold text-xl text-white flex items-center justify-between"
              style={{ backgroundColor: 'var(--comic-accent)' }}
              aria-expanded={activeMobileSection === 'students'}
              aria-controls="mobile-section-students"
            >
              <span>👨‍🎓 {t.nav.students}</span>
              <span className="font-bold">{activeMobileSection === 'students' ? '−' : '+'}</span>
            </button>
            {activeMobileSection === 'students' && (
              <div id="mobile-section-students">
                {studentDropdown.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    onClick={closeMenu}
                    className="block px-8 py-3 comic-text font-bold text-lg hover:brightness-110 transition-all duration-200 text-white"
                    style={{ backgroundColor: 'var(--comic-accent)', opacity: 0.8 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Teachers Link */}
          <Link
            href="/teacher-resources"
            onClick={closeMenu}
            className="block px-6 py-4 comic-text font-bold text-xl hover:brightness-110 transition-all duration-200 text-white comic-border-b-2 border-b-4 border-[var(--comic-black)]"
            style={{ backgroundColor: 'var(--comic-danger)' }}
          >
            👩‍🏫 {t.nav.teachers}
          </Link>

          {/* About Section */}
          <div className="comic-border-b-2 border-b-4 border-[var(--comic-black)]">
            <button
              type="button"
              onClick={() => toggleMobileSection('about')}
              className="w-full text-left px-6 py-3 comic-text font-bold text-xl text-black flex items-center justify-between"
              style={{ backgroundColor: 'var(--comic-warning)' }}
              aria-expanded={activeMobileSection === 'about'}
              aria-controls="mobile-section-about"
            >
              <span>🏢 {t.nav.about}</span>
              <span className="font-bold">{activeMobileSection === 'about' ? '−' : '+'}</span>
            </button>
            {activeMobileSection === 'about' && (
              <div id="mobile-section-about">
                {aboutDropdown.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    onClick={closeMenu}
                    className="block px-8 py-3 comic-text font-bold text-lg hover:brightness-110 transition-all duration-200 text-black"
                    style={{ backgroundColor: 'var(--comic-warning)', opacity: 0.8 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top Level Links */}
          {topLevelLinks.map((link, index) => {
            const colors = ['var(--comic-warning)', 'var(--comic-dark)'];
            const textColors = ['text-black', 'text-white'];
            const isLast = index === topLevelLinks.length - 1;
            
            return (
              <Link
                key={index}
                href={link.href}
                onClick={closeMenu}
                className={`block px-6 py-4 comic-text font-bold text-xl hover:brightness-110 transition-all duration-200 ${textColors[index]} ${!isLast ? 'comic-border-b-2 border-b-4 border-[var(--comic-black)]' : ''}`}
                style={{ backgroundColor: colors[index] }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Download App CTA */}
          <div className="px-6 py-4 text-center">
            <Link
              href="#download"
              onClick={closeMenu}
              className="inline-block px-4 py-2 comic-text font-bold text-lg text-black rounded-lg comic-border comic-shadow-sm hover:comic-shadow-md transition-all duration-200"
              style={{ backgroundColor: 'var(--comic-yellow)' }}
            >
              {t.nav.downloadApp}
            </Link>
          </div>

          {/* Language Toggle - Mobile */}
          <div className="px-6 py-4 flex justify-center">
            <LanguageToggle variant="default" />
          </div>
        </div>
        
        {/* Comic book style decorative elements */}
        <div className="absolute top-2 right-2 w-4 h-4 bg-[var(--comic-yellow)] rounded-full comic-border comic-shadow-sm"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-[var(--comic-pink)] rounded-full comic-border comic-shadow-sm"></div>
        <div className="absolute top-1/2 left-2 w-2 h-2 bg-[var(--comic-success)] rounded-full comic-border comic-shadow-sm"></div>
        <div className="absolute top-1/4 left-1/2 w-2.5 h-2.5 bg-[var(--comic-danger)] rounded-full comic-border comic-shadow-sm transform -translate-x-1/2"></div>
      </div>

    </nav>
  );
};

export default ResponsiveNav;
