# Internationalization (i18n) System

This directory contains the internationalization system for Englishfully, supporting English (EN) and Thai (TH) languages with easy extensibility for additional languages.

## 📁 Directory Structure

```
src/i18n/
├── README.md          # This file - documentation
├── types.ts           # TypeScript types for language and translations
├── I18nProvider.tsx   # Context provider and custom hook
├── en.json            # English translations
└── th.json            # Thai translations
```

## 🚀 Quick Start

### 1. Using Translations in Components

```tsx
'use client';

import { useI18n } from '@/i18n/I18nProvider';

export default function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t.nav.aiFeatures}</h1>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### 2. Adding New Translation Keys

1. Add the key to both `en.json` and `th.json`:

```json
// en.json
{
  "nav": {
    "newKey": "New Translation"
  }
}

// th.json
{
  "nav": {
    "newKey": "แปลใหม่"
  }
}
```

2. Update `types.ts` to include the new key (for TypeScript support):

```typescript
export interface Translations {
  nav: {
    newKey: string;
    // ... other keys
  };
  // ... other sections
}
```

### 3. Adding a New Language

1. Create a new JSON file (e.g., `ja.json` for Japanese)
2. Add the language type to `types.ts`:

```typescript
export type Language = 'en' | 'th' | 'ja';
```

3. Import and add to the translations object in `I18nProvider.tsx`:

```typescript
import jaTranslations from './ja.json';

const translations: Record<Language, Translations> = {
  en: enTranslations as Translations,
  th: thTranslations as Translations,
  ja: jaTranslations as Translations,
};
```

4. Update the `LanguageToggle` component to include the new language option

## 🎯 Features

### Automatic Persistence
- User's language preference is automatically saved to `localStorage`
- Language persists across page refreshes and sessions

### Type Safety
- Full TypeScript support with autocompletion
- Compile-time checks ensure all translation keys exist

### Client-Side Only
- The i18n system runs entirely on the client side
- No server-side rendering complications
- Works seamlessly with Next.js App Router

### Scalable Architecture
- Easy to add new languages
- Easy to add new translation keys
- Centralized translation management

## 📝 Translation Structure

Translations are organized by feature area:

- `nav` - Navigation menu items
- `ai` - AI feature names
- `home` - Homepage content
- `mission` - Mission section
- `techInnovations` - Technology innovations section

You can add new sections as needed by updating the `Translations` interface in `types.ts`.

## 🔧 API Reference

### `useI18n()` Hook

Returns an object with:
- `language: Language` - Current language ('en' | 'th')
- `setLanguage: (lang: Language) => void` - Function to change language
- `t: Translations` - Translation object with all strings

### Example Usage

```tsx
const { t, language, setLanguage } = useI18n();

// Access translations
console.log(t.nav.blog); // "Blog" or "บล็อก"

// Change language
setLanguage('th');

// Check current language
if (language === 'en') {
  // English-specific logic
}
```

## 🎨 Best Practices

1. **Never hardcode UI text** - Always use translation keys
2. **Use descriptive keys** - `nav.aiFeatures` is better than `nav.item1`
3. **Group related translations** - Organize by feature or page
4. **Keep translations in sync** - Always update both language files
5. **Use TypeScript** - Update types when adding new keys
6. **Test both languages** - Verify translations display correctly

## 🌐 Language Toggle Component

The `LanguageToggle` component is automatically included in:
- Desktop header (top-right)
- Mobile menu (bottom)

To use it elsewhere:

```tsx
import LanguageToggle from '@/components/LanguageToggle';

<LanguageToggle className="my-custom-class" />
```

## 🔄 Migration Guide

### Converting Existing Components

1. Add `'use client'` directive at the top
2. Import the hook: `import { useI18n } from '@/i18n/I18nProvider';`
3. Use the hook: `const { t } = useI18n();`
4. Replace hardcoded text with translation keys: `{t.section.key}`

### Example

Before:
```tsx
export default function MyComponent() {
  return <h1>Welcome</h1>;
}
```

After:
```tsx
'use client';

import { useI18n } from '@/i18n/I18nProvider';

export default function MyComponent() {
  const { t } = useI18n();
  return <h1>{t.home.welcome}</h1>;
}
```

## 🐛 Troubleshooting

### Error: "useI18n must be used within an I18nProvider"
- Make sure your component is rendered inside the `I18nProvider` wrapper in `layout.tsx`

### Translations not updating
- Check that localStorage is enabled in the browser
- Clear browser cache and localStorage
- Verify both translation files have the same keys

### TypeScript errors
- Ensure `types.ts` is updated with all translation keys
- Restart the TypeScript server in your IDE

## 📚 Additional Resources

- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [React Context API](https://react.dev/reference/react/useContext)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

