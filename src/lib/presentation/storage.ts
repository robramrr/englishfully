import type { PresentationDeck } from './types';
import { createEmptyDeck, normalizeSlide } from './types';

const STORAGE_KEY = 'englishfully.presentation.draft.v1';

export function loadPresentationDraft(): PresentationDeck {
  if (typeof window === 'undefined') return createEmptyDeck();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyDeck();
    const parsed = JSON.parse(raw) as PresentationDeck;
    if (!parsed || !Array.isArray(parsed.slides)) return createEmptyDeck();
    return {
      ...createEmptyDeck(),
      ...parsed,
      slides: parsed.slides.map((slide) => normalizeSlide(slide)),
    };
  } catch {
    return createEmptyDeck();
  }
}

export function savePresentationDraft(deck: PresentationDeck): void {
  if (typeof window === 'undefined') return;
  const next = { ...deck, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearPresentationDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
