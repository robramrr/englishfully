export const VOCAB_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type VocabLevel = (typeof VOCAB_LEVELS)[number];

/** One idea per card: the word, a simple meaning, and an optional picture. */
export interface VocabCard {
  id: string;
  word: string;
  /** Learner-friendly meaning in simple English. */
  meaning: string;
  /** One natural sentence that uses the word. */
  example: string;
  /** noun, verb, adjective, and so on. */
  partOfSpeech: string;
  /** Optional picture. Empty when the card is word and meaning only. */
  imageUrl: string;
}

export interface VocabDeck {
  id: string;
  title: string;
  topic: string;
  level: VocabLevel;
  cards: VocabCard[];
  updatedAt: string;
}

export interface VocabDeckListItem {
  id: string;
  title: string;
  topic: string;
  level: VocabLevel;
  card_count: number;
  updated_at: string;
}

export const MAX_VOCAB_CARDS = 60;
export const MAX_AI_CARDS = 20;

export function createVocabCardId(): string {
  return `card_${Math.random().toString(36).slice(2, 10)}`;
}

export function createVocabDeckId(): string {
  return `vocab_${Math.random().toString(36).slice(2, 12)}`;
}

export function createEmptyVocabCard(patch: Partial<VocabCard> = {}): VocabCard {
  return {
    id: patch.id || createVocabCardId(),
    word: String(patch.word ?? '').trim(),
    meaning: String(patch.meaning ?? '').trim(),
    example: String(patch.example ?? '').trim(),
    partOfSpeech: String(patch.partOfSpeech ?? '').trim(),
    imageUrl: String(patch.imageUrl ?? '').trim(),
  };
}

function normalizeLevel(value: unknown): VocabLevel {
  const level = String(value ?? '')
    .trim()
    .toUpperCase();
  if (level === 'A1' || level === 'B1' || level === 'B2' || level === 'C1') return level;
  return 'A2';
}

function normalizeCards(value: unknown): VocabCard[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_VOCAB_CARDS).map((item) => {
    if (!item || typeof item !== 'object') return createEmptyVocabCard();
    return createEmptyVocabCard(item as Partial<VocabCard>);
  });
}

export function createEmptyVocabDeck(): VocabDeck {
  return {
    id: createVocabDeckId(),
    title: '',
    topic: '',
    level: 'A2',
    cards: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeVocabDeck(deck: Partial<VocabDeck>): VocabDeck {
  const base = createEmptyVocabDeck();
  return {
    ...base,
    ...deck,
    id: String(deck.id || base.id),
    title: String(deck.title ?? ''),
    topic: String(deck.topic ?? ''),
    level: normalizeLevel(deck.level),
    cards: normalizeCards(deck.cards),
    updatedAt: String(deck.updatedAt || base.updatedAt),
  };
}

/** Split a pasted list on new lines, commas, and simple bullets. */
export function parseWordList(raw: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const chunk of String(raw ?? '').split(/[\n,]/)) {
    const word = chunk
      .replace(/^[\s\-*•]+/, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim()
      .replace(/\s+/g, ' ');
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function vocabCardsReady(cards: VocabCard[]): VocabCard[] {
  return cards.filter((card) => card.word.trim() || card.meaning.trim());
}
