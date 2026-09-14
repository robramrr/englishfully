import type { SpeakEntryConfig } from '@/lib/speak-and-submit/types';

export type { SpeakEntryConfig };

export const PROJECT_COMPONENT_TYPES = ['upload', 'worksheet', 'artwork', 'speaking'] as const;
export type ProjectComponentType = (typeof PROJECT_COMPONENT_TYPES)[number];
export const UPLOAD_TASK_TYPES = ['upload', 'worksheet', 'artwork'] as const;
export type UploadTaskType = (typeof UPLOAD_TASK_TYPES)[number];

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
  upload: 'Upload',
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

/** Optional handout students open under the project title. */
export interface ProjectWorksheetHandout extends StoredFileRef {
  title: string;
}

export interface WorksheetSettings {
  file: StoredFileRef | null;
}

export interface ArtworkSettings {
  example_image: StoredFileRef | null;
}

export interface UploadTaskSettings {
  title: string;
  upload_enabled: boolean;
  take_photo_enabled: boolean;
  send_line_enabled: boolean;
  example_image_enabled: boolean;
  example_image: StoredFileRef | null;
  /** Max student files for this task (1–5). */
  max_uploads: number;
}

export interface SubmissionUploadedFile {
  url: string;
  key: string;
  file_name: string;
  content_type: string;
}

export interface SpeakingSettings {
  min_seconds: number;
  max_seconds: number;
  prompts: string[];
  online_recording_enabled: boolean;
  in_person_enabled: boolean;
}

export type ProjectComponentSettings =
  | UploadTaskSettings
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
  class_label: string;
  due_date: string | null;
  status: ProjectStatus;
  allow_resubmission: boolean;
  final_submission_enabled: boolean;
  project_progress_enabled: boolean;
  /** @deprecated Prefer worksheet_files; kept as the first handout for older callers. */
  worksheet_file: StoredFileRef | null;
  worksheet_files: ProjectWorksheetHandout[];
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

export interface ProjectSubmissionMember {
  student_name: string;
  student_number: string;
  class_number: string;
}

export const MAX_PROJECT_GROUP_SIZE = 5;

export interface ProjectSubmission {
  id: string;
  project_id: string;
  student_name: string;
  student_number: string;
  class_number: string;
  members: ProjectSubmissionMember[];
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
  upload_statuses: Array<{
    component_id: string;
    title: string;
    status: ComponentSubmissionStatus | 'disabled';
  }>;
  /** How upload-task work was delivered for display in the submissions table. */
  upload_delivery: ProjectSubmissionDelivery;
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
  class_label: string;
  due_date: string | null;
  allow_resubmission: boolean;
  final_submission_enabled: boolean;
  project_progress_enabled: boolean;
  /** @deprecated Prefer worksheet_files; kept as the first handout for older callers. */
  worksheet_file: StoredFileRef | null;
  worksheet_files: ProjectWorksheetHandout[];
  entry_config: SpeakEntryConfig;
  components: PublicProjectComponent[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  class_name?: string;
  class_names?: string[];
  class_label?: string;
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
  class_label?: string;
  due_date: string | null;
  allow_resubmission: boolean;
  final_submission_enabled: boolean;
  project_progress_enabled: boolean;
  worksheet_file?: StoredFileRef | null;
  worksheet_files?: ProjectWorksheetHandout[];
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
  student_name?: string;
  student_number?: string;
  class_number?: string;
  members?: ProjectSubmissionMember[];
}

export const PROJECT_SUBMISSION_DELIVERIES = ['file_upload', 'line', 'in_person', 'none'] as const;
export type ProjectSubmissionDelivery = (typeof PROJECT_SUBMISSION_DELIVERIES)[number];
export type ProjectManualDelivery = Exclude<ProjectSubmissionDelivery, 'none'>;

export function isProjectManualDelivery(value: unknown): value is ProjectManualDelivery {
  return value === 'file_upload' || value === 'line' || value === 'in_person';
}

export interface ManualTeacherSubmissionPayload {
  class_number: string;
  /** Comma-separated student numbers, e.g. "18A, 11B". */
  student_numbers: string;
  /** Upload-task component ids to mark complete. */
  component_ids: string[];
  delivery: ProjectManualDelivery;
  status?: 'submitted';
}

export interface SaveComponentProgressPayload {
  student_number: string;
  class_number: string;
  component_id: string;
  viewed?: boolean;
  sent_via_line?: boolean;
  speaking_method?: SpeakingMethod;
  file_url?: string;
  file_key?: string;
  file_name?: string;
  content_type?: string;
  audio_url?: string;
  audio_key?: string;
  duration_seconds?: number;
  /** Append a file to an upload task (multi-file). */
  append_file?: boolean;
  /** Remove one uploaded file by R2 key (and delete from R2). */
  remove_file_key?: string;
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

export const DEFAULT_UPLOAD_TASK_SETTINGS: UploadTaskSettings = {
  title: 'Upload',
  upload_enabled: true,
  take_photo_enabled: true,
  send_line_enabled: true,
  example_image_enabled: false,
  example_image: null,
  max_uploads: 1,
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

export function isUploadTaskType(type: unknown): type is UploadTaskType {
  return UPLOAD_TASK_TYPES.includes(type as UploadTaskType);
}

export function defaultSettingsForType(type: ProjectComponentType): ProjectComponentSettings {
  if (type === 'upload') return { ...DEFAULT_UPLOAD_TASK_SETTINGS };
  if (type === 'worksheet') return { ...DEFAULT_WORKSHEET_SETTINGS };
  if (type === 'artwork') return { ...DEFAULT_ARTWORK_SETTINGS };
  return { ...DEFAULT_SPEAKING_SETTINGS, prompts: [] };
}

export function parseStoredFileRef(value: unknown): StoredFileRef | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const url = String(raw.url ?? '').trim();
  if (!url) return null;
  return {
    url,
    key: String(raw.key ?? ''),
    file_name: String(raw.file_name ?? ''),
    content_type: String(raw.content_type ?? ''),
    source: raw.source === 'google_drive' ? 'google_drive' : 'upload',
    ...(raw.google_drive_file_id
      ? { google_drive_file_id: String(raw.google_drive_file_id) }
      : {}),
  };
}

export function parseWorksheetHandout(value: unknown, fallbackTitle = 'Worksheet'): ProjectWorksheetHandout | null {
  const file = parseStoredFileRef(value);
  if (!file) return null;
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const title = String(raw.title ?? '').trim() || fallbackTitle;
  return { ...file, title };
}

/** Accepts legacy single file object or an array of titled handouts. */
export function parseWorksheetHandouts(value: unknown): ProjectWorksheetHandout[] {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => parseWorksheetHandout(item, `Worksheet ${index + 1}`))
      .filter((item): item is ProjectWorksheetHandout => Boolean(item));
  }
  const single = parseWorksheetHandout(value, 'Worksheet');
  return single ? [single] : [];
}

