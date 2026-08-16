export type PresentationSlideLayout = 'title' | 'content' | 'bullets' | 'image';

export interface PresentationSlide {
  id: string;
  layout: PresentationSlideLayout;
  title: string;
  body: string;
  bullets: string[];
  imageUrl: string;
  imageAlt: string;
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
