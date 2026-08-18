export type PresentationSlideLayout = 'title' | 'content' | 'bullets' | 'image';

/** Slide body / bullets type scale. */
export type PresentationFontSize = 'sm' | 'md' | 'lg' | 'xl';

/** Theme palette only (brand navy / red / gray / white). */
export type PresentationFontColor = 'navy' | 'red' | 'gray' | 'white';

export const PRESENTATION_FONT_SIZES: {
  value: PresentationFontSize;
  label: string;
}[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
];

export const PRESENTATION_FONT_COLORS: {
  value: PresentationFontColor;
  label: string;
  cssVar: string;
}[] = [
  { value: 'navy', label: 'Navy', cssVar: 'var(--brand-navy)' },
  { value: 'red', label: 'Red', cssVar: 'var(--brand-red)' },
  { value: 'gray', label: 'Gray', cssVar: 'var(--brand-gray)' },
  { value: 'white', label: 'White', cssVar: 'var(--brand-white)' },
];

export function presentationFontColorCss(
  color: PresentationFontColor | string | undefined
): string {
  const match = PRESENTATION_FONT_COLORS.find((item) => item.value === color);
  return match?.cssVar ?? 'var(--brand-navy)';
}

export function presentationFontSizeClass(
  size: PresentationFontSize | string | undefined,
  mode: 'compact' | 'default' | 'present'
): string {
  const key: PresentationFontSize =
    size === 'sm' || size === 'lg' || size === 'xl' ? size : 'md';
  if (mode === 'compact') {
    return { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm', xl: 'text-base' }[key];
  }
  if (mode === 'present') {
    return {
      sm: 'text-lg md:text-2xl',
      md: 'text-xl md:text-3xl',
      lg: 'text-2xl md:text-4xl',
      xl: 'text-3xl md:text-5xl',
    }[key];
  }
  return {
    sm: 'text-sm md:text-base',
    md: 'text-base md:text-xl',
    lg: 'text-lg md:text-2xl',
    xl: 'text-xl md:text-3xl',
  }[key];
}

function normalizeFontSize(value: unknown): PresentationFontSize {
  return value === 'sm' || value === 'lg' || value === 'xl' ? value : 'md';
}

function normalizeFontColor(value: unknown): PresentationFontColor {
  return value === 'red' || value === 'gray' || value === 'white' ? value : 'navy';
}

export interface PresentationSlide {
  id: string;
  layout: PresentationSlideLayout;
  title: string;
  /** Definition / explanation — always separate from grammar practice. */
  body: string;
  bullets: string[];
  imageUrl: string;
  imageAlt: string;
  /** Font size for definition / explanation. */
  bodyFontSize: PresentationFontSize;
  /** Theme color for definition / explanation. */
  bodyColor: PresentationFontColor;
  /** Font size for bullets. */
  bulletsFontSize: PresentationFontSize;
  /** Theme color for bullets. */
  bulletsColor: PresentationFontColor;
  /** Text + image only: show a separate practice box with yellow grammar highlights. */
  grammarHighlighterEnabled: boolean;
  /** e.g. "Possessive Adjectives" */
  grammarTarget: string;
  /** Practice text for the grammar highlighter box (not the definition). */
  grammarText: string;
  /** When true, grammarPlaceholder replaces the default "Example..." hint. */
  grammarCustomPlaceholderEnabled: boolean;
  /** Multi-line custom placeholder (e.g. sentence frames). */
  grammarPlaceholder: string;
}

export type PresentationStatus = 'draft' | 'published';

export interface PresentationDeck {
  id: string;
  /** Small banner/logo line on the title slide (default Englishfully). */
  brandLabel: string;
  title: string;
  subtitle: string;
  status: PresentationStatus;
  slides: PresentationSlide[];
  updatedAt: string;
}

export const DEFAULT_BRAND_LABEL = 'Englishfully';

export interface PresentationListItem {
  id: string;
  title: string;
  brand_label: string;
  status: PresentationStatus;
  slide_count: number;
  updated_at: string;
}

export function createSlideId(): string {
  return `slide_${Math.random().toString(36).slice(2, 10)}`;
}

export function createDeckId(): string {
  return `deck_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptySlide(
  layout: PresentationSlideLayout = 'content'
): PresentationSlide {
  return {
    id: createSlideId(),
    layout,
    title: '',
    body: '',
    bullets: [],
    imageUrl: '',
    imageAlt: '',
    bodyFontSize: 'md',
    bodyColor: 'navy',
    bulletsFontSize: 'md',
    bulletsColor: 'navy',
    grammarHighlighterEnabled: false,
    grammarTarget: '',
    grammarText: '',
    grammarCustomPlaceholderEnabled: false,
    grammarPlaceholder: '',
  };
}

export function normalizeSlide(
  slide: Partial<PresentationSlide> & { id?: string }
): PresentationSlide {
  const base = createEmptySlide(
    (slide.layout as PresentationSlideLayout) || 'content'
  );
  return {
    ...base,
    ...slide,
    id: slide.id || base.id,
    layout: (slide.layout as PresentationSlideLayout) || base.layout,
    title: String(slide.title ?? ''),
    body: String(slide.body ?? ''),
    bullets: Array.isArray(slide.bullets)
      ? slide.bullets.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [],
    imageUrl: String(slide.imageUrl ?? ''),
    imageAlt: String(slide.imageAlt ?? ''),
    bodyFontSize: normalizeFontSize(slide.bodyFontSize),
    bodyColor: normalizeFontColor(slide.bodyColor),
    bulletsFontSize: normalizeFontSize(slide.bulletsFontSize),
    bulletsColor: normalizeFontColor(slide.bulletsColor),
    grammarHighlighterEnabled: Boolean(slide.grammarHighlighterEnabled),
    grammarTarget: String(slide.grammarTarget ?? ''),
    grammarText: String(slide.grammarText ?? ''),
    grammarCustomPlaceholderEnabled: Boolean(slide.grammarCustomPlaceholderEnabled),
    grammarPlaceholder: String(slide.grammarPlaceholder ?? ''),
  };
}

export function createEmptyDeck(): PresentationDeck {
  return {
    id: createDeckId(),
    brandLabel: DEFAULT_BRAND_LABEL,
    title: '',
    subtitle: '',
    status: 'draft',
    slides: [
      {
        ...createEmptySlide('title'),
        title: '',
        body: '',
      },
      createEmptySlide('content'),
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeDeck(deck: Partial<PresentationDeck>): PresentationDeck {
  const base = createEmptyDeck();
  const status: PresentationStatus =
    deck.status === 'published' ? 'published' : 'draft';
  return {
    ...base,
    ...deck,
    id: String(deck.id || base.id),
    brandLabel: String(deck.brandLabel ?? DEFAULT_BRAND_LABEL).trim() || DEFAULT_BRAND_LABEL,
    title: String(deck.title ?? ''),
    subtitle: String(deck.subtitle ?? ''),
    status,
    slides: Array.isArray(deck.slides)
      ? deck.slides.map((slide) => normalizeSlide(slide))
      : base.slides,
    updatedAt: String(deck.updatedAt || base.updatedAt),
  };
}
