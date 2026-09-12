import type { SpeakEntryConfig } from '@/lib/speak-and-submit/types';

export type { SpeakEntryConfig };

export const PROJECT_COMPONENT_TYPES = ['worksheet', 'artwork', 'speaking'] as const;
export type ProjectComponentType = (typeof PROJECT_COMPONENT_TYPES)[number];

export const PROJECT_STATUSES = ['draft', 'published'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_SUBMISSION_STATUSES = ['in_progress', 'submitted', 'reviewed'] as const;
export type ProjectSubmissionStatus = (typeof PROJECT_SUBMISSION_STATUSES)[number];

export const COMPONENT_SUBMISSION_STATUSES = ['incomplete', 'complete'] as const;
export type ComponentSubmissionStatus = (typeof COMPONENT_SUBMISSION_STATUSES)[number];

export const FILE_SOURCES = ['upload', 'google_drive'] as const;
export type FileSource = (typeof FILE_SOURCES)[number];

export const SPEAKING_METHODS = ['online', 'in_person'] as const;
export type SpeakingMethod = (typeof SPEAKING_METHODS)[number];

export const PROJECT_COMPONENT_LABELS: Record<ProjectComponentType, string> = {
  worksheet: 'Worksheet',
  artwork: 'Artwork',
  speaking: 'Speaking',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  published: 'Published',
};

export const PROJECT_SUBMISSION_STATUS_LABELS: Record<ProjectSubmissionStatus, string> = {
  in_progress: 'In Progress',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
};

export interface StoredFileRef {
  url: string;
  key: string;
  file_name: string;
  content_type: string;
  source: FileSource;
  /** Reserved for a future Google Drive import without changing the schema. */
  google_drive_file_id?: string;
}

export interface WorksheetSettings {
  file: StoredFileRef | null;
}

export interface ArtworkSettings {
  example_image: StoredFileRef | null;
}

export interface SpeakingSettings {
  min_seconds: number;
  max_seconds: number;
  prompts: string[];
  online_recording_enabled: boolean;
  in_person_enabled: boolean;
}

export type ProjectComponentSettings =
  | WorksheetSettings
  | ArtworkSettings
  | SpeakingSettings;

export interface ProjectComponent {
  id: string;
  project_id: string;
  type: ProjectComponentType;
  instructions: string;
  required: boolean;
  enabled: boolean;
  sort_order: number;
  settings: ProjectComponentSettings;
}

export interface Project {
  id: string;
  teacher_id: string;
  title: string;
  slug: string;
  description: string;
  class_name: string;
  class_names: string[];
  due_date: string | null;
  status: ProjectStatus;
  allow_resubmission: boolean;
  share_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithComponents extends Project {
  components: ProjectComponent[];
}

export interface ProjectListItem extends Project {
  student_count: number;
  completed_count: number;
  in_progress_count: number;
  enabled_components: ProjectComponentType[];
}

export interface ProjectComponentSubmission {
  id: string;
  project_submission_id: string;
  component_id: string;
  status: ComponentSubmissionStatus;
  file_url: string | null;
  file_key: string | null;
  file_name: string | null;
  content_type: string | null;
  text_data: string | null;
  audio_url: string | null;
  audio_key: string | null;
  duration_seconds: number | null;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectSubmission {
  id: string;
  project_id: string;
  student_name: string;
  student_number: string;
  class_number: string;
  status: ProjectSubmissionStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  teacher_feedback: string;
  score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectSubmissionWithComponents extends ProjectSubmission {
  components: ProjectComponentSubmission[];
}

export interface ProjectSubmissionRow extends ProjectSubmission {
  worksheet: ComponentSubmissionStatus | 'disabled';
  artwork: ComponentSubmissionStatus | 'disabled';
  speaking: ComponentSubmissionStatus | 'disabled';
}

export interface PublicProjectComponent {
  id: string;
  type: ProjectComponentType;
  instructions: string;
  required: boolean;
  sort_order: number;
  settings: ProjectComponentSettings;
}

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  class_name: string;
  class_names: string[];
  due_date: string | null;
  allow_resubmission: boolean;
  entry_config: SpeakEntryConfig;
  components: PublicProjectComponent[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  class_name?: string;
  class_names?: string[];
  due_date: string | null;
  worksheet_enabled: boolean;
  artwork_enabled: boolean;
  speaking_enabled: boolean;
}

export interface SaveProjectPayload {
  title: string;
  description: string;
  class_name?: string;
  class_names?: string[];
  due_date: string | null;
  allow_resubmission: boolean;
  components: Array<{
    id?: string;
    type: ProjectComponentType;
    enabled: boolean;
    required: boolean;
    instructions: string;
    settings: ProjectComponentSettings;
  }>;
}

export interface StartProjectPayload {
  student_name: string;
  student_number: string;
  class_number: string;
}

export interface SaveComponentProgressPayload {
  student_number: string;
  class_number: string;
  component_id: string;
  viewed?: boolean;
  speaking_method?: SpeakingMethod;
  file_url?: string;
  file_key?: string;
  file_name?: string;
  content_type?: string;
  audio_url?: string;
  audio_key?: string;
  duration_seconds?: number;
  clear_file?: boolean;
  clear_audio?: boolean;
}

export interface SubmitProjectPayload {
  student_number: string;
  class_number: string;
}

export interface ReviewSubmissionPayload {
  teacher_feedback?: string;
  score?: number | null;
  mark_reviewed?: boolean;
}

export const DEFAULT_SPEAKING_SETTINGS: SpeakingSettings = {
  min_seconds: 60,
  max_seconds: 120,
  prompts: [],
  online_recording_enabled: true,
  in_person_enabled: false,
};

export const DEFAULT_WORKSHEET_SETTINGS: WorksheetSettings = {
  file: null,
};

export const DEFAULT_ARTWORK_SETTINGS: ArtworkSettings = {
  example_image: null,
};

export function isProjectComponentType(value: unknown): value is ProjectComponentType {
  return PROJECT_COMPONENT_TYPES.includes(value as ProjectComponentType);
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

export function isSpeakingMethod(value: unknown): value is SpeakingMethod {
  return SPEAKING_METHODS.includes(value as SpeakingMethod);
}

export function defaultSettingsForType(type: ProjectComponentType): ProjectComponentSettings {
  if (type === 'worksheet') return { ...DEFAULT_WORKSHEET_SETTINGS };
  if (type === 'artwork') return { ...DEFAULT_ARTWORK_SETTINGS };
  return { ...DEFAULT_SPEAKING_SETTINGS, prompts: [] };
}

export function asWorksheetSettings(settings: ProjectComponentSettings): WorksheetSettings {
  const raw = settings as Partial<WorksheetSettings>;
  return {
    file: raw.file ?? null,
  };
}

export function asArtworkSettings(settings: ProjectComponentSettings): ArtworkSettings {
  const raw = settings as Partial<ArtworkSettings>;
  return {
    example_image: raw.example_image ?? null,
  };
}

export function asSpeakingSettings(settings: ProjectComponentSettings): SpeakingSettings {
  const raw = settings as Partial<SpeakingSettings>;
  const minSeconds = Number(raw.min_seconds);
  const maxSeconds = Number(raw.max_seconds);
  return {
    min_seconds: Number.isFinite(minSeconds) ? Math.max(5, Math.min(600, Math.floor(minSeconds))) : 60,
    max_seconds: Number.isFinite(maxSeconds) ? Math.max(5, Math.min(600, Math.floor(maxSeconds))) : 120,
    prompts: Array.isArray(raw.prompts)
      ? raw.prompts.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [],
    online_recording_enabled: raw.online_recording_enabled !== false,
    in_person_enabled: raw.in_person_enabled === true,
  };
}

export function enabledRequiredComponents(components: Array<Pick<ProjectComponent, 'enabled' | 'required' | 'type'>>) {
  return components.filter((component) => component.enabled && component.required);
}

export function formatProjectDueDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatProjectDateTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function parseClassNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
    }
  } catch {
    // Treat as a single class or a joined list.
  }
  return raw.split(/\s*(?:·|,)\s*/).map((item) => item.trim()).filter(Boolean);
}

export function serializeClassNames(names: string[]): string {
  return JSON.stringify(names.map((item) => item.trim()).filter(Boolean));
}

export function formatClassNames(names: string[]): string {
  return names.map((item) => item.trim()).filter(Boolean).join(' · ');
}

export function normalizeProjectClassNames(payload: {
  class_name?: string;
  class_names?: string[];
}): string[] {
  if (Array.isArray(payload.class_names) && payload.class_names.length > 0) {
    return parseClassNames(payload.class_names);
  }
  return parseClassNames(payload.class_name);
}

export function slugifyProjectTitle(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'project';
}
