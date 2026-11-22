import {
  BINGO_LEVELS,
  definitionLeaksAnswer,
  displayBingoWord,
  type BingoLevel,
} from '@/lib/vocab-bingo/types';

export { BINGO_LEVELS as CHALLENGE_LEVELS };
export type ChallengeLevel = BingoLevel;

export const CHALLENGE_GRID_PRESETS = [20, 25, 30, 40, 50] as const;
export const CHALLENGE_LENGTH_PRESETS = [10, 15, 20] as const;
export const MIN_CHALLENGE_GRID = 4;
export const MAX_CHALLENGE_GRID = 60;
export const MAX_CHALLENGE_BANK = 200;
export const MAX_CHALLENGE_COPIES = 50;
export const DEFAULT_CHALLENGE_COPIES = 45;

export interface ChallengeWord {
  id: string;
  word: string;
  definition: string;
}

export interface DefinitionChallengeActivity {
  id: string;
  title: string;
  topic: string;
  level: ChallengeLevel;
  words: ChallengeWord[];
  /** Words printed on every student sheet, in grid order. */
  gridWordIds: string[];
  gridCount: number;
  /** Definitions the teacher reads, in order. Always a subset of the grid. */
  callWordIds: string[];
  gameLength: number;
  updatedAt: string;
}

export interface DefinitionChallengeListItem {
  id: string;
  title: string;
  topic: string;
  level: ChallengeLevel;
  word_count: number;
  grid_count: number;
  game_length: number;
  updated_at: string;
}

export function createChallengeWordId(): string {
  return `chword_${Math.random().toString(36).slice(2, 10)}`;
}

export function createChallengeActivityId(): string {
  return `challenge_${Math.random().toString(36).slice(2, 12)}`;
}

export function createEmptyChallengeWord(patch: Partial<ChallengeWord> = {}): ChallengeWord {
  return {
    id: patch.id || createChallengeWordId(),
    word: displayBingoWord(patch.word || ''),
    definition: String(patch.definition ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280),
  };
}

export function challengeLevel(value: unknown): ChallengeLevel {
  const level = String(value ?? '')
    .trim()
    .toUpperCase();
  return BINGO_LEVELS.includes(level as ChallengeLevel) ? (level as ChallengeLevel) : 'A2';
}

export function clampChallengeGridCount(value: unknown): number {
  const count = Math.round(Number(value));
  if (!Number.isFinite(count)) return 25;
  return Math.max(MIN_CHALLENGE_GRID, Math.min(MAX_CHALLENGE_GRID, count));
}

export function clampChallengeGameLength(value: unknown, gridSize: number): number {
  const count = Math.round(Number(value));
  const chosen = Number.isFinite(count) ? Math.max(1, Math.min(MAX_CHALLENGE_GRID, count)) : 15;
  if (gridSize <= 0) return chosen;
  return Math.min(chosen, gridSize);
}

export function parseChallengeWordList(text: string): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const part of String(text ?? '').split(/[\n,;]+/)) {
    const word = displayBingoWord(part);
    const key = word.toLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words;
}

export function challengeColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  if (count <= 16) return 4;
  if (count <= 25) return 5;
  if (count <= 36) return 6;
  if (count <= 48) return 8;
  return 10;
}

export function challengeActivityTitle(
  activity: Pick<DefinitionChallengeActivity, 'title' | 'topic'>
): string {
  return activity.title.trim() || activity.topic.trim() || 'Definition Challenge';
}

/** A definition that names this word, or that also fits another word in the list. */
export function challengeDefinitionWarning(
  definition: string,
  word: string,
  otherWords: string[]
): string {
  if (!definition.trim() || !word.trim()) return '';
  if (definitionLeaksAnswer(definition, word)) {
    return 'This definition says the answer.';
  }
  const clash = otherWords.find(
    (other) => other.trim() && other.toLowerCase() !== word.toLowerCase() && definitionLeaksAnswer(definition, other)
  );
  if (clash) return `This clue could also match “${clash}”.`;
  return '';
}

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of value) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function createEmptyChallengeActivity(): DefinitionChallengeActivity {
  return {
    id: createChallengeActivityId(),
    title: '',
    topic: '',
    level: 'A2',
    words: [],
    gridWordIds: [],
    gridCount: 25,
    callWordIds: [],
    gameLength: 15,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeChallengeActivity(
  activity: Partial<DefinitionChallengeActivity>
): DefinitionChallengeActivity {
  const base = createEmptyChallengeActivity();
  const seen = new Set<string>();
  const words: ChallengeWord[] = [];
  for (const item of Array.isArray(activity.words) ? activity.words : []) {
    const word = createEmptyChallengeWord(item || {});
    const key = word.word.toLowerCase();
    if (word.word && seen.has(key)) continue;
    if (word.word) seen.add(key);
    words.push(word);
    if (words.length >= MAX_CHALLENGE_BANK) break;
  }
  const named = new Set(words.filter((word) => word.word).map((word) => word.id));
  const gridCount = clampChallengeGridCount(activity.gridCount);
  const gridWordIds = uniqueIds(activity.gridWordIds)
    .filter((id) => named.has(id))
    .slice(0, gridCount);
  const gameLength = clampChallengeGameLength(activity.gameLength, gridWordIds.length);
  const onGrid = new Set(gridWordIds);
  const callWordIds = uniqueIds(activity.callWordIds)
    .filter((id) => onGrid.has(id))
    .slice(0, gameLength);
  return {
    ...base,
    id: String(activity.id || base.id),
    title: String(activity.title ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80),
    topic: String(activity.topic ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120),
    level: challengeLevel(activity.level),
    words,
    gridWordIds,
    gridCount,
    callWordIds,
    gameLength,
    updatedAt: String(activity.updatedAt || base.updatedAt),
  };
}

export function challengeGridWords(activity: DefinitionChallengeActivity): ChallengeWord[] {
  const byId = new Map(activity.words.map((word) => [word.id, word]));
  return activity.gridWordIds
    .map((id) => byId.get(id))
    .filter((word): word is ChallengeWord => Boolean(word?.word));
}

export function challengeCallWords(activity: DefinitionChallengeActivity): ChallengeWord[] {
  const byId = new Map(activity.words.map((word) => [word.id, word]));
  return activity.callWordIds
    .map((id) => byId.get(id))
    .filter((word): word is ChallengeWord => Boolean(word?.word && word.definition.trim()));
}

export function shuffleChallengeIds(ids: string[]): string[] {
  const next = [...ids];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}

/** Pick `length` grid words at random. Every pick is already on the student sheet. */
export function pickChallengeCallIds(gridWordIds: string[], length: number): string[] {
  return shuffleChallengeIds(gridWordIds).slice(0, Math.max(0, Math.min(length, gridWordIds.length)));
}
