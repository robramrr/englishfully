import type { CefrLevel } from '@/lib/listen-and-answer/types';

export type { CefrLevel };
export { CEFR_LEVELS, DEFAULT_QUESTION_FRAMEWORK } from '@/lib/listen-and-answer/types';

export type LearnTranscriptSource = 'auto' | 'manual';
export type LearnDifficulty = 'easy' | 'medium' | 'hard';

export const LEARN_DIFFICULTIES: LearnDifficulty[] = ['easy', 'medium', 'hard'];

export const LEARN_DIFFICULTY_LABELS: Record<LearnDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export interface LearnSegment {
  id: string;
  assignment_id: string;
  sort_order: number;
  sentence_text: string;
  start_seconds: number;
  end_seconds: number;
  selected: boolean;
}

export interface LearnQuestion {
  id: string;
  assignment_id: string;
  segment_id: string | null;
  sort_order: number;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
  keep_question: boolean;
}

export interface LearnAssignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  audio_url: string;
  transcript: string;
  transcript_source: LearnTranscriptSource;
  cefr_level: CefrLevel;
  question_count_target: number;
  difficulty: LearnDifficulty;
  question_framework: string;
  attempts_allowed: number;
  passing_score: number;
  max_replays: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface LearnAssignmentWithDetails extends LearnAssignment {
  segments: LearnSegment[];
  questions: LearnQuestion[];
}

export interface LearnAssignmentListItem extends LearnAssignment {
  segment_count: number;
  selected_segment_count: number;
  question_count: number;
  submission_count: number;
}

export interface LearnSubmissionAnswer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}

export interface LearnSubmission {
  id: string;
  assignment_id: string;
  student_name: string;
  student_number: string;
  class_number: string;
  score: number;
  max_score: number;
  percent: number;
  attempt_number: number;
  duration_seconds: number | null;
  submitted_at: string;
  answers: LearnSubmissionAnswer[];
}

export interface SaveLearnAssignmentPayload {
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  audio_url: string;
  transcript: string;
  transcript_source: LearnTranscriptSource;
  cefr_level: CefrLevel;
  question_count_target: number;
  difficulty: LearnDifficulty;
  question_framework: string;
  attempts_allowed: number;
  passing_score: number;
  max_replays: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  status: 'draft' | 'published';
  segments: Array<{
    id?: string;
    sentence_text: string;
    start_seconds: number;
    end_seconds: number;
    selected: boolean;
  }>;
  questions: Array<{
    id?: string;
    segment_id?: string | null;
    question_text: string;
    choices: string[];
    correct_answer: string;
    explanation: string;
    keep_question: boolean;
  }>;
}

export interface TranscriptSegmentDraft {
  sentence_text: string;
  start_seconds: number;
  end_seconds: number;
}

export interface GeneratedLearnQuestion {
  segment_index: number;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

export interface PublicLearnAssignment {
  id: string;
  title: string;
  teacher_name: string;
  class_name: string;
  due_date: string | null;
  audio_url: string;
  attempts_allowed: number;
  passing_score: number;
  max_replays: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  questions: Array<{
    id: string;
    question_text: string;
    choices: string[];
    start_seconds: number;
    end_seconds: number;
  }>;
}

export interface SubmitLearnPayload {
  student_name: string;
  student_number: string;
  class_number: string;
  duration_seconds?: number;
  answers: Array<{
    question_id: string;
    selected_answer: string;
  }>;
}

export function formatTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  const whole = Math.floor(secs);
  const tenths = Math.round((secs - whole) * 10);
  return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
}

export function parseTimestamp(value: string): number {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
  if (!match) {
    const asNumber = Number(trimmed);
    return Number.isFinite(asNumber) ? Math.max(0, asNumber) : 0;
  }
  const mins = Number(match[1]);
  const secs = Number(match[2]);
  const frac = match[3] ? Number(`0.${match[3]}`) : 0;
  return mins * 60 + secs + frac;
}

export function segmentDuration(start: number, end: number): number {
  return Math.max(0, Number((end - start).toFixed(2)));
}

export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getKeepQuestions(assignment: LearnAssignmentWithDetails): LearnQuestion[] {
  return assignment.questions.filter((question) => question.keep_question);
}

export function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}
