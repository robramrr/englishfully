export const BINGO_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type BingoLevel = (typeof BINGO_LEVELS)[number];

export const BINGO_DEFINITION_STYLES = ['simple', 'standard', 'challenging'] as const;
export type BingoDefinitionStyle = (typeof BINGO_DEFINITION_STYLES)[number];

export const BINGO_GRID_SIZES = [4, 5] as const;
export type BingoGridSize = (typeof BINGO_GRID_SIZES)[number];

/** A word students see on the card. The teacher reads the definition, never the word. */
export interface BingoWord {
  id: string;
  word: string;
  definition: string;
}

/** A related word used only to fill empty card spaces. It is not called. */
export interface BingoDistractor {
  id: string;
  word: string;
}

export interface VocabBingoActivity {
  id: string;
  title: string;
  topic: string;
  level: BingoLevel;
  /** How many target words to generate. Every card includes all of them. */
  wordCount: number;
  gridSize: BingoGridSize;
  definitionStyle: BingoDefinitionStyle;
  words: BingoWord[];
  distractors: BingoDistractor[];
  updatedAt: string;
}

export interface VocabBingoListItem {
  id: string;
  title: string;
  topic: string;
  level: BingoLevel;
  word_count: number;
  grid_size: BingoGridSize;
  updated_at: string;
}

export const DEFAULT_BINGO_WORD_COUNT = 10;
export const MIN_BINGO_WORDS = 4;
export const MAX_BINGO_PRINT_COPIES = 40;

export function createBingoWordId(): string {
  return `bword_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBingoDistractorId(): string {
  return `bdist_${Math.random().toString(36).slice(2, 10)}`;
}

export function createBingoActivityId(): string {
  return `bingo_${Math.random().toString(36).slice(2, 12)}`;
}

export function bingoCellCount(gridSize: BingoGridSize): number {
  return gridSize * gridSize;
}

export function clampBingoWordCount(count: unknown, gridSize: BingoGridSize): number {
  const cells = bingoCellCount(gridSize);
  const value = Math.round(Number(count));
  if (!Number.isFinite(value)) return Math.min(DEFAULT_BINGO_WORD_COUNT, cells);
  return Math.max(MIN_BINGO_WORDS, Math.min(cells, value));
}

export function displayBingoWord(raw: string): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when a definition gives away the answer or a word inside a phrase. */
export function definitionLeaksAnswer(definition: string, word: string): boolean {
  const answer = displayBingoWord(word).toLowerCase();
  const text = String(definition ?? '').toLowerCase();
  if (!answer || !text) return false;
  const parts = answer.split(' ').filter((part) => part.length > 2);
  const checks = parts.length > 1 ? [answer, ...parts] : [answer];
  return checks.some((part) => {
    const pattern = new RegExp(`\\b${escapeRegExp(part)}(?:s|es|ed|ing)?\\b`, 'i');
    return pattern.test(text);
  });
}

export function createEmptyBingoWord(patch: Partial<BingoWord> = {}): BingoWord {
  return {
    id: patch.id || createBingoWordId(),
    word: displayBingoWord(patch.word || ''),
    definition: String(patch.definition ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280),
  };
}

export function createEmptyBingoDistractor(patch: Partial<BingoDistractor> = {}): BingoDistractor {
  return {
    id: patch.id || createBingoDistractorId(),
    word: displayBingoWord(patch.word || ''),
  };
}

function normalizeLevel(value: unknown): BingoLevel {
  const level = String(value ?? '')
    .trim()
    .toUpperCase();
  if (
    level === 'A1' ||
    level === 'A2' ||
    level === 'B1' ||
    level === 'B2' ||
    level === 'C1' ||
    level === 'C2'
  ) {
    return level;
  }
  return 'A2';
}

function normalizeGridSize(value: unknown): BingoGridSize {
  return Number(value) === 5 ? 5 : 4;
}

function normalizeStyle(value: unknown): BingoDefinitionStyle {
  const style = String(value ?? '').trim().toLowerCase();
  if (style === 'simple' || style === 'challenging') return style;
  return 'standard';
}

export function createEmptyBingoActivity(): VocabBingoActivity {
  return {
    id: createBingoActivityId(),
    title: '',
    topic: '',
    level: 'A2',
    wordCount: DEFAULT_BINGO_WORD_COUNT,
    gridSize: 4,
    definitionStyle: 'standard',
    words: [],
    distractors: [],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeBingoActivity(activity: Partial<VocabBingoActivity>): VocabBingoActivity {
  const base = createEmptyBingoActivity();
  const gridSize = normalizeGridSize(activity.gridSize);
  const cells = bingoCellCount(gridSize);
  const words = (Array.isArray(activity.words) ? activity.words : [])
    .slice(0, cells)
    .map((item) => createEmptyBingoWord(item || {}))
    .filter((item) => item.word || item.definition);
  const distractors = (Array.isArray(activity.distractors) ? activity.distractors : [])
    .slice(0, cells)
    .map((item) => createEmptyBingoDistractor(item || {}))
    .filter((item) => item.word);
  return {
    ...base,
    ...activity,
    id: String(activity.id || base.id),
    title: String(activity.title ?? ''),
    topic: String(activity.topic ?? '').replace(/\s+/g, ' ').trim(),
    level: normalizeLevel(activity.level),
    gridSize,
    wordCount: clampBingoWordCount(activity.wordCount, gridSize),
    definitionStyle: normalizeStyle(activity.definitionStyle),
    words,
    distractors,
    updatedAt: String(activity.updatedAt || base.updatedAt),
  };
}

export function bingoWordsReady(words: BingoWord[]): BingoWord[] {
  return words.filter((item) => item.word.trim() && item.definition.trim());
}

export function bingoActivityTitle(activity: Pick<VocabBingoActivity, 'title' | 'topic'>): string {
  return activity.title.trim() || activity.topic.trim() || 'Vocabulary Bingo';
}

export function distractorsNeeded(activity: Pick<VocabBingoActivity, 'gridSize' | 'words'>): number {
  const ready = activity.words.filter((item) => item.word.trim()).length;
  return Math.max(0, bingoCellCount(activity.gridSize) - ready);
}
