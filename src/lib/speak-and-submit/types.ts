export type TaskType = 'single_sentence' | 'sentence_set' | 'vocab_list' | 'prompt';
export type NameMode = 'nickname' | 'first_last';

export const DEFAULT_MAX_RECORDING_SECONDS: Record<TaskType, number> = {
  single_sentence: 25,
  sentence_set: 25,
  vocab_list: 25,
  prompt: 60,
};

export function getDefaultMaxRecordingSeconds(taskType: TaskType): number {
  return DEFAULT_MAX_RECORDING_SECONDS[taskType];
}

export function normalizeStudentNumber(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*([aAbB])?$/);
  if (match) {
    return match[2] ? `${match[1]}${match[2].toUpperCase()}` : match[1];
  }
  return trimmed.toUpperCase();
}

export interface SpeakClassOption {
  id: string;
  label: string;
  max_student_number: number;
  sort_order: number;
}

export interface SpeakEntryConfig {
  name_mode: NameMode;
  student_letter_enabled: boolean;
  classes: SpeakClassOption[];
}

export interface SaveEntryConfigPayload {
  name_mode: NameMode;
  student_letter_enabled: boolean;
  classes: Array<{
    label: string;
    max_student_number: number;
  }>;
}

export function getDefaultEntryConfig(): SpeakEntryConfig {
  return {
    name_mode: 'nickname',
    student_letter_enabled: false,
    classes: [],
  };
}

export const STUDENT_LETTER_OPTIONS = ['A', 'B'] as const;
export type StudentLetter = (typeof STUDENT_LETTER_OPTIONS)[number];

export interface SpeakTask {
  id: string;
  teacher_id: string;
  title: string;
  task_type: TaskType;
  class_name: string;
  max_recording_seconds: number;
  qr_code_url: string | null;
  created_at: string;
}

export interface SpeakTaskItem {
  id: string;
  task_id: string;
  order_index: number;
  content: string;
}

export interface SpeakSubmission {
  id: string;
  task_id: string;
  task_item_id: string;
  student_name: string;
  student_number: string;
  class_number: string;
  audio_url: string;
  duration_seconds: number | null;
  submitted_at: string;
}

export interface PublicTask {
  id: string;
  title: string;
  task_type: TaskType;
  class_name: string;
  max_recording_seconds: number;
  entry_config: SpeakEntryConfig;
  items: Array<{
    id: string;
    order_index: number;
    content: string;
  }>;
}

export interface CreateTaskPayload {
  title: string;
  task_type: TaskType;
  class_name: string;
  max_recording_seconds: number;
  items: string[];
}

export interface SubmitPayload {
  student_name: string;
  student_number: string;
  class_number: string;
  recordings: Array<{
    task_item_id: string;
    audio_url: string;
    duration_seconds: number;
  }>;
}
