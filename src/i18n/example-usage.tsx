/**
 * Example Usage of the i18n System
 * 
 * This file demonstrates various ways to use the internationalization system
 * in your components. Copy these patterns when building new features.
 */

'use client';

import { useI18n } from './I18nProvider';
import { Language } from './types';

/**
 * Example 1: Basic Translation Usage
 * The most common pattern - accessing translation strings
 */
export function BasicExample() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t.home.heroTitle}</h1>
      <p>{t.home.heroDescription}</p>
      <button>{t.home.startLearning}</button>
    </div>
  );
}

/**
 * Example 2: Language Detection and Conditional Rendering
 * Sometimes you need to render different content based on language
 */
export function ConditionalExample() {
  const { language, t } = useI18n();

  return (
    <div>
      <h2>{t.nav.about}</h2>
      
      {/* Thai-specific content */}
      {language === 'th' && (
        <p>เนื้อหาเฉพาะสำหรับผู้ใช้ไทย</p>
      )}
      
      {/* English-specific content */}
      {language === 'en' && (
        <p>Content specific to English users</p>
      )}
      
      {/* Content that appears in both languages but formatted differently */}
      <div className={language === 'th' ? 'font-thai' : 'font-latin'}>
        {t.mission.description}
      </div>
    </div>
  );
}

/**
 * Example 3: Manual Language Switching
 * Implementing custom language controls
 */
export function CustomLanguageSwitcher() {
  const { language, setLanguage, t: _t } = useI18n();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    // You can also add analytics tracking here
    console.log(`Language changed to: ${newLang}`);
  };

  return (
    <div>
      <p>Current Language: {language === 'en' ? 'English' : 'ไทย'}</p>
      
      <select 
        value={language} 
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
      >
        <option value="en">English</option>
        <option value="th">ไทย (Thai)</option>
      </select>
      
      {/* Alternative button approach */}
      <div>
        <button 
          onClick={() => handleLanguageChange('en')}
          disabled={language === 'en'}
        >
          English
        </button>
        <button 
          onClick={() => handleLanguageChange('th')}
          disabled={language === 'th'}
        >
          ไทย
        </button>
      </div>
    </div>
  );
}

/**
 * Example 4: Using Translations in Arrays/Maps
 * Working with dynamic content like lists
 */
export function DynamicListExample() {
  const { t } = useI18n();

  const features = [
    { id: 'voice', title: t.ai.voiceCoach, icon: '🎤' },
    { id: 'lesson', title: t.ai.lessonGenerator, icon: '📚' },
    { id: 'video', title: t.ai.videoLab, icon: '🎥' },
  ];

  return (
    <div>
      <h2>{t.nav.aiFeatures}</h2>
      <ul>
        {features.map((feature) => (
          <li key={feature.id}>
            <span>{feature.icon}</span>
            <span>{feature.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 5: Form with Translated Labels and Placeholders
 * Common pattern for forms and inputs
 */
export function FormExample() {
  const { t: _t, language } = useI18n();

  return (
    <form>
      <div>
        <label htmlFor="name">
          {language === 'en' ? 'Name' : 'ชื่อ'}
        </label>
        <input
          id="name"
          type="text"
          placeholder={language === 'en' ? 'Enter your name' : 'กรอกชื่อของคุณ'}
        />
      </div>
      
      <div>
        <label htmlFor="email">
          {language === 'en' ? 'Email' : 'อีเมล'}
        </label>
        <input
          id="email"
          type="email"
          placeholder={language === 'en' ? 'Enter your email' : 'กรอกอีเมลของคุณ'}
        />
      </div>
      
      <button type="submit">
        {language === 'en' ? 'Submit' : 'ส่ง'}
      </button>
    </form>
  );
}

/**
 * Example 6: Navigation Menu with Translations
 * Pattern for creating translated navigation
 */
export function NavigationExample() {
  const { t } = useI18n();

  const menuItems = [
    { href: '/blog', label: t.nav.blog },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
  ];

  return (
    <nav>
      <ul>
        {menuItems.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Example 7: Using Translations in Meta Data
 * For SEO and social sharing
 */
export function MetaExample() {
  const { t, language } = useI18n();

  // In a real component, you'd use Next.js metadata
  const metadata = {
    title: t.home.heroTitle,
    description: t.home.heroDescription,
    locale: language === 'en' ? 'en_US' : 'th_TH',
    openGraph: {
      title: t.home.heroTitle,
      description: t.home.heroDescription,
      locale: language === 'en' ? 'en_US' : 'th_TH',
    },
  };

  return (
    <div>
      <pre>{JSON.stringify(metadata, null, 2)}</pre>
    </div>
  );
}

/**
 * Example 8: Error Messages and Notifications
 * Pattern for user feedback messages
 */
export function NotificationExample() {
  const { language } = useI18n();

  const showSuccessMessage = () => {
    const message = language === 'en' 
      ? 'Your profile has been updated successfully!'
      : 'โปรไฟล์ของคุณได้รับการอัปเดตเรียบร้อยแล้ว!';
    
    alert(message);
  };

  const showErrorMessage = () => {
    const message = language === 'en'
      ? 'Something went wrong. Please try again.'
      : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง';
    
    alert(message);
  };

  return (
    <div>
      <button onClick={showSuccessMessage}>
        {language === 'en' ? 'Show Success' : 'แสดงความสำเร็จ'}
      </button>
      <button onClick={showErrorMessage}>
        {language === 'en' ? 'Show Error' : 'แสดงข้อผิดพลาด'}
      </button>
    </div>
  );
}

/**
 * Example 9: Complex Component with Multiple Translation Sections
 * Real-world pattern combining multiple translation areas
 */
export function ComplexPageExample() {
  const { t, language } = useI18n();

  return (
    <div>
      {/* Hero Section */}
      <section>
        <h1>{t.home.heroTitle}</h1>
        <p>{t.home.heroDescription}</p>
        <button>{t.home.startLearning}</button>
      </section>

      {/* Mission Section */}
      <section>
        <h2>{t.mission.title}</h2>
        <p>{t.mission.description}</p>
        
        <div>
          <div>
            <h3>{t.home.personalizedTitle}</h3>
            <p>{t.home.personalizedDesc}</p>
          </div>
          <div>
            <h3>{t.home.gamifiedTitle}</h3>
            <p>{t.home.gamifiedDesc}</p>
          </div>
          <div>
            <h3>{t.home.careerTitle}</h3>
            <p>{t.home.careerDesc}</p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav>
        <a href="/app">{t.ai.englishFeed}</a>
        <a href="/contact">{t.nav.contact}</a>
      </nav>

      {/* Footer */}
      <footer>
        <p>
          {language === 'en' 
            ? '© 2025 Englishfully. All rights reserved.'
            : '© 2025 Englishfully สงวนลิขสิทธิ์'}
        </p>
      </footer>
    </div>
  );
}

/**
 * Example 10: Custom Hook for Extended Functionality
 * Create your own hooks for specific use cases
 */
export function useLocalizedDate() {
  const { language } = useI18n();

  const formatDate = (date: Date): string => {
    const locale = language === 'en' ? 'en-US' : 'th-TH';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return { formatDate };
}

export function DateExample() {
  const { formatDate } = useLocalizedDate();
  const today = new Date();

  return (
    <div>
      <p>Today's date: {formatDate(today)}</p>
    </div>
  );
}

