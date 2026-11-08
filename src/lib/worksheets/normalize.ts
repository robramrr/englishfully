import {
  exerciseLabel,
  isWorksheetExerciseType,
  type WorksheetExerciseRequest,
  type WorksheetExerciseType,
  type WorksheetSection,
} from './types';

const LETTERS = 'ABCDEFGH';

function clean(value: unknown, max = 400): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap];
    next[swap] = current;
  }
  return next;
}

function shuffleDifferent<T>(items: T[]): T[] {
  if (items.length < 2) return [...items];
  const original = items.join('\u0000');
  let next = shuffle(items);
  let tries = 0;
  while (next.join('\u0000') === original && tries < 5) {
    next = shuffle(items);
    tries += 1;
  }
  if (next.join('\u0000') === original) {
    const swapped = [...items];
    const first = swapped[0];
    swapped[0] = swapped[1];
    swapped[1] = first;
    return swapped;
  }
  return next;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

const TYPE_ALIASES: Record<string, WorksheetExerciseType> = {
  fill_blank: 'fill_blank',
  fill_in_the_blank: 'fill_blank',
  'fill-in-the-blank': 'fill_blank',
  fillinblank: 'fill_blank',
  multiple_choice: 'multiple_choice',
  'multiple-choice': 'multiple_choice',
  multiplechoice: 'multiple_choice',
  mcq: 'multiple_choice',
  matching: 'matching',
  match: 'matching',
  unjumble: 'unjumble',
  word_order: 'unjumble',
  unscramble_sentence: 'unjumble',
  anagram: 'anagram',
  unscramble: 'anagram',
  true_false: 'true_false',
  'true-false': 'true_false',
  truefalse: 'true_false',
  tf: 'true_false',
  short_answer: 'short_answer',
  'short-answer': 'short_answer',
  shortanswer: 'short_answer',
  comprehension: 'short_answer',
};

export function canonicalExerciseType(value: unknown): WorksheetExerciseType | null {
  const key = clean(value, 40).toLowerCase().replace(/\s+/g, '_');
  const aliased = TYPE_ALIASES[key];
  if (aliased) return aliased;
  return isWorksheetExerciseType(key) ? key : null;
}

function sectionCopy(
  raw: Record<string, unknown>,
  type: WorksheetExerciseType
): { title: string; instructions: string } {
  const title = clean(raw.title, 80) || exerciseLabel(type);
  const instructions = clean(raw.instructions ?? raw.direction ?? raw.directions, 180);
  return { title, instructions };
}

function ensureBlank(prompt: string, answer: string): string {
  if (/_{3,}|\[blank\]|\(\s*\)/i.test(prompt)) {
    return prompt.replace(/\[blank\]|\(\s*\)/gi, '______').replace(/_{3,}/g, '______');
  }
  if (answer && prompt.toLowerCase().includes(answer.toLowerCase())) {
    return prompt.replace(new RegExp(escapeRegExp(answer), 'i'), '______');
  }
  const stripped = prompt.replace(/[.?!]$/, '').trim();
  return stripped ? `${stripped} ______.` : '______';
}

function parseFillBlank(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const answer = clean(record.answer ?? record.word, 40);
      const prompt = ensureBlank(clean(record.prompt ?? record.sentence ?? record.text, 240), answer);
      if (!answer || !prompt) return null;
      return { prompt, answer };
    })
    .filter((item): item is { prompt: string; answer: string } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  const uniqueAnswers = [...new Set(items.map((item) => item.answer))];
  const wordBank = uniqueAnswers.length >= 3 ? shuffleDifferent(uniqueAnswers) : [];
  return { type: 'fill_blank', ...sectionCopy(raw, 'fill_blank'), wordBank, items };
}

function resolveChoice(answer: string, choices: string[]): string {
  const exact = choices.find((choice) => choice.toLowerCase() === answer.toLowerCase());
  if (exact) return exact;
  const letter = answer.trim().toUpperCase();
  if (/^[A-D]$/.test(letter)) {
    const byLetter = choices[letter.charCodeAt(0) - 65];
    if (byLetter) return byLetter;
  }
  return choices[0] || answer;
}

function parseMultipleChoice(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const prompt = clean(record.prompt ?? record.question ?? record.stem, 240);
      const seen = new Set<string>();
      const choices = asList(record.choices ?? record.options)
        .map((choice) => clean(choice, 80))
        .filter((choice) => {
          const key = choice.toLowerCase();
          if (!choice || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 4);
      const answerText = clean(record.answer ?? record.correct, 80);
      if (!prompt || choices.length < 2 || !answerText) return null;
      if (!choices.some((choice) => choice.toLowerCase() === answerText.toLowerCase())) {
        choices.unshift(answerText);
      }
      const four = choices.slice(0, 4);
      const answer = resolveChoice(answerText, four);
      return { prompt, choices: shuffleDifferent(four), answer };
    })
    .filter((item): item is { prompt: string; choices: string[]; answer: string } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  return { type: 'multiple_choice', ...sectionCopy(raw, 'multiple_choice'), items };
}

function parseMatching(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const pairs = asList(raw.items ?? raw.pairs)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const left = clean(record.left ?? record.prompt ?? record.term ?? record.word, 80);
      const right = clean(record.right ?? record.answer ?? record.match ?? record.definition, 120);
      if (!left || !right || left.toLowerCase() === right.toLowerCase()) return null;
      return { left, right };
    })
    .filter((pair): pair is { left: string; right: string } => Boolean(pair));
  const seenRights = new Set<string>();
  const uniquePairs = pairs
    .filter((pair) => {
      const key = pair.right.toLowerCase();
      if (seenRights.has(key)) return false;
      seenRights.add(key);
      return true;
    })
    .slice(0, count);

  if (uniquePairs.length < 2) return null;
  const bank = shuffleDifferent(uniquePairs.map((pair) => pair.right)).map((text, index) => ({
    letter: LETTERS[index] || String(index + 1),
    text,
  }));
  const answers = uniquePairs.map((pair) => {
    const match = bank.find((entry) => entry.text === pair.right);
    return match?.letter || '';
  });
  return {
    type: 'matching',
    ...sectionCopy(raw, 'matching'),
    prompts: uniquePairs.map((pair) => pair.left),
    bank,
    answers,
  };
}