export function asWorksheetSettings(settings: ProjectComponentSettings): WorksheetSettings {
  const raw = settings as Partial<WorksheetSettings>;
  return {
    file: parseStoredFileRef(raw.file) ?? raw.file ?? null,
  };
}

export function asArtworkSettings(settings: ProjectComponentSettings): ArtworkSettings {
  const raw = settings as Partial<ArtworkSettings>;
  return {
    example_image: parseStoredFileRef(raw.example_image) ?? raw.example_image ?? null,
  };
}

export function asUploadTaskSettings(
  settings: ProjectComponentSettings | Record<string, unknown> | null | undefined,
  fallbackTitle = 'Upload'
): UploadTaskSettings {
  const raw = (settings ?? {}) as Partial<UploadTaskSettings> &
    Partial<WorksheetSettings> &
    Partial<ArtworkSettings> &
    Record<string, unknown>;
  const exampleImage = parseStoredFileRef(raw.example_image) ?? raw.example_image ?? null;
  const title = String(raw.title ?? fallbackTitle).trim() || fallbackTitle;
  const maxRaw = Number(raw.max_uploads);
  const maxUploads = Number.isFinite(maxRaw)
    ? Math.min(5, Math.max(1, Math.floor(maxRaw)))
    : 1;
  return {
    title,
    upload_enabled: raw.upload_enabled !== false,
    take_photo_enabled: raw.take_photo_enabled !== false,
    send_line_enabled: raw.send_line_enabled !== false,
    example_image_enabled: raw.example_image_enabled === true || Boolean(exampleImage),
    example_image: exampleImage,
    max_uploads: maxUploads,
  };
}

export function parseSubmissionUploadedFile(value: unknown): SubmissionUploadedFile | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const url = String(raw.url ?? '').trim();
  if (!url) return null;
  return {
    url,
    key: String(raw.key ?? ''),
    file_name: String(raw.file_name ?? ''),
    content_type: String(raw.content_type ?? ''),
  };
}

