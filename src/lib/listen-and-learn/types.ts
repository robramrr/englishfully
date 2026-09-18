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
  /** When false, vocabulary cards hide play-audio clips. */
  vocabulary_audio_enabled: boolean;
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
  /** Project id(s) this makeup covers for missed / incomplete project credit. */
  makeup_project_ids: string[];
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
  vocabulary_audio_enabled?: boolean;
  status: 'draft' | 'published';
  makeup_enabled?: boolean;
  /** Prefer this when tying to one or more Listen & Answer assessments. */
  makeup_listen_assignment_ids?: string[];
  /** Legacy single id — still accepted and merged into ids. */
  makeup_listen_assignment_id?: string;
  /** Project id(s) this makeup covers for missed / incomplete projects. */
  makeup_project_ids?: string[];
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
  vocabulary_audio_enabled: boolean;
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
  const safe = Math.max(0, Number(seconds) || 0);
  // Round to tenths first so 5.96 → 6.0 (not 5.10)
  const totalTenths = Math.round(safe * 10);
  const mins = Math.floor(totalTenths / 600);
  const tenthsInMinute = totalTenths - mins * 600;
  const whole = Math.floor(tenthsInMinute / 10);
  const tenths = tenthsInMinute % 10;
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
  const fracRaw = match[3] ?? '';
  // Support ".5", ".50", ".123" without mangling precision
  const frac = fracRaw ? Number(`0.${fracRaw}`) : 0;
  return Math.max(0, mins * 60 + secs + (Number.isFinite(frac) ? frac : 0));
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
 * Never invents end times that spill into the next sentence's audio.
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
        sentence_text: `${current.sentence_text} ${segments[index].sentence_text}`
          .replace(/\s+/g, ' ')
          .trim(),
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
      sentence_text: `${previous.sentence_text} ${current.sentence_text}`
        .replace(/\s+/g, ' ')
        .trim(),
      start_seconds: previous.start_seconds,
      end_seconds: current.end_seconds,
    };
  } else {
    merged.push(current);
  }

  return merged;
}

/**
 * Align sentence texts to word-level Whisper timestamps.
 * Falls back to proportional split within [rangeStart, rangeEnd] when words are missing.
 */
export function alignSentencesToWordTimestamps(
  sentences: string[],
  words: Array<{ word: string; start: number; end: number }>,
  rangeStart = 0,
  rangeEnd?: number
): TranscriptSegmentDraft[] {
  if (sentences.length === 0) return [];

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9'\-]/g, '')
      .trim();

  const stamps = words
    .map((item) => ({
      token: normalize(item.word),
      start: item.start,
      end: item.end,
    }))
    .filter((item) => item.token && Number.isFinite(item.start) && Number.isFinite(item.end));

  if (stamps.length === 0) {
    const end = rangeEnd ?? Math.max(rangeStart + sentences.length * 3, rangeStart + 8);
    return distributeSentenceTimestampsFallback(sentences, rangeStart, end);
  }

  let cursor = 0;
  const drafts: TranscriptSegmentDraft[] = [];

  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex += 1) {
    const sentence = sentences[sentenceIndex];
    const tokens = sentence
      .split(/\s+/)
      .map(normalize)
      .filter(Boolean);

    if (tokens.length === 0) continue;

    let matchStart = -1;
    for (let index = cursor; index < stamps.length; index += 1) {
      let matches = true;
      for (let offset = 0; offset < tokens.length; offset += 1) {
        if (stamps[index + offset]?.token !== tokens[offset]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        matchStart = index;
        break;
      }
    }

    // Fuzzy: find first token, then take the next tokens.length stamps.
    if (matchStart < 0) {
      for (let index = cursor; index < stamps.length; index += 1) {
        if (stamps[index].token === tokens[0]) {
          matchStart = index;
          break;
        }
      }
    }

    if (matchStart >= 0) {
      const matchEnd = Math.min(stamps.length - 1, matchStart + tokens.length - 1);
      drafts.push({
        sentence_text: sentence,
        start_seconds: Number(Math.max(0, stamps[matchStart].start).toFixed(2)),
        end_seconds: Number(
          Math.max(stamps[matchStart].start + 0.3, stamps[matchEnd].end).toFixed(2)
        ),
      });
      cursor = matchEnd + 1;
      continue;
    }

    // No word match — estimate from neighbors / remaining range.
    const prevEnd = drafts.length > 0 ? drafts[drafts.length - 1].end_seconds : rangeStart;
    const remainingSentences = sentences.length - sentenceIndex;
    const remainingWords = Math.max(1, stamps.length - cursor);
    const approxSpan = Math.max(0.8, (remainingWords / Math.max(1, tokens.length)) * 0.35);
    const start = prevEnd;
    const end = Number((start + Math.max(0.8, tokens.length * 0.35, approxSpan)).toFixed(2));
    drafts.push({
      sentence_text: sentence,
      start_seconds: Number(start.toFixed(2)),
      end_seconds: end,
    });
  }

  return drafts;
}

/** @deprecated internal name kept for openai import compatibility via re-export below */
function distributeSentenceTimestampsFallback(
  sentences: string[],
  start: number,
  end: number
): TranscriptSegmentDraft[] {
  if (sentences.length === 0) return [];
  const span = Math.max(0.4, end - start);
  const weights = sentences.map((sentence) => Math.max(1, sentence.split(/\s+/).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = start;
  return sentences.map((sentence, index) => {
    const portion = span * (weights[index] / totalWeight);
    const segmentEnd = index === sentences.length - 1 ? end : cursor + portion;
    const draft: TranscriptSegmentDraft = {
      sentence_text: sentence,
      start_seconds: Number(cursor.toFixed(2)),
      end_seconds: Number(Math.max(cursor + 0.3, segmentEnd).toFixed(2)),
    };
    cursor = draft.end_seconds;
    return draft;
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
