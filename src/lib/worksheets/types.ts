import { VOCAB_LEVELS, type VocabLevel } from '@/lib/vocabulary/types';

export { VOCAB_LEVELS };
export type WorksheetLevel = VocabLevel;

export const WORKSHEET_EXERCISES = [
  {
    type: 'fill_blank',
    label: 'Fill in the blank',
    hint: 'A sentence with a missing word',
    defaultOn: true,
    defaultCount: 5,
  },
  {
    type: 'multiple_choice',
    label: 'Multiple choice',
    hint: 'Four choices, one correct answer',
    defaultOn: true,
    defaultCount: 4,
  },
  {
    type: 'matching',
    label: 'Matching',
    hint: 'Pair each item with its match',
    defaultOn: true,
    defaultCount: 5,
  },
  {
    type: 'unjumble',
    label: 'Unjumble',
    hint: 'Put the words into a sentence',
    defaultOn: false,
    defaultCount: 4,
  },
  {
    type: 'anagram',
    label: 'Anagram',
    hint: 'Unscramble the letters',
    defaultOn: false,
    defaultCount: 5,
  },
  {
    type: 'true_false',
    label: 'True or false',
    hint: 'Decide if the sentence is true',
    defaultOn: false,
    defaultCount: 4,
  },
  {
    type: 'short_answer',
    label: 'Short answer',
    hint: 'Write a short response',
    defaultOn: false,
    defaultCount: 3,
  },
  {
    type: 'question_sentence',
    label: 'Question and sentence',
    hint: 'Underline a word in the question, then leave a blank in the answer',
    defaultOn: false,
    defaultCount: 5,
  },
  {
    type: 'crossword',
    label: 'Crossword',
    hint: 'Fill the grid from the clues',
    defaultOn: false,
    defaultCount: 6,
  },
  {
    type: 'guided_roleplay',
    label: 'AI Guided Roleplay',
    hint: 'A partner dialogue with blanks and word banks',
    defaultOn: false,
    defaultCount: 8,
  },
] as const;

export type WorksheetExerciseType = (typeof WORKSHEET_EXERCISES)[number]['type'];

export const WORKSHEET_EXERCISE_TYPES: WorksheetExerciseType[] = WORKSHEET_EXERCISES.map(
  (exercise) => exercise.type
);

/** Which header lines are printed. Unticked lines stay off the sheet. */
export interface WorksheetHeaderVisibility {
  masthead: boolean;
  title: boolean;
  teacherName: boolean;
  className: boolean;
  date: boolean;
  studentName: boolean;
  studentId: boolean;
  rollNumber: boolean;
  dueDate: boolean;
  instructions: boolean;
}

export interface WorksheetHeader {
  /** The small line above the title, such as "Englishfully worksheet · A2". */
  masthead: string;
  title: string;
  teacherName: string;
  studentName: string;
  /** yyyy-mm-dd, or already formatted text. */
  date: string;
  className: string;
  /** Up to 5 digits. Blank boxes are left for the student when this is empty. */
  studentId: string;
  /** Up to 2 digits. */
  rollNumber: string;
  /** Up to 2 characters shown faintly in empty roll boxes. */
  rollPlaceholder: string;
  /** yyyy-mm-dd. A blank due line still prints when this field is shown. */
  dueDate: string;
  level: string;
  /** Short directions printed under the header. */
  instructions: string;
  show: WorksheetHeaderVisibility;
  /** Left-to-right order of the header lines on the sheet. */
  fieldOrder: HeaderLineField[];
}

export function defaultHeaderVisibility(): WorksheetHeaderVisibility {
  return {
    masthead: true,
    title: true,
    teacherName: true,
    className: true,
    date: true,
    studentName: true,
    studentId: true,
    rollNumber: true,
    dueDate: true,
    instructions: true,
  };
}

/** Lines that sit in the header row and can be reordered. */
export const HEADER_LINE_FIELDS = [
  'teacherName',
  'className',
  'date',
  'studentName',
  'studentId',
  'rollNumber',
  'dueDate',
] as const;

export type HeaderLineField = (typeof HEADER_LINE_FIELDS)[number];

export function defaultFieldOrder(): HeaderLineField[] {
  return [...HEADER_LINE_FIELDS];
}

export function normalizeFieldOrder(value: unknown): HeaderLineField[] {
  const allowed = new Set<string>(HEADER_LINE_FIELDS);
  const seen = new Set<string>();
  const order: HeaderLineField[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && allowed.has(item) && !seen.has(item)) {
        seen.add(item);
        order.push(item as HeaderLineField);
      }
    }
  }
  for (const field of HEADER_LINE_FIELDS) {
    if (!seen.has(field)) order.push(field);
  }
  return order;
}

export interface FillBlankItem {
  prompt: string;
  answer: string;
}

