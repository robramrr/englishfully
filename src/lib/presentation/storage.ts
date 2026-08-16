import type { PresentationDeck } from './types';
import { createEmptyDeck, normalizeDeck } from './types';

function draftKey(id: string): string {
  return `englishfully.presentation.draft.${id}`;
}

export function loadPresentationDraftById(id: string): PresentationDeck | null {
  if (typeof window === 'undefined' || !id) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PresentationDeck;
    if (!parsed || !Array.isArray(parsed.slides)) return null;
    return normalizeDeck({ ...parsed, id });
  } catch {
    return null;
  }
}

export function savePresentationDraftById(deck: PresentationDeck): void {
  if (typeof window === 'undefined' || !deck.id) return;
  const next = { ...deck, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(draftKey(deck.id), JSON.stringify(next));
}

export function clearPresentationDraftById(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  window.localStorage.removeItem(draftKey(id));
}

/** @deprecated single-draft helpers — kept for one-time migration */
const LEGACY_KEY = 'englishfully.presentation.draft.v1';

export function loadLegacyPresentationDraft(): PresentationDeck | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PresentationDeck;
    if (!parsed || !Array.isArray(parsed.slides)) return null;
    return normalizeDeck(parsed);
  } catch {
    return null;
  }
}

export function clearLegacyPresentationDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_KEY);
}

export function loadPresentationDraft(): PresentationDeck {
  return loadLegacyPresentationDraft() || createEmptyDeck();
}

export function savePresentationDraft(deck: PresentationDeck): void {
  savePresentationDraftById(deck);
}

export function clearPresentationDraft(): void {
  clearLegacyPresentationDraft();
}