function parseUnjumble(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const answer = clean(record.answer ?? record.sentence, 180);
      const provided = asList(record.words ?? record.tokens)
        .map((word) => clean(word, 40))
        .filter(Boolean);
      const fromAnswer = answer.split(' ').filter(Boolean);
      const words = provided.length >= 2 ? provided : fromAnswer;
      if (!answer || words.length < 2) return null;
      return { words: shuffleDifferent(words), answer };
    })
    .filter((item): item is { words: string[]; answer: string } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  return { type: 'unjumble', ...sectionCopy(raw, 'unjumble'), items };
}

function scrambleWord(word: string): string {
  const letters = [...word];
  if (letters.length < 2) return word.toUpperCase();
  let scrambled = shuffle(letters).join('');
  if (scrambled.toLowerCase() === word.toLowerCase()) {
    scrambled = [...letters].reverse().join('');
  }
  return scrambled.toUpperCase();
}

function parseAnagram(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const answer = clean(record.answer ?? record.word, 32).replace(/[^A-Za-z'-]/g, '');
      if (answer.length < 3) return null;
      let clue = clean(record.clue ?? record.prompt ?? record.hint, 120);
      if (!clue) clue = 'Unscramble the word.';
      if (clue.toLowerCase().includes(answer.toLowerCase())) {
        clue = clue.replace(new RegExp(escapeRegExp(answer), 'ig'), 'this word');
      }
      return { clue, scrambled: scrambleWord(answer), answer };
    })
    .filter((item): item is { clue: string; scrambled: string; answer: string } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  return { type: 'anagram', ...sectionCopy(raw, 'anagram'), items };
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  const text = clean(value, 12).toLowerCase();
  if (['true', 't', 'yes', 'correct'].includes(text)) return true;
  if (['false', 'f', 'no', 'incorrect'].includes(text)) return false;
  return null;
}

function parseTrueFalse(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const statement = clean(record.statement ?? record.prompt ?? record.sentence, 220);
      const answer = parseBoolean(record.answer ?? record.correct);
      if (!statement || answer === null) return null;
      return { statement, answer };
    })
    .filter((item): item is { statement: string; answer: boolean } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  return { type: 'true_false', ...sectionCopy(raw, 'true_false'), items };
}

function parseShortAnswer(raw: Record<string, unknown>, count: number): WorksheetSection | null {
  const items = asList(raw.items)
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const prompt = clean(record.prompt ?? record.question, 240);
      const answer = clean(record.answer ?? record.sample ?? record.sampleAnswer, 240);
      if (!prompt || !answer) return null;
      return { prompt, answer };
    })
    .filter((item): item is { prompt: string; answer: string } => Boolean(item))
    .slice(0, count);

  if (items.length === 0) return null;
  return { type: 'short_answer', ...sectionCopy(raw, 'short_answer'), items };
}

const PARSERS: Record<
  WorksheetExerciseType,
  (raw: Record<string, unknown>, count: number) => WorksheetSection | null
> = {
  fill_blank: parseFillBlank,
  multiple_choice: parseMultipleChoice,
  matching: parseMatching,
  unjumble: parseUnjumble,
  anagram: parseAnagram,
  true_false: parseTrueFalse,
  short_answer: parseShortAnswer,
};

export function normalizeWorksheet(
  raw: unknown,
  requested: WorksheetExerciseRequest[]
): { title: string; instructions: string; sections: WorksheetSection[] } {
  const record = asRecord(raw) ?? {};
  const requestedByType = new Map(requested.map((exercise) => [exercise.type, exercise.count]));
  const parsed = new Map<WorksheetExerciseType, WorksheetSection>();

  for (const entry of asList(record.sections ?? record.exercises)) {
    const section = asRecord(entry);
    if (!section) continue;
    const type = canonicalExerciseType(section.type ?? section.kind);
    if (!type || !requestedByType.has(type) || parsed.has(type)) continue;
    const count = requestedByType.get(type) ?? 0;
    const next = PARSERS[type](section, count);
    if (next) parsed.set(type, next);
  }

  const sections = requested
    .map((exercise) => parsed.get(exercise.type))
    .filter((section): section is WorksheetSection => Boolean(section));

  if (sections.length === 0) {
    throw new Error('The worksheet came back empty. Try again with a clearer topic or transcript.');
  }

  return {
    title: clean(record.title, 80),
    instructions: clean(record.instructions ?? record.directions, 180),
    sections,
  };
}