export interface MultipleChoiceItem {
  prompt: string;
  choices: string[];
  answer: string;
}

export interface UnjumbleItem {
  words: string[];
  answer: string;
}

export interface AnagramItem {
  clue: string;
  scrambled: string;
  answer: string;
}

export interface TrueFalseItem {
  statement: string;
  answer: boolean;
}

export interface ShortAnswerItem {
  prompt: string;
  answer: string;
}

export interface QuestionSentenceItem {
  question: string;
  /** Word indexes to underline, such as Who, What, When, Where, Why, or How. */
  underline: number[];
  /** The full answer sentence. Words in `blanks` print as a writing line. */
  sentence: string;
  /** Inclusive word-index ranges. Each run prints as one blank. */
  blanks: [number, number][];
}

export interface MatchingPrompt {
  text: string;
  imageUrl: string;
}

export interface MatchingBankEntry {
  letter: string;
  text: string;
  imageUrl: string;
}

export interface CrosswordEntry {
  number: number;
  direction: 'across' | 'down';
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export const ROLEPLAY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type RoleplayLevel = (typeof ROLEPLAY_LEVELS)[number];
export type RoleplayDifficulty = 'easy' | 'standard' | 'challenging';
export type RoleplayWordUse = 'once' | 'repeat';

export interface RoleplayBank {
  label: string;
  words: string[];
}

/** One spoken line. `______` marks a blank. `answers[i]` lists acceptable words for that blank. */
export interface RoleplayLine {
  speaker: 1 | 2;
  text: string;
  answers: string[][];
  note: string;
}

export interface RoleplaySettings {
  level: RoleplayLevel;
  objective: string;
  vocabulary: string;
  grammar: string;
  difficulty: RoleplayDifficulty;
  wordUse: RoleplayWordUse;
}

interface SectionBase {
  title: string;
  instructions: string;
  /** When false, the exercise stays on screen and is left out of the print. */
  includeInPrint?: boolean;
}

export type WorksheetSection =
  | (SectionBase & {
      type: 'fill_blank';
      wordBank: string[];
      items: FillBlankItem[];
    })
  | (SectionBase & {
      type: 'multiple_choice';
      items: MultipleChoiceItem[];
    })
  | (SectionBase & {
      type: 'matching';
      prompts: MatchingPrompt[];
      bank: MatchingBankEntry[];
      answers: string[];
    })
  | (SectionBase & {
      type: 'unjumble';
      items: UnjumbleItem[];
    })
  | (SectionBase & {
      type: 'anagram';
      items: AnagramItem[];
    })
  | (SectionBase & {
      type: 'true_false';
      items: TrueFalseItem[];
    })
  | (SectionBase & {
      type: 'short_answer';
      items: ShortAnswerItem[];
    })
  | (SectionBase & {
      type: 'question_sentence';
      items: QuestionSentenceItem[];
    })
  | (SectionBase & {
      type: 'crossword';
      entries: CrosswordEntry[];
    })
  | (SectionBase & {
      type: 'guided_roleplay';
      topic: string;
      objective: string;
      vocabulary: string;
      grammar: string;
      level: RoleplayLevel;
      difficulty: RoleplayDifficulty;
      wordUse: RoleplayWordUse;
      banks: RoleplayBank[];
      lines: RoleplayLine[];
    });

/** One printable worksheet. Pass this to WorksheetTemplate to reuse the paper. */
export interface WorksheetDocument {
  header: WorksheetHeader;
  sections: WorksheetSection[];
}

export interface WorksheetExerciseRequest {
  type: WorksheetExerciseType;
  count: number;
}

export function emptyWorksheetHeader(level: WorksheetLevel = 'A2'): WorksheetHeader {
  return {
    masthead: `Englishfully worksheet · ${level}`,
    title: '',
    teacherName: '',
    studentName: '',
    date: '',
    className: '',
    studentId: '',
    rollNumber: '',
    rollPlaceholder: '',
    dueDate: '',
    level,
    instructions: '',
    show: defaultHeaderVisibility(),
    fieldOrder: defaultFieldOrder(),
  };
}

export function exerciseCountMax(type: WorksheetExerciseType): number {
  return type === 'guided_roleplay' ? 10 : 8;
}

export function exerciseCountMin(type: WorksheetExerciseType): number {
  return type === 'guided_roleplay' ? 4 : 1;
}

export function isWorksheetExerciseType(value: string): value is WorksheetExerciseType {
  return (WORKSHEET_EXERCISE_TYPES as string[]).includes(value);
}

export function exerciseLabel(type: WorksheetExerciseType): string {
  return WORKSHEET_EXERCISES.find((exercise) => exercise.type === type)?.label ?? type;
}

export function formatWorksheetDate(value: string): string {
  if (!value.trim()) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const date = new Date(`${value.trim()}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value.trim();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayInputValue(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
