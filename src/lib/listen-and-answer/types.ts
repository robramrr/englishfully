export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'fill_in_blank'
  | 'matching'
  | 'ordering';

export type TranscriptSource = 'auto' | 'manual';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type TimeUnit = 'minutes' | 'hours';

export const TIME_UNITS: TimeUnit[] = ['minutes', 'hours'];

export type AiQuestionPart = 'A' | 'B';

export type AiGeneratedQuestionType = 'multiple_choice' | 'true_false';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  fill_in_blank: 'Fill in the Blank',
  matching: 'Matching',
  ordering: 'Ordering',
};

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const DEFAULT_CEFR_LEVELS: CefrLevel[] = ['A2', 'B1'];

export const DEFAULT_QUESTION_FRAMEWORK = 'American English File';

export const DEFAULT_PART_INSTRUCTIONS_PLACEHOLDER =
  'Listen carefully. Then answer the questions below.';

export interface ListenQuestion {
  id: string;
  part_id: string;
  sort_order: number;
  question_type: QuestionType;
  question_text: string;
  choices: string[];
  correct_answer: string;
  keep_question: boolean;
  is_ai_generated: boolean;
  ai_part: AiQuestionPart | null;
  show_question_type: boolean;
}

export interface ListeningPart {
  id: string;
  assignment_id: string;
  title: string;
  sort_order: number;
  audio_url: string;
  thumbnail_url: string;
  qr_enabled: boolean;
  transcript: string;
  transcript_source: TranscriptSource;
  question_framework: string;
  cefr_levels: CefrLevel[];
  instructions: string;
  total_questions: string;
  time_amount: string;
  time_unit: TimeUnit;
  questions: ListenQuestion[];
}

export interface ListenAssignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  points: string;
  include_answer_key: boolean;
  include_student_info_line: boolean;
  instructions: string;
  total_questions: string;
  time_amount: string;
  time_unit: TimeUnit;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface ListenAssignmentWithParts extends ListenAssignment {
  parts: ListeningPart[];
}

export interface AssignmentListItem extends ListenAssignment {
  part_count: number;
  question_count: number;
}

export interface SaveAssignmentPayload {
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  points: string;
  include_answer_key: boolean;
  include_student_info_line: boolean;
  instructions: string;
  total_questions: string;
  time_amount: string;
  time_unit: TimeUnit;
  status: 'draft' | 'published';
  parts: SaveListeningPartPayload[];
}

export interface SaveListeningPartPayload {
  id?: string;
  title: string;
  audio_url: string;
  thumbnail_url: string;
  qr_enabled: boolean;
  transcript: string;
  transcript_source: TranscriptSource;
  question_framework: string;
  cefr_levels: CefrLevel[];
  instructions: string;
  total_questions: string;
  time_amount: string;
  time_unit: TimeUnit;
  questions: SaveQuestionPayload[];
}

export interface SaveQuestionPayload {
  id?: string;
  question_type: QuestionType;
  question_text: string;
  choices: string[];
  correct_answer: string;
  keep_question: boolean;
  is_ai_generated: boolean;
  ai_part: AiQuestionPart | null;
  show_question_type: boolean;
}

export interface GeneratedQuestionDraft {
  question_text: string;
  question_type: QuestionType;
  choices: string[];
  correct_answer: string;
}

export function createEmptyPart(sortOrder: number): SaveListeningPartPayload {
  return {
    title: `Part ${sortOrder + 1}`,
    audio_url: '',
    thumbnail_url: '',
    qr_enabled: false,
    transcript: '',
    transcript_source: 'auto',
    question_framework: DEFAULT_QUESTION_FRAMEWORK,
    cefr_levels: [...DEFAULT_CEFR_LEVELS],
    instructions: '',
    total_questions: '',
    time_amount: '',
    time_unit: 'minutes',
    questions: [],
  };
}

export function formatTotalQuestionsLine(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return `Total: ${trimmed} questions`;
}

export function formatTimeLine(amount: string, unit: TimeUnit): string | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  const unitLabel =
    unit === 'hours'
      ? numeric === 1
        ? 'hour'
        : 'hours'
      : numeric === 1
        ? 'minute'
        : 'minutes';
  return `Time: ${trimmed} ${unitLabel}`;
}

export function createEmptyQuestion(sortOrder: number): SaveQuestionPayload {
  return {
    question_type: 'multiple_choice',
    question_text: '',
    choices: ['', '', '', ''],
    correct_answer: '',
    keep_question: true,
    is_ai_generated: false,
    ai_part: null,
    show_question_type: false,
  };
}

export function getPrintableQuestions(part: ListeningPart): ListenQuestion[] {
  return part.questions.filter((q) => q.keep_question);
}

export function formatQuestionLabel(index: number): string {
  return `Question ${index + 1}`;
}

export function reorderItems<T extends { sort_order: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, sort_order: index }));
}
