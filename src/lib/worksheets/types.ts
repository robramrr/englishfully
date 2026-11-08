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
] as const;

export type WorksheetExerciseType = (typeof WORKSHEET_EXERCISES)[number]['type'];

export const WORKSHEET_EXERCISE_TYPES: WorksheetExerciseType[] = WORKSHEET_EXERCISES.map(
  (exercise) => exercise.type
);

export interface WorksheetHeader {
  title: string;
  teacherName: string;
  studentName: string;
  /** yyyy-mm-dd, or already formatted text. */
  date: string;
  className: string;
  /** Up to 5 digits. Blank boxes are left for the student when this is empty. */
  studentId: string;
  /** yyyy-mm-dd. Omitted from the sheet when empty. */
  dueDate: string;
  level: string;
  /** Short directions printed under the header. */
  instructions: string;
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

interface SectionBase {
  title: string;
  instructions: string;
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
      prompts: string[];
      bank: { letter: string; text: string }[];
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
    title: '',
    teacherName: '',
    studentName: '',
    date: '',
    className: '',
    studentId: '',
    dueDate: '',
    level,
    instructions: '',
  };
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
