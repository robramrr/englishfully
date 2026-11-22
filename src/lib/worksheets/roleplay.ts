import {
  ROLEPLAY_LEVELS,
  type RoleplayBank,
  type RoleplayDifficulty,
  type RoleplayLevel,
  type RoleplayLine,
  type RoleplaySettings,
  type RoleplayWordUse,
  type WorksheetSection,
} from './types';

export const ROLEPLAY_INSTRUCTIONS =
  'Work with a partner. Complete the conversation using the words in the word banks. Then practise the conversation together.';

export function emptyRoleplaySettings(level: RoleplayLevel = 'A2'): RoleplaySettings {
  return {
    level,
    objective: '',
    vocabulary: '',
    grammar: '',
    difficulty: 'standard',
    wordUse: 'once',
  };
}

export function roleplayLevel(value: unknown, fallback: RoleplayLevel = 'A2'): RoleplayLevel {
  const level = String(value ?? '')
    .trim()
    .toUpperCase();
  return ROLEPLAY_LEVELS.includes(level as RoleplayLevel) ? (level as RoleplayLevel) : fallback;
}

export function roleplayDifficulty(value: unknown): RoleplayDifficulty {
  const difficulty = String(value ?? '').trim().toLowerCase();
  if (difficulty === 'easy' || difficulty === 'challenging') return difficulty;
  return 'standard';
}

export function roleplayWordUse(value: unknown): RoleplayWordUse {
  return String(value ?? '').trim().toLowerCase() === 'repeat' ? 'repeat' : 'once';
}

export function blankParts(text: string): string[] {
  return String(text ?? '').split(/_{3,}/);
}

export function blankCount(text: string): number {
  return Math.max(0, blankParts(text).length - 1);
}

function cleanWord(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function answerList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const words: string[] = [];
  for (const item of raw) {
    const word = cleanWord(item);
    const key = word.toLowerCase();
    if (!word || seen.has(key)) continue;
    seen.add(key);
    words.push(word);
  }
  return words.slice(0, 4);
}

function shuffleWords(words: string[]): string[] {
  const next = [...words];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}

export function normalizeRoleplayLine(value: unknown): RoleplayLine | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const speaker = Number(record.speaker) === 2 ? 2 : 1;
  let text = String(record.text ?? record.line ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320);
  if (!text) return null;
  text = text.replace(/\[blank\]|\(\s*\)/gi, '______').replace(/_{3,}/g, '______');
  const gaps = blankCount(text);
  const given = Array.isArray(record.answers) ? record.answers : [];
  const answers = Array.from({ length: gaps }, (_, index) => answerList(given[index]));
  return {
    speaker,
    text,
    answers,
    note: String(record.note ?? record.explanation ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180),
  };
}

export function normalizeRoleplayBanks(value: unknown, shuffle: boolean): RoleplayBank[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const label = String(record.label ?? record.category ?? record.name ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 40);
      const seen = new Set<string>();
      const words: string[] = [];
      const list = Array.isArray(record.words) ? record.words : [];
      for (const item of list) {
        const word = cleanWord(item);
        const key = word.toLowerCase();
        if (!word || seen.has(key)) continue;
        seen.add(key);
        words.push(word);
      }
      if (!label || words.length === 0) return null;
      return { label, words: shuffle ? shuffleWords(words) : words };
    })
    .filter((bank): bank is RoleplayBank => Boolean(bank))
    .slice(0, 6);
}

export function normalizeGuidedRoleplay(
  raw: Record<string, unknown>,
  settings: Partial<RoleplaySettings> & { topic?: string; exchanges?: number },
  options: { shuffleBanks?: boolean } = {}
): Extract<WorksheetSection, { type: 'guided_roleplay' }> {
  const exchanges = Math.max(4, Math.min(10, Math.round(Number(settings.exchanges) || 8)));
  const maxLines = exchanges * 2;
  const lines = (Array.isArray(raw.lines) ? raw.lines : [])
    .map((line) => normalizeRoleplayLine(line))
    .filter((line): line is RoleplayLine => Boolean(line))
    .slice(0, maxLines);
  const level = roleplayLevel(settings.level ?? raw.level);
  const difficulty = roleplayDifficulty(settings.difficulty ?? raw.difficulty);
  const wordUse = roleplayWordUse(settings.wordUse ?? raw.wordUse);
  const kept = (primary: unknown, fallback: unknown, max: number, collapse = true) => {
    const read = (value: unknown) => {
      const text = collapse ? String(value ?? '').replace(/\s+/g, ' ') : String(value ?? '');
      return text.trim();
    };
    return (read(primary) || read(fallback)).slice(0, max);
  };
  return {
    type: 'guided_roleplay',
    title: String(raw.title ?? 'Guided roleplay')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'Guided roleplay',
    instructions:
      String(raw.instructions ?? '').replace(/\s+/g, ' ').trim().slice(0, 220) ||
      ROLEPLAY_INSTRUCTIONS,
    topic: kept(settings.topic, raw.topic, 120),
    objective: kept(settings.objective, raw.objective, 280),
    vocabulary: kept(settings.vocabulary, raw.vocabulary, 800, false),
    grammar: kept(settings.grammar, raw.grammar, 200),
    level,
    difficulty,
    wordUse,
    banks: normalizeRoleplayBanks(raw.banks, options.shuffleBanks === true),
    lines,
  };
}

export function roleplayAnswerLine(line: RoleplayLine): string {
  const parts = blankParts(line.text);
  let filled = '';
  parts.forEach((part, index) => {
    filled += part;
    if (index >= parts.length - 1) return;
    const options = line.answers[index] || [];
    const preferred = options[0] || '______';
    const extras = options.slice(1);
    filled += extras.length ? `${preferred} (also ${extras.join(', ')})` : preferred;
  });
  const speaker = `Speaker ${line.speaker}: ${filled.trim()}`;
  return line.note ? `${speaker} — ${line.note}` : speaker;
}

export interface RoleplayPreset {
  id: string;
  name: string;
  objective: string;
  vocabulary: string;
  grammar: string;
}

const PRESET_KEY = 'ef-roleplay-presets';

export function listRoleplayPresets(): RoleplayPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(PRESET_KEY) || '[]') as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((entry): entry is RoleplayPreset => {
      if (!entry || typeof entry !== 'object') return false;
      const record = entry as RoleplayPreset;
      return typeof record.id === 'string' && typeof record.vocabulary === 'string';
    });
  } catch {
    return [];
  }
}

export function saveRoleplayPreset(preset: Omit<RoleplayPreset, 'id'> & { id?: string }): RoleplayPreset[] {
  const next: RoleplayPreset = {
    id: preset.id || `rp_${Math.random().toString(36).slice(2, 10)}`,
    name: preset.name.trim().slice(0, 60) || 'Saved objective',
    objective: preset.objective.trim().slice(0, 280),
    vocabulary: preset.vocabulary.trim().slice(0, 800),
    grammar: preset.grammar.trim().slice(0, 200),
  };
  const presets = [next, ...listRoleplayPresets().filter((item) => item.id !== next.id)].slice(0, 20);
  localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
  return presets;
}
