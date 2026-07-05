export type TaskType = 'single_sentence' | 'sentence_set' | 'vocab_list' | 'prompt';
export type NameMode = 'nickname' | 'first_last';

export interface SpeakClassOption {
  id: string;
  label: string;
  max_student_number: number;
  sort_order: number;
}

export interface SpeakEntryConfig {
  name_mode: NameMode;
  classes: SpeakClassOption[];
}

export interface SaveEntryConfigPayload {
  name_mode: NameMode;
  classes: Array<{
    label: string;
    max_student_number: number;
  }>;
}

export function getDefaultEntryConfig(): SpeakEntryConfig {
  return {
    name_mode: 'nickname',
    classes: [],
  };
}

export interface SpeakTask {
  id: string;
  teacher_id: string;
  title: string;
  task_type: TaskType;
  class_name: string;
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
