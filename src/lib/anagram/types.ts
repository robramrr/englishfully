import { VOCAB_LEVELS, type VocabLevel } from '@/lib/vocabulary/types';

export { VOCAB_LEVELS };
export type AnagramLevel = VocabLevel;

export type AnagramAudioMode = 'none' | 'tts' | 'url';

/** One scrambled word. The clue, sound, and picture are optional hints. */
export interface AnagramWord {
  id: string;
  /** Letters the student must spell. Punctuation is ignored when the game starts. */
  word: string;
  /** A short definition. Shown only after the student taps the clue icon. */
  clue: string;
  audioMode: AnagramAudioMode;
  /** Used when audioMode is "url". */
  audioUrl: string;
  /** Shown after the clue, when the student taps the clue icon again. */
  imageUrl: string;
}

export interface AnagramActivity {
  id: string;
  /** Optional. The play screen uses this, then the topic, then "Anagram". */
  title: string;
  topic: string;
  level: AnagramLevel;
  /**
   * When true, the play screen shows a clue icon.
   * The first tap reveals the definition. The next tap reveals the picture.
   */
  cluesEnabled: boolean;
  /** When true, each word has its own countdown. */
  timerEnabled: boolean;
  /** Seconds allowed for each word while the timer is on. */
  secondsPerWord: number;
  words: AnagramWord[];
  updatedAt: string;
}

export interface AnagramActivityListItem {
  id: string;
  title: string;
  topic: string;
  level: AnagramLevel;
  word_count: number;
  timer_enabled: boolean;
  seconds_per_word: number;
  updated_at: string;
}

export const MAX_ANAGRAM_WORDS = 40;
export const MAX_AI_ANAGRAM_WORDS = 20;
export const MIN_ANAGRAM_LETTERS = 2;
export const MAX_ANAGRAM_LETTERS = 14;
export const MIN_ANAGRAM_SECONDS = 5;
export const MAX_ANAGRAM_SECONDS = 180;

export function createAnagramWordId(): string {
  return `word_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAnagramActivityId(): string {
  return `anagram_${Math.random().toString(36).slice(2, 12)}`;
}

/** Letters that can be scrambled. Everything else is left out of the puzzle. */
export function puzzleWord(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, MAX_ANAGRAM_LETTERS);
}

export function createEmptyAnagramWord(patch: Partial<AnagramWord> = {}): AnagramWord {
  const mode = patch.audioMode === 'tts' || patch.audioMode === 'url' ? patch.audioMode : 'none';
  return {
    id: patch.id || createAnagramWordId(),
    word: String(patch.word ?? '').replace(/\s+/g, ' ').trim(),
    clue: String(patch.clue ?? '').replace(/\s+/g, ' ').trim(),
    audioMode: mode,
    audioUrl: String(patch.audioUrl ?? '').trim(),
    imageUrl: String(patch.imageUrl ?? '').trim(),
  };
}

function normalizeLevel(value: unknown): AnagramLevel {
  const level = String(value ?? '')
    .trim()
    .toUpperCase();
  if (level === 'A1' || level === 'B1' || level === 'B2' || level === 'C1') return level;
  return 'A2';
}

function normalizeSeconds(value: unknown): number {
  const seconds = Math.round(Number(value));
  if (!Number.isFinite(seconds)) return 30;
  return Math.max(MIN_ANAGRAM_SECONDS, Math.min(MAX_ANAGRAM_SECONDS, seconds));
}

function normalizeWords(value: unknown): AnagramWord[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_ANAGRAM_WORDS).map((item) => {
    if (!item || typeof item !== 'object') return createEmptyAnagramWord();
    return createEmptyAnagramWord(item as Partial<AnagramWord>);
  });
}

export function createEmptyAnagramActivity(): AnagramActivity {
  return {
    id: createAnagramActivityId(),
    title: '',
    topic: '',
    level: 'A2',
    cluesEnabled: true,
    timerEnabled: false,
    secondsPerWord: 30,
    words: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeAnagramActivity(activity: Partial<AnagramActivity>): AnagramActivity {
  const base = createEmptyAnagramActivity();
  return {
    ...base,
    ...activity,
    id: String(activity.id || base.id),
    title: String(activity.title ?? ''),
    topic: String(activity.topic ?? ''),
    level: normalizeLevel(activity.level),
    cluesEnabled: activity.cluesEnabled !== false,
    timerEnabled: activity.timerEnabled === true,
    secondsPerWord: normalizeSeconds(activity.secondsPerWord),
    words: normalizeWords(activity.words),
    updatedAt: String(activity.updatedAt || base.updatedAt),
  };
}

/** Split a pasted list on new lines, commas, and simple bullets. */
export function parseAnagramWordList(raw: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const chunk of String(raw ?? '').split(/[\n,]/)) {
    const word = chunk
      .replace(/^[\s\-*•]+/, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim()
      .replace(/\s+/g, ' ');
    const puzzle = puzzleWord(word);
    if (puzzle.length < MIN_ANAGRAM_LETTERS) continue;
    if (seen.has(puzzle)) continue;
    seen.add(puzzle);
    words.push(puzzle);
  }
  return words;
}

export function anagramWordsReady(words: AnagramWord[]): AnagramWord[] {
  return words.filter((item) => puzzleWord(item.word).length >= MIN_ANAGRAM_LETTERS);
}

export function httpUrl(value: string): string {
  const url = String(value ?? '').trim();
  if (/^https?:\/\//i.test(url)) return url;
  return '';
}