/** Files for an upload-task row, including legacy single file_url. */
export function getComponentUploadFiles(
  row: Pick<
    ProjectComponentSubmission,
    'file_url' | 'file_key' | 'file_name' | 'content_type' | 'extra'
  > | null
): SubmissionUploadedFile[] {
  if (!row) return [];
  const fromExtra = Array.isArray(row.extra?.files)
    ? row.extra.files
        .map((item) => parseSubmissionUploadedFile(item))
        .filter((item): item is SubmissionUploadedFile => Boolean(item))
    : [];
  if (fromExtra.length > 0) return fromExtra;
  if (row.file_url) {
    return [
      {
        url: row.file_url,
        key: row.file_key || '',
        file_name: row.file_name || '',
        content_type: row.content_type || '',
      },
    ];
  }
  return [];
}

export function resolveUploadDelivery(
  rows: Array<Pick<
    ProjectComponentSubmission,
    'file_url' | 'file_key' | 'file_name' | 'content_type' | 'extra'
  > | null>
): ProjectSubmissionDelivery {
  let hasFile = false;
  let hasLine = false;
  let hasInPerson = false;
  for (const row of rows) {
    if (!row) continue;
    if (getComponentUploadFiles(row).length > 0) hasFile = true;
    if (row.extra?.manual_delivery === 'file_upload') hasFile = true;
    if (row.extra?.sent_via_line || row.extra?.manual_delivery === 'line') hasLine = true;
    if (row.extra?.manual_delivery === 'in_person') hasInPerson = true;
  }
  if (hasFile) return 'file_upload';
  if (hasLine) return 'line';
  if (hasInPerson) return 'in_person';
  return 'none';
}

export function formatUploadDeliveryLabel(delivery: ProjectSubmissionDelivery): string {
  if (delivery === 'file_upload') return 'File upload';
  if (delivery === 'line') return 'LINE';
  if (delivery === 'in_person') return 'In person';
  return '—';
}

export function componentDisplayTitle(
  component: Pick<ProjectComponent, 'type' | 'settings'> | Pick<PublicProjectComponent, 'type' | 'settings'>
): string {
  if (component.type === 'speaking') return PROJECT_COMPONENT_LABELS.speaking;
  const fallback =
    component.type === 'artwork'
      ? 'Artwork'
      : component.type === 'worksheet'
        ? 'Worksheet'
        : 'Upload';
  return asUploadTaskSettings(component.settings, fallback).title;
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

export function projectDisplayLabel(project: { class_label?: string; class_name?: string }): string {
  return String(project.class_label ?? '').trim();
}

export function formatProjectHeaderMeta(project: {
  class_label?: string;
  due_date: string | null;
}): string {
  const label = projectDisplayLabel(project);
  const due = formatProjectDueDate(project.due_date);
  if (label && due) return `${label} · Due ${due}`;
  if (label) return label;
  if (due) return `Due ${due}`;
  return '';
}

export function formatSubmissionGroupLabel(submission: {
  student_name: string;
  student_number: string;
  class_number: string;
  members?: ProjectSubmissionMember[];
}): string {
  const members = submissionMembersList(submission);
  return members
    .map((member) => {
      const name = `${member.student_number} ${member.student_name}`.trim();
      const classLabel = String(member.class_number ?? '').trim();
      if (name && classLabel) return `${name} · ${classLabel}`;
      return name || classLabel;
    })
    .filter(Boolean)
    .join(', ');
}

export function submissionMembersList(submission: {
  student_name: string;
  student_number: string;
  class_number: string;
  members?: ProjectSubmissionMember[];
}): ProjectSubmissionMember[] {
  if (submission.members && submission.members.length > 0) return submission.members;
  return [
    {
      student_name: submission.student_name,
      student_number: submission.student_number,
      class_number: submission.class_number,
    },
  ];
}

/** Unique class labels for a submission (e.g. "6/11" or "6/11, 6/12"). */
export function formatSubmissionClassColumn(submission: {
  student_name: string;
  student_number: string;
  class_number: string;
  members?: ProjectSubmissionMember[];
}): string {
  const classes = [
    ...new Set(
      submissionMembersList(submission)
        .map((member) => String(member.class_number ?? '').trim())
        .filter(Boolean)
    ),
  ];
  return classes.join(', ');
}

/** Student numbers/names without repeating class (e.g. "18A, 11B"). */
export function formatSubmissionStudentsColumn(submission: {
  student_name: string;
  student_number: string;
  class_number: string;
  members?: ProjectSubmissionMember[];
}): string {
  return submissionMembersList(submission)
    .map((member) => `${member.student_number} ${member.student_name}`.trim())
    .filter(Boolean)
    .join(', ');
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
