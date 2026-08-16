export type PresentationSlideLayout = 'title' | 'content' | 'bullets' | 'image';

export interface PresentationSlide {
  id: string;
  layout: PresentationSlideLayout;
  title: string;
  /** Definition / explanation — always separate from grammar practice. */
  body: string;
  bullets: string[];
  imageUrl: string;
  imageAlt: string;
  /** Text + image only: show a separate practice box with yellow grammar highlights. */
  grammarHighlighterEnabled: boolean;
  /** e.g. "Possessive Adjectives" */
  grammarTarget: string;
  /** Practice text for the grammar highlighter box (not the definition). */
  grammarText: string;
}

export interface PresentationDeck {
  id: string;
  title: string;
  subtitle: string;
  slides: PresentationSlide[];
  updatedAt: string;
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
    grammarHighlighterEnabled: false,
    grammarTarget: '',
    grammarText: '',
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
    grammarHighlighterEnabled: Boolean(slide.grammarHighlighterEnabled),
    grammarTarget: String(slide.grammarTarget ?? ''),
    grammarText: String(slide.grammarText ?? ''),
  };
}

export function createEmptyDeck(): PresentationDeck {
  return {
    id: createDeckId(),
    title: '',
    subtitle: '',
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
