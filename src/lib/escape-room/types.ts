export type EscapeRoomStatus = 'draft' | 'published' | 'archived';

export type EscapeChallengeType =
  | 'image_investigation'
  | 'vocabulary'
  | 'sentence_building'
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'listening'
  | 'video'
  | 'code_lock'
  | 'open_response'
  | 'matching';

export const ESCAPE_CHALLENGE_TYPES: EscapeChallengeType[] = [
  'image_investigation',
  'vocabulary',
  'sentence_building',
  'multiple_choice',
  'fill_in_blank',
  'listening',
  'video',
  'code_lock',
  'open_response',
  'matching',
];

export const ESCAPE_CHALLENGE_TYPE_LABELS: Record<EscapeChallengeType, string> = {
  image_investigation: 'Image Investigation',
  vocabulary: 'Vocabulary',
  sentence_building: 'Sentence Building',
  multiple_choice: 'Multiple Choice',
  fill_in_blank: 'Fill in the Blank',
  listening: 'Listening',
  video: 'Video Challenge',
  code_lock: 'Code / Lock',
  open_response: 'Open Response',
  matching: 'Matching',
};

export const ESCAPE_ROOM_STATUSES: EscapeRoomStatus[] = ['draft', 'published', 'archived'];

export const ESCAPE_ROOM_STATUS_LABELS: Record<EscapeRoomStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

export const MIN_ESCAPE_CHALLENGES = 1;
export const MAX_ESCAPE_CHALLENGES = 6;

/** Flexible media payload attached to a challenge or home base. */
export interface EscapeMediaItem {
  kind: 'image' | 'audio' | 'video';
  url: string;
  title?: string;
  description?: string;
}

export interface EscapeHintConfig {
  hint_1: string;
  hint_2: string;
  final_hint: string;
}

export interface EscapeRewardConfig {
  /** letter | number | word | custom */
  kind: 'letter' | 'number' | 'word' | 'custom';
  value: string;
}

/**
 * Type-specific challenge payload. Kept as a loose record so new challenge
 * types can land without migrations; editors validate per type later.
 */
export type EscapeChallengeContent = Record<string, unknown>;

export interface EscapeAnswerConfig {
  /** Accepted answers (case-insensitive match by default in later phases). */
  accepted_answers: string[];
  /** Multiple-choice style options when relevant. */
  choices?: string[];
  case_sensitive?: boolean;
}

export interface EscapeRoomChallenge {
  id: string;
  escape_room_id: string;
  sort_order: number;
  type: EscapeChallengeType;
  title: string;
  instructions: string;
  content: EscapeChallengeContent;
  media: EscapeMediaItem[];
  answer_configuration: EscapeAnswerConfig;
  reward_configuration: EscapeRewardConfig | null;
  hints: EscapeHintConfig;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EscapeRoom {
  id: string;
  teacher_id: string;
  title: string;
  mission: string;
  instructions: string;
  learning_objective: string;
  english_level: string;
  estimated_time: string;
  /** Teacher-configured final escape code (e.g. A7B4C). */
  final_code: string;
  final_success_message: string;
  status: EscapeRoomStatus;
  created_at: string;
  updated_at: string;
}

export interface EscapeRoomWithChallenges extends EscapeRoom {
  challenges: EscapeRoomChallenge[];
}

export interface EscapeRoomListItem extends EscapeRoom {
  challenge_count: number;
}

export interface CreateEscapeRoomPayload {
  title?: string;
  mission?: string;
  instructions?: string;
  learning_objective?: string;
  english_level?: string;
  estimated_time?: string;
  challenge_count?: number;
}

export interface UpdateEscapeRoomPayload {
  title?: string;
  mission?: string;
  instructions?: string;
  learning_objective?: string;
  english_level?: string;
  estimated_time?: string;
  final_code?: string;
  final_success_message?: string;
  status?: EscapeRoomStatus;
  challenges?: EscapeChallengeSavePayload[];
}

export interface EscapeChallengeSavePayload {
  id?: string;
  type: EscapeChallengeType;
  title?: string;
  instructions?: string;
  content?: EscapeChallengeContent;
  media?: EscapeMediaItem[];
  answer_configuration?: EscapeAnswerConfig;
  reward_configuration?: EscapeRewardConfig | null;
  hints?: Partial<EscapeHintConfig>;
  settings?: Record<string, unknown>;
}

export function isEscapeChallengeType(value: unknown): value is EscapeChallengeType {
  return (
    typeof value === 'string' &&
    (ESCAPE_CHALLENGE_TYPES as string[]).includes(value)
  );
}

export function isEscapeRoomStatus(value: unknown): value is EscapeRoomStatus {
  return typeof value === 'string' && (ESCAPE_ROOM_STATUSES as string[]).includes(value);
}

export function clampChallengeCount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return 4;
  return Math.min(MAX_ESCAPE_CHALLENGES, Math.max(MIN_ESCAPE_CHALLENGES, Math.round(n)));
}

export function emptyHints(): EscapeHintConfig {
  return { hint_1: '', hint_2: '', final_hint: '' };
}

export function emptyAnswerConfig(): EscapeAnswerConfig {
  return { accepted_answers: [], choices: [], case_sensitive: false };
}

export function defaultChallengeTitle(index: number, type: EscapeChallengeType): string {
  return `Challenge ${index + 1}: ${ESCAPE_CHALLENGE_TYPE_LABELS[type]}`;
}

export interface EscapeProgressRecord {
  id: string;
  escape_room_id: string;
  student_label: string;
  student_number: string;
  class_number: string;
  current_challenge_id: string | null;
  completed_challenge_ids: string[];
  collected_rewards: string[];
  completed: boolean;
  started_at: string;
  completed_at: string | null;
}
