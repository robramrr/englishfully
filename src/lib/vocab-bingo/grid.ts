import {
  bingoCellCount,
  displayBingoWord,
  type BingoGridSize,
  type VocabBingoActivity,
} from './types';

export interface BingoGrid {
  /** 1-based copy number. The same number always prints the same layout. */
  copy: number;
  size: BingoGridSize;
  cells: string[];
}

function hashSeed(copy: number, activityId: string): number {
  let hash = (copy + 1) * 374761393;
  const key = activityId || 'bingo';
  for (let index = 0; index < key.length; index += 1) {
    hash = Math.imul(hash ^ key.charCodeAt(index), 668265263);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWith<T>(items: T[], random: () => number): T[] {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}

/**
 * Every target word is on the card. Extra cells use distractors, then FREE.
 * The copy number keeps a class set stable when the teacher reprints.
 */
export function buildBingoGrid(activity: VocabBingoActivity, copy: number): BingoGrid {
  const size = activity.gridSize;
  const total = bingoCellCount(size);
  const targets = activity.words
    .map((item) => displayBingoWord(item.word))
    .filter(Boolean)
    .slice(0, total);
  const used = new Set(targets.map((word) => word.toLowerCase()));
  const fillers = activity.distractors
    .map((item) => displayBingoWord(item.word))
    .filter((word) => word && !used.has(word.toLowerCase()));
  const cells = targets.slice();
  for (const filler of fillers) {
    if (cells.length >= total) break;
    cells.push(filler);
  }
  while (cells.length < total) cells.push('FREE');
  const random = mulberry32(hashSeed(Math.max(1, Math.round(copy) || 1), activity.id));
  return {
    copy: Math.max(1, Math.round(copy) || 1),
    size,
    cells: shuffleWith(cells.slice(0, total), random),
  };
}

export function buildBingoGrids(activity: VocabBingoActivity, copies: number): BingoGrid[] {
  const count = Math.max(1, Math.min(40, Math.round(copies) || 1));
  return Array.from({ length: count }, (_, index) => buildBingoGrid(activity, index + 1));
}
