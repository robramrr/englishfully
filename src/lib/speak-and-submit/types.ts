export type ItemTaskType = 'single_sentence' | 'sentence_set' | 'vocab_list' | 'prompt';
export type TaskType = ItemTaskType | 'mixed';
export type NameMode = 'nickname' | 'first_last';

export const ITEM_TASK_TYPES: ItemTaskType[] = [
  'single_sentence',
  'sentence_set',
  'vocab_list',
  'prompt',
];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  single_sentence: 'Single Sentence',
  sentence_set: 'Multiple Sentences',
  vocab_list: 'Vocabulary List',
  prompt: 'Open Prompt',
  mixed: 'Mixed task',
};

export const STUDENT_TASK_TYPE_LABELS: Record<ItemTaskType, string> = {
  single_sentence: 'Say this sentence',
  sentence_set: 'Say each sentence',
  vocab_list: 'Say each word',
  prompt: 'Choose a prompt and record your answer',
};

export const DEFAULT_MAX_RECORDING_SECONDS: Record<ItemTaskType, number> = {
  single_sentence: 25,
  sentence_set: 25,
  vocab_list: 25,
  prompt: 60,
};

export function getDefaultMaxRecordingSeconds(taskType: ItemTaskType): number {
  return DEFAULT_MAX_RECORDING_SECONDS[taskType];
}

export function deriveTaskType(sections: TaskSectionInput[]): TaskType {
  const types = new Set(sections.map((section) => section.item_type));
  if (types.size > 1) return 'mixed';
  return sections[0]?.item_type ?? 'single_sentence';
}

export function formatTaskTypesFromItems(
  items: Array<{ item_type: ItemTaskType; section_index: number }>
): string {
  const sectionTypes: ItemTaskType[] = [];
  let lastSection = -1;
  for (const item of items) {
    if (item.section_index !== lastSection) {
      sectionTypes.push(item.item_type);
      lastSection = item.section_index;
    }
  }
  if (sectionTypes.length <= 1) {
    return TASK_TYPE_LABELS[sectionTypes[0] ?? 'single_sentence'];
  }
  return sectionTypes.map((type) => TASK_TYPE_LABELS[type]).join(' + ');
}

export interface TaskItemInput {
  content: string;
  prompt_rules?: string;
  prompt_example?: string;
}

export interface TaskSectionInput {
  item_type: ItemTaskType;
  max_recording_seconds: number;
  items: TaskItemInput[];
}

export function normalizeTaskItemInput(
  item: string | TaskItemInput
): TaskItemInput {
  if (typeof item === 'string') {
    return { content: item.trim() };
  }
  return {
    content: String(item.content ?? '').trim(),
    prompt_rules: item.prompt_rules?.trim() || undefined,
    prompt_example: item.prompt_example?.trim() || undefined,
  };
}

export function buildStudentRecordingItems<
  T extends {
    id: string;
    item_type: ItemTaskType;
    section_index: number;
  },
>(items: T[], promptSelections: Record<number, string>): T[] {
  const groups = groupTaskItemsBySection(items);
  const result: T[] = [];
  for (const group of groups) {
    if (group.itemType === 'prompt' && group.items.length > 1) {
      const selectedId = promptSelections[group.sectionIndex];
      if (!selectedId) {
        break;
      }
      const selected = group.items.find((item) => item.id === selectedId);
      if (selected) result.push(selected);
    } else {
      result.push(...group.items);
    }
  }
  return result;
}

export function getPromptSectionsNeedingChoice<
  T extends { item_type: ItemTaskType; section_index: number },
>(items: T[]): number[] {
  return groupTaskItemsBySection(items)
    .filter((group) => group.itemType === 'prompt' && group.items.length > 1)
    .map((group) => group.sectionIndex);
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
  item_type: ItemTaskType;
  section_index: number;
  max_recording_seconds: number | null;
  prompt_rules: string | null;
  prompt_example: string | null;
}

export function groupTaskItemsBySection<
  T extends { section_index: number; item_type: ItemTaskType },
>(items: T[]): Array<{ sectionIndex: number; itemType: ItemTaskType; items: T[] }> {
  const groups: Array<{ sectionIndex: number; itemType: ItemTaskType; items: T[] }> = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (!last || last.sectionIndex !== item.section_index) {
      groups.push({
        sectionIndex: item.section_index,
        itemType: item.item_type,
        items: [item],
      });
    } else {
      last.items.push(item);
    }
  }
  return groups;
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
    item_type: ItemTaskType;
    section_index: number;
    max_recording_seconds: number | null;
    prompt_rules: string | null;
    prompt_example: string | null;
  }>;
}

export interface CreateTaskPayload {
  title: string;
  class_name: string;
  sections: TaskSectionInput[];
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
