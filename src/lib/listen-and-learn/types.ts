import type { CefrLevel } from '@/lib/listen-and-answer/types';
import type { SpeakEntryConfig } from '@/lib/speak-and-submit/types';

export type { CefrLevel };
export type { SpeakEntryConfig };
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

export interface LearnVocabularyItem {
  id: string;
  assignment_id: string;
  sort_order: number;
  word: string;
  definition: string;
  image_url: string;
  start_seconds: number;
  end_seconds: number;
  keep_word: boolean;
}

export interface GeneratedVocabularyItem {
  word: string;
  definition: string;
  start_seconds: number;
  end_seconds: number;
}

export interface LearnAssignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  audio_url: string;
  thumbnail_url: string;
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
  /** When true, passing this Learn credits a separate makeup gradebook row. */
  makeup_enabled: boolean;
  /**
   * Listen & Answer assessment id(s) this makeup is for.
   * Stored as a single id or JSON array in `makeup_listen_assignment_id`.
   */
  makeup_listen_assignment_ids: string[];
  /** First tied assessment id (legacy / convenience). */
  makeup_listen_assignment_id: string;
  /**
   * Class labels (Speak/entry config) allowed to earn makeup.
   * Empty array = all classes that failed the tied assessment.
   */
  makeup_class_names: string[];
  created_at: string;
  updated_at: string;
}

/** Minimum listening-segment duration for workable comprehension questions. */
export const MIN_SEGMENT_SECONDS = 5;

export interface LearnAssignmentWithDetails extends LearnAssignment {
  vocabulary: LearnVocabularyItem[];
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
  /** Present on submit responses when this Learn is a makeup. */
  makeup_credited?: boolean | null;
}

export interface SaveLearnAssignmentPayload {
  teacher_name: string;
  title: string;
  class_name: string;
  due_date: string | null;
  audio_url: string;
  thumbnail_url: string;
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
  makeup_enabled?: boolean;
  /** Prefer this when tying to one or more Listen & Answer assessments. */
  makeup_listen_assignment_ids?: string[];
  /** Legacy single id — still accepted and merged into ids. */
  makeup_listen_assignment_id?: string;
  makeup_class_names?: string[];
  vocabulary: Array<{
    id?: string;
    word: string;
    definition: string;
    image_url?: string;
    /** When true, empty image_url must clear a previously saved image. */
    clear_image?: boolean;
    start_seconds: number;
    end_seconds: number;
    keep_word: boolean;
  }>;
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
  thumbnail_url: string;
  attempts_allowed: number;
  passing_score: number;
  max_replays: number;
  randomize_questions: boolean;
  randomize_answers: boolean;
  /** Same student entry settings as Speak & Submit (nickname/class/ID). */
  entry_config: SpeakEntryConfig;
  vocabulary: Array<{
    id: string;
    word: string;
    definition: string;
    image_url: string;
    start_seconds: number;
    end_seconds: number;
  }>;
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

/** Strip leading "A." / "B)" / "C :" style labels — the UI already shows letters. */
export function stripChoiceLetterPrefix(value: string): string {
  return value
    .trim()
    .replace(/^[A-Da-d](?:\s*[.\)\:\-–—]\s*|\s+)/, '')
    .trim();
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

/**
 * Merge adjacent segments until each is at least `minSeconds` long,
 * so clips are long enough for a complete thought / workable question.
 */
export function mergeShortSegments(
  segments: TranscriptSegmentDraft[],
  minSeconds: number = MIN_SEGMENT_SECONDS
): TranscriptSegmentDraft[] {
  if (segments.length === 0) return [];

  const merged: TranscriptSegmentDraft[] = [];
  let current: TranscriptSegmentDraft = { ...segments[0] };

  for (let index = 1; index < segments.length; index += 1) {
    const duration = segmentDuration(current.start_seconds, current.end_seconds);
    if (duration < minSeconds) {
      current = {
        sentence_text: `${current.sentence_text} ${segments[index].sentence_text}`.replace(/\s+/g, ' ').trim(),
        start_seconds: current.start_seconds,
        end_seconds: segments[index].end_seconds,
      };
    } else {
      merged.push(current);
      current = { ...segments[index] };
    }
  }

  const lastDuration = segmentDuration(current.start_seconds, current.end_seconds);
  if (merged.length > 0 && lastDuration < minSeconds) {
    const previous = merged[merged.length - 1];
    merged[merged.length - 1] = {
      sentence_text: `${previous.sentence_text} ${current.sentence_text}`.replace(/\s+/g, ' ').trim(),
      start_seconds: previous.start_seconds,
      end_seconds: current.end_seconds,
    };
  } else {
    // Pad a lone short clip so playback lasts at least minSeconds.
    if (lastDuration < minSeconds) {
      current = {
        ...current,
        end_seconds: Number((current.start_seconds + minSeconds).toFixed(2)),
      };
    }
    merged.push(current);
  }

  return merged.map((segment) => {
    const duration = segmentDuration(segment.start_seconds, segment.end_seconds);
    if (duration >= minSeconds) return segment;
    return {
      ...segment,
      end_seconds: Number((segment.start_seconds + minSeconds).toFixed(2)),
    };
  });
}

/**
 * Parse tied Listen & Answer id(s) from DB / payload.
 * Supports legacy single id, JSON array, or string[].
 */
export function parseMakeupListenAssignmentIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(value.map((item) => String(item ?? '').trim()).filter(Boolean)),
    ];
  }
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return [
          ...new Set(parsed.map((item) => String(item ?? '').trim()).filter(Boolean)),
        ];
      }
    } catch {
      // fall through
    }
  }
  return [raw];
}

/** Persist one or more tied assessment ids (single id stays plain for legacy rows). */
export function serializeMakeupListenAssignmentIds(ids: unknown): string {
  const cleaned = parseMakeupListenAssignmentIds(ids);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
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
