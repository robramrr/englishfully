import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import {
  getDefaultEntryConfig,
  normalizeStudentNumber,
  type SpeakEntryConfig,
} from '@/lib/speak-and-submit/types';
import {
  asArtworkSettings,
  asSpeakingSettings,
  asUploadTaskSettings,
  asWorksheetSettings,
  componentDisplayTitle,
  DEFAULT_UPLOAD_TASK_SETTINGS,
  defaultSettingsForType,
  getComponentUploadFiles,
  isUploadTaskType,
  parseStoredFileRef,
  formatClassNames,
  isProjectComponentType,
  isProjectStatus,
  normalizeProjectClassNames,
  parseClassNames,
  serializeClassNames,
  slugifyProjectTitle,
  type ArtworkSettings,
  type ComponentSubmissionStatus,
  type CreateProjectPayload,
  type Project,
  type ProjectComponent,
  type ProjectComponentSettings,
  type ProjectComponentSubmission,
  type ProjectComponentType,
  MAX_PROJECT_GROUP_SIZE,
  type ProjectListItem,
  type ProjectStatus,
  type ProjectSubmission,
  type ProjectSubmissionMember,
  type ProjectSubmissionRow,
  type ProjectSubmissionStatus,
  type ProjectSubmissionWithComponents,
  type ProjectWithComponents,
  type PublicProject,
  type ReviewSubmissionPayload,
  type SaveComponentProgressPayload,
  type SaveProjectPayload,
  type SpeakingSettings,
  type StartProjectPayload,
  type StoredFileRef,
  type SubmissionUploadedFile,
  type WorksheetSettings,
} from './types';
import { deleteProjectFileFromR2 } from './storage';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 't' || normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'f' || normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return fallback;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object') return value as T;
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseSettings(type: ProjectComponentType, value: unknown): ProjectComponentSettings {
  const parsed = parseJson<ProjectComponentSettings>(value, defaultSettingsForType(type));
  if (type === 'upload') {
    return asUploadTaskSettings(
      parsed,
      'Upload'
    );
  }
  if (type === 'worksheet') return asWorksheetSettings(parsed);
  if (type === 'artwork') return asArtworkSettings(parsed);
  return asSpeakingSettings(parsed);
}

function parseProjectStatus(value: unknown): ProjectStatus {
  return isProjectStatus(value) ? value : 'draft';
}

function parseSubmissionStatus(value: unknown): ProjectSubmissionStatus {
  if (value === 'submitted' || value === 'reviewed' || value === 'in_progress') return value;
  return 'in_progress';
}

function parseComponentStatus(value: unknown): ComponentSubmissionStatus {
  return value === 'complete' ? 'complete' : 'incomplete';
}

function parseScore(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function rowToProject(row: Record<string, unknown>): Project {
  const classNames = parseClassNames(row.class_name);
  return {
    id: String(row.id ?? ''),
    teacher_id: String(row.teacher_id ?? DEFAULT_TEACHER_ID),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    description: String(row.description ?? ''),
    class_name: formatClassNames(classNames) || String(row.class_name ?? ''),
    class_names: classNames,
    class_label: String(row.class_label ?? '').trim(),
    due_date: row.due_date ? String(row.due_date) : null,
    status: parseProjectStatus(row.status),
    allow_resubmission: parseBoolean(row.allow_resubmission),
    final_submission_enabled:
      row.final_submission_enabled == null ? true : parseBoolean(row.final_submission_enabled),
    project_progress_enabled:
      row.project_progress_enabled == null ? true : parseBoolean(row.project_progress_enabled),
    worksheet_file: parseStoredFileRef(row.worksheet_file),
    share_url: row.share_url ? String(row.share_url) : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function rowToComponent(row: Record<string, unknown>): ProjectComponent {
  const type = isProjectComponentType(row.type) ? row.type : 'worksheet';
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    type,
    instructions: String(row.instructions ?? ''),
    required: parseBoolean(row.required, true),
    enabled: parseBoolean(row.enabled, true),
    sort_order: Number(row.sort_order ?? 0) || 0,
    settings: parseSettings(type, row.settings),
  };
}

function rowToSubmission(row: Record<string, unknown>): ProjectSubmission {
  return {
    id: String(row.id ?? ''),
    project_id: String(row.project_id ?? ''),
    student_name: String(row.student_name ?? ''),
    student_number: String(row.student_number ?? ''),
    class_number: String(row.class_number ?? ''),
    members: [],
    status: parseSubmissionStatus(row.status),
    submitted_at: row.submitted_at ? String(row.submitted_at) : null,
    reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
    teacher_feedback: String(row.teacher_feedback ?? ''),
    score: parseScore(row.score),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function rowToComponentSubmission(row: Record<string, unknown>): ProjectComponentSubmission {
  return {
    id: String(row.id ?? ''),
    project_submission_id: String(row.project_submission_id ?? ''),
    component_id: String(row.component_id ?? ''),
    status: parseComponentStatus(row.status),
    file_url: row.file_url ? String(row.file_url) : null,
    file_key: row.file_key ? String(row.file_key) : null,
    file_name: row.file_name ? String(row.file_name) : null,
    content_type: row.content_type ? String(row.content_type) : null,
    text_data: row.text_data ? String(row.text_data) : null,
    audio_url: row.audio_url ? String(row.audio_url) : null,
    audio_key: row.audio_key ? String(row.audio_key) : null,
    duration_seconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    extra: parseJson<Record<string, unknown>>(row.extra, {}),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

export async function ensureProjectsSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_projects (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          slug TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '',
          class_name TEXT NOT NULL DEFAULT '',
          due_date TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          allow_resubmission BOOLEAN NOT NULL DEFAULT FALSE,
          share_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_projects_slug
        ON classroom_projects(slug)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_projects_teacher
        ON classroom_projects(teacher_id, created_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_project_components (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES classroom_projects(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          instructions TEXT NOT NULL DEFAULT '',
          required BOOLEAN NOT NULL DEFAULT TRUE,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          sort_order INTEGER NOT NULL DEFAULT 0,
          settings JSONB NOT NULL DEFAULT '{}'::jsonb
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_project_components_project
        ON classroom_project_components(project_id, sort_order)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_project_submissions (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES classroom_projects(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL DEFAULT '',
          class_number TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'in_progress',
          submitted_at TIMESTAMPTZ,
          reviewed_at TIMESTAMPTZ,
          teacher_feedback TEXT NOT NULL DEFAULT '',
          score DOUBLE PRECISION,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_project_submissions_student
        ON classroom_project_submissions(project_id, class_number, student_number)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_project_submissions_project
        ON classroom_project_submissions(project_id, submitted_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_project_component_submissions (
          id TEXT PRIMARY KEY,
          project_submission_id TEXT NOT NULL REFERENCES classroom_project_submissions(id) ON DELETE CASCADE,
          component_id TEXT NOT NULL REFERENCES classroom_project_components(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'incomplete',
          file_url TEXT,
          file_key TEXT,
          file_name TEXT,
          content_type TEXT,
          text_data TEXT,
          audio_url TEXT,
          audio_key TEXT,
          duration_seconds REAL,
          extra JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_project_comp_sub_unique
        ON classroom_project_component_submissions(project_submission_id, component_id)
      `;
      await sql`
        ALTER TABLE classroom_projects
        ADD COLUMN IF NOT EXISTS class_label TEXT NOT NULL DEFAULT ''
      `;
      await sql`
        ALTER TABLE classroom_projects
        ADD COLUMN IF NOT EXISTS final_submission_enabled BOOLEAN NOT NULL DEFAULT TRUE
      `;
      await sql`
        ALTER TABLE classroom_projects
        ADD COLUMN IF NOT EXISTS project_progress_enabled BOOLEAN NOT NULL DEFAULT TRUE
      `;
      await sql`
        ALTER TABLE classroom_projects
        ADD COLUMN IF NOT EXISTS worksheet_file JSONB
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS classroom_project_submission_members (
          id TEXT PRIMARY KEY,
          submission_id TEXT NOT NULL REFERENCES classroom_project_submissions(id) ON DELETE CASCADE,
          project_id TEXT NOT NULL,
          student_name TEXT NOT NULL DEFAULT '',
          student_number TEXT NOT NULL DEFAULT '',
          class_number TEXT NOT NULL DEFAULT '',
          sort_order INTEGER NOT NULL DEFAULT 0
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_classroom_project_members_student
        ON classroom_project_submission_members(project_id, class_number, student_number)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_classroom_project_members_submission
        ON classroom_project_submission_members(submission_id, sort_order)
      `;
    })();
  }
  await schemaReady;
}

async function uniqueSlug(baseTitle: string, excludeId?: string): Promise<string> {
  const base = slugifyProjectTitle(baseTitle);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const { rows } = await sql`
      SELECT id FROM classroom_projects WHERE slug = ${candidate}
    `;
    if (rows.length === 0 || (excludeId && String(rows[0].id) === excludeId)) {
      return candidate;
    }
  }
  return `${base}-${nanoid(6).toLowerCase()}`;
}

async function getComponentsForProject(projectId: string): Promise<ProjectComponent[]> {
  const { rows } = await sql`
    SELECT *
    FROM classroom_project_components
    WHERE project_id = ${projectId}
    ORDER BY sort_order ASC
  `;
  return rows.map((row) => rowToComponent(row as Record<string, unknown>));
}

async function ensureDefaultComponents(
  projectId: string,
  enabled: { worksheet: boolean; artwork: boolean; speaking: boolean }
): Promise<ProjectComponent[]> {
  const existing = await getComponentsForProject(projectId);
  if (existing.length > 0) return existing;

  const defaults: Array<{
    type: ProjectComponentType;
    enabled: boolean;
    sort_order: number;
    instructions: string;
    settings: ProjectComponentSettings;
  }> = [];

  if (enabled.worksheet) {
    defaults.push({
      type: 'upload',
      enabled: true,
      sort_order: defaults.length,
      instructions: '',
      settings: asUploadTaskSettings({ ...DEFAULT_UPLOAD_TASK_SETTINGS, title: 'Worksheet' }, 'Worksheet'),
    });
  }
  if (enabled.artwork) {
    defaults.push({
      type: 'upload',
      enabled: true,
      sort_order: defaults.length,
      instructions: 'Create a drawing and upload a photo of your artwork.',
      settings: asUploadTaskSettings({ ...DEFAULT_UPLOAD_TASK_SETTINGS, title: 'Artwork' }, 'Artwork'),
    });
  }
  defaults.push({
    type: 'speaking',
    enabled: enabled.speaking,
    sort_order: defaults.length,
    instructions: 'Talk about your project. Include the most important details.',
    settings: defaultSettingsForType('speaking'),
  });

  for (const component of defaults) {
    await sql`
      INSERT INTO classroom_project_components (
        id, project_id, type, instructions, required, enabled, sort_order, settings
      ) VALUES (
        ${nanoid(21)},
        ${projectId},
        ${component.type},
        ${component.instructions},
        TRUE,
        ${component.enabled},
        ${component.sort_order},
        ${JSON.stringify(component.settings)}
      )
    `;
  }

  return getComponentsForProject(projectId);
}

async function studentCountForClasses(classNames: string[]): Promise<number> {
  const config = await getEntryConfig();
  return classNames.reduce((total, className) => {
    const match = config.classes.find(
      (item) => item.label.trim().toLowerCase() === className.trim().toLowerCase()
    );
    return total + (match?.max_student_number ?? 0);
  }, 0);
}

function scopedEntryConfig(entryConfig: SpeakEntryConfig, classNames: string[]): SpeakEntryConfig {
  if (classNames.length === 0) return entryConfig;
  const wanted = new Set(classNames.map((item) => item.toLowerCase()));
  const matched = entryConfig.classes.filter((item) => wanted.has(item.label.trim().toLowerCase()));
  const matchedLabels = new Set(matched.map((item) => item.label.trim().toLowerCase()));
  const extras = classNames
    .filter((name) => !matchedLabels.has(name.toLowerCase()))
    .map((label, index) => ({
      id: `project-class-${index}`,
      label,
      max_student_number: 35,
      sort_order: 100 + index,
      line_group_url: '',
    }));
  return {
    ...entryConfig,
    classes: [...matched, ...extras],
  };
}

export async function listProjects(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<ProjectListItem[]> {
  await ensureProjectsSchema();
  const { rows } = await sql`
    SELECT
      p.*,
      (
        SELECT COUNT(*)::int
        FROM classroom_project_submissions s
        WHERE s.project_id = p.id AND s.status IN ('submitted', 'reviewed')
      ) AS completed_count,
      (
        SELECT COUNT(*)::int
        FROM classroom_project_submissions s
        WHERE s.project_id = p.id AND s.status = 'in_progress'
      ) AS in_progress_count
    FROM classroom_projects p
    WHERE p.teacher_id = ${teacherId}
    ORDER BY p.created_at DESC
  `;

  const projects = await Promise.all(
    rows.map(async (row) => {
      const project = rowToProject(row as Record<string, unknown>);
      const components = await getComponentsForProject(project.id);
      return {
        ...project,
        student_count: await studentCountForClasses(project.class_names),
        completed_count: Number(row.completed_count ?? 0) || 0,
        in_progress_count: Number(row.in_progress_count ?? 0) || 0,
        enabled_components: components.filter((item) => item.enabled).map((item) => item.type),
      };
    })
  );

  return projects;
}

function worksheetFileFromComponents(components: ProjectComponent[]) {
  const worksheet = components.find((item) => item.type === 'worksheet');
  if (!worksheet) return null;
  return asWorksheetSettings(worksheet.settings).file;
}

export async function getProjectByIdOrSlug(idOrSlug: string): Promise<ProjectWithComponents | null> {
  await ensureProjectsSchema();
  const { rows } = await sql`
    SELECT * FROM classroom_projects
    WHERE id = ${idOrSlug} OR slug = ${idOrSlug}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const project = rowToProject(rows[0] as Record<string, unknown>);
  const components = await getComponentsForProject(project.id);
  return {
    ...project,
    worksheet_file: project.worksheet_file ?? worksheetFileFromComponents(components),
    components,
  };
}

export async function createProject(
  payload: CreateProjectPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<ProjectWithComponents> {
  await ensureProjectsSchema();
  const title = safeTrim(payload.title);
  if (!title) throw new Error('Project title is required');
  const classNames = normalizeProjectClassNames(payload);
  if (classNames.length === 0) throw new Error('Select at least one class');
  const className = serializeClassNames(classNames);

  const id = nanoid(21);
  const slug = await uniqueSlug(title);
  const description = safeTrim(payload.description);
  const dueDate = safeTrim(payload.due_date) || null;
  const classLabel = safeTrim(payload.class_label);

  await sql`
    INSERT INTO classroom_projects (
      id, teacher_id, title, slug, description, class_name, class_label, due_date, status
    ) VALUES (
      ${id},
      ${teacherId},
      ${title},
      ${slug},
      ${description},
      ${className},
      ${classLabel},
      ${dueDate},
      'draft'
    )
  `;

  const components = await ensureDefaultComponents(id, {
    worksheet: payload.worksheet_enabled,
    artwork: payload.artwork_enabled,
    speaking: payload.speaking_enabled,
  });

  const created = await getProjectByIdOrSlug(id);
  if (!created) throw new Error('Failed to create project');
  return { ...created, components };
}

export async function updateProject(
  projectId: string,
  payload: SaveProjectPayload
): Promise<ProjectWithComponents> {
  await ensureProjectsSchema();
  const existing = await getProjectByIdOrSlug(projectId);
  if (!existing) throw new Error('Project not found');

  const title = safeTrim(payload.title);
  if (!title) throw new Error('Project title is required');
  const classNames = normalizeProjectClassNames(payload);
  if (classNames.length === 0) throw new Error('Select at least one class');
  const className = serializeClassNames(classNames);
  if (!Array.isArray(payload.components) || payload.components.length === 0) {
    throw new Error('At least one project component is required');
  }

  const enabledCount = payload.components.filter((item) => item.enabled).length;
  if (enabledCount === 0) {
    throw new Error('Enable at least one project component');
  }

  const slug =
    existing.status === 'draft' && title !== existing.title
      ? await uniqueSlug(title, existing.id)
      : existing.slug;

  await sql`
    UPDATE classroom_projects
    SET
      title = ${title},
      slug = ${slug},
      description = ${safeTrim(payload.description)},
      class_name = ${className},
      class_label = ${safeTrim(payload.class_label)},
      due_date = ${safeTrim(payload.due_date) || null},
      allow_resubmission = ${Boolean(payload.allow_resubmission)},
      final_submission_enabled = ${payload.final_submission_enabled !== false},
      project_progress_enabled = ${payload.project_progress_enabled !== false},
      worksheet_file = ${JSON.stringify(payload.worksheet_file ?? existing.worksheet_file)},
      updated_at = NOW()
    WHERE id = ${existing.id}
  `;

  const existingById = new Map(existing.components.map((item) => [item.id, item]));
  const keptIds = new Set<string>();
  let speakingSeen = false;

  for (const [index, incoming] of payload.components.entries()) {
    if (!isProjectComponentType(incoming.type)) {
      throw new Error('Invalid project component');
    }

    const current = incoming.id ? existingById.get(incoming.id) : undefined;
    let settings: ProjectComponentSettings = defaultSettingsForType(incoming.type);
    let nextType = incoming.type;

    if (isUploadTaskType(incoming.type) || (current && isUploadTaskType(current.type))) {
      nextType = 'upload';
      const fallbackTitle =
        current?.type === 'artwork' ? 'Artwork' : current?.type === 'worksheet' ? 'Worksheet' : 'Upload';
      settings = asUploadTaskSettings(incoming.settings ?? current?.settings ?? settings, fallbackTitle);
    } else {
      const speaking = asSpeakingSettings(incoming.settings ?? current?.settings ?? settings);
      if (incoming.enabled && !speaking.online_recording_enabled && !speaking.in_person_enabled) {
        throw new Error('Speaking needs online recording, in-person presentation, or both.');
      }
      if (speaking.min_seconds > speaking.max_seconds) {
        throw new Error('Minimum speaking time cannot be longer than the maximum.');
      }
      settings = speaking;
      nextType = 'speaking';
      if (speakingSeen) throw new Error('Only one speaking section is allowed');
      speakingSeen = true;
    }

    if (current) {
      keptIds.add(current.id);
      await sql`
        UPDATE classroom_project_components
        SET
          type = ${nextType},
          instructions = ${safeTrim(incoming.instructions)},
          required = ${Boolean(incoming.required)},
          enabled = ${Boolean(incoming.enabled)},
          sort_order = ${index},
          settings = ${JSON.stringify(settings)}
        WHERE id = ${current.id}
      `;
    } else {
      const id = nanoid(21);
      keptIds.add(id);
      await sql`
        INSERT INTO classroom_project_components (
          id, project_id, type, instructions, required, enabled, sort_order, settings
        ) VALUES (
          ${id},
          ${existing.id},
          ${nextType},
          ${safeTrim(incoming.instructions)},
          ${Boolean(incoming.required)},
          ${Boolean(incoming.enabled)},
          ${index},
          ${JSON.stringify(settings)}
        )
      `;
    }
  }

  for (const component of existing.components) {
    if (!keptIds.has(component.id)) {
      await sql`DELETE FROM classroom_project_components WHERE id = ${component.id}`;
    }
  }

  const updated = await getProjectByIdOrSlug(existing.id);
  if (!updated) throw new Error('Failed to update project');
  return updated;
}

export async function updateProjectShareUrl(projectId: string, shareUrl: string): Promise<void> {
  await ensureProjectsSchema();
  await sql`
    UPDATE classroom_projects
    SET share_url = ${shareUrl}, updated_at = NOW()
    WHERE id = ${projectId}
  `;
}

export async function updateProjectWorksheetFile(
  projectId: string,
  file: StoredFileRef | null
): Promise<ProjectWithComponents | null> {
  await ensureProjectsSchema();
  await sql`
    UPDATE classroom_projects
    SET worksheet_file = ${JSON.stringify(file)}, updated_at = NOW()
    WHERE id = ${projectId}
  `;
  return getProjectByIdOrSlug(projectId);
}

export async function updateComponentSettings(
  componentId: string,
  settings: ProjectComponentSettings
): Promise<ProjectComponent | null> {
  await ensureProjectsSchema();
  const { rows } = await sql`
    UPDATE classroom_project_components
    SET settings = ${JSON.stringify(settings)}
    WHERE id = ${componentId}
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return rowToComponent(rows[0] as Record<string, unknown>);
}

export async function publishProject(projectId: string, shareUrl: string): Promise<ProjectWithComponents> {
  await ensureProjectsSchema();
  const project = await getProjectByIdOrSlug(projectId);
  if (!project) throw new Error('Project not found');
  if (!project.title.trim()) throw new Error('Add a project title before publishing');
  if (project.class_names.length === 0 && !project.class_name.trim()) {
    throw new Error('Choose a class before publishing');
  }
  const enabled = project.components.filter((item) => item.enabled);
  if (enabled.length === 0) throw new Error('Enable at least one component before publishing');

  for (const component of enabled) {
    if (component.type === 'speaking') {
      const settings = asSpeakingSettings(component.settings);
      if (!settings.online_recording_enabled && !settings.in_person_enabled) {
        throw new Error('Speaking needs online recording, in-person presentation, or both.');
      }
    }
  }

  await sql`
    UPDATE classroom_projects
    SET status = 'published', share_url = ${shareUrl}, updated_at = NOW()
    WHERE id = ${project.id}
  `;

  const published = await getProjectByIdOrSlug(project.id);
  if (!published) throw new Error('Failed to publish project');
  return published;
}

export async function unpublishProject(projectId: string): Promise<ProjectWithComponents> {
  await ensureProjectsSchema();
  const project = await getProjectByIdOrSlug(projectId);
  if (!project) throw new Error('Project not found');
  await sql`
    UPDATE classroom_projects
    SET status = 'draft', updated_at = NOW()
    WHERE id = ${project.id}
  `;
  const updated = await getProjectByIdOrSlug(project.id);
  if (!updated) throw new Error('Failed to unpublish project');
  return updated;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  await ensureProjectsSchema();
  const project = await getProjectByIdOrSlug(projectId);
  if (!project) return false;
  await sql`DELETE FROM classroom_projects WHERE id = ${project.id}`;
  return true;
}

export async function getPublicProject(idOrSlug: string): Promise<PublicProject | null> {
  const project = await getProjectByIdOrSlug(idOrSlug);
  if (!project || project.status !== 'published') return null;
  const entryConfig = await getEntryConfig(project.teacher_id).catch(() => getDefaultEntryConfig());
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    class_name: project.class_name,
    class_names: project.class_names,
    class_label: project.class_label,
    due_date: project.due_date,
    allow_resubmission: project.allow_resubmission,
    final_submission_enabled: project.final_submission_enabled,
    project_progress_enabled: project.project_progress_enabled,
    worksheet_file: project.worksheet_file,
    entry_config: scopedEntryConfig(entryConfig, project.class_names),
    components: project.components
      .filter((item) => item.enabled)
      .map((item) => ({
        id: item.id,
        type: item.type,
        instructions: item.instructions,
        required: item.required,
        sort_order: item.sort_order,
        settings: item.settings,
      })),
  };
}

export async function getTeacherPreviewProject(idOrSlug: string): Promise<PublicProject | null> {
  const project = await getProjectByIdOrSlug(idOrSlug);
  if (!project) return null;
  const entryConfig = await getEntryConfig(project.teacher_id).catch(() => getDefaultEntryConfig());
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    class_name: project.class_name,
    class_names: project.class_names,
    class_label: project.class_label,
    due_date: project.due_date,
    allow_resubmission: project.allow_resubmission,
    final_submission_enabled: project.final_submission_enabled,
    project_progress_enabled: project.project_progress_enabled,
    worksheet_file: project.worksheet_file,
    entry_config: scopedEntryConfig(entryConfig, project.class_names),
    components: project.components
      .filter((item) => item.enabled)
      .map((item) => ({
        id: item.id,
        type: item.type,
        instructions: item.instructions,
        required: item.required,
        sort_order: item.sort_order,
        settings: item.settings,
      })),
  };
}

async function getComponentSubmissions(
  submissionId: string
): Promise<ProjectComponentSubmission[]> {
  const { rows } = await sql`
    SELECT *
    FROM classroom_project_component_submissions
    WHERE project_submission_id = ${submissionId}
  `;
  return rows.map((row) => rowToComponentSubmission(row as Record<string, unknown>));
}

async function ensureComponentSubmissionRows(
  submissionId: string,
  components: ProjectComponent[]
): Promise<ProjectComponentSubmission[]> {
  const existing = await getComponentSubmissions(submissionId);
  const existingIds = new Set(existing.map((item) => item.component_id));
  for (const component of components.filter((item) => item.enabled)) {
    if (existingIds.has(component.id)) continue;
    await sql`
      INSERT INTO classroom_project_component_submissions (
        id, project_submission_id, component_id, status
      ) VALUES (
        ${nanoid(21)},
        ${submissionId},
        ${component.id},
        'incomplete'
      )
    `;
  }
  return getComponentSubmissions(submissionId);
}

function normalizeMembers(payload: StartProjectPayload): ProjectSubmissionMember[] {
  const raw =
    Array.isArray(payload.members) && payload.members.length > 0
      ? payload.members
      : [
          {
            student_name: payload.student_name ?? '',
            student_number: payload.student_number ?? '',
            class_number: payload.class_number ?? '',
          },
        ];

  const members: ProjectSubmissionMember[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const member = {
      student_name: safeTrim(item.student_name),
      student_number: normalizeStudentNumber(item.student_number),
      class_number: safeTrim(item.class_number),
    };
    if (!member.student_number || !member.class_number) {
      throw new Error('Each student needs a number and class');
    }
    const key = `${member.class_number.toLowerCase()}::${member.student_number}`;
    if (seen.has(key)) {
      throw new Error('The same student was added twice');
    }
    seen.add(key);
    members.push(member);
  }

  if (members.length === 0) {
    throw new Error('Add at least one student');
  }
  if (members.length > MAX_PROJECT_GROUP_SIZE) {
    throw new Error(`A group can have up to ${MAX_PROJECT_GROUP_SIZE} students`);
  }
  return members;
}

async function getSubmissionMembers(submissionId: string): Promise<ProjectSubmissionMember[]> {
  const { rows } = await sql`
    SELECT student_name, student_number, class_number
    FROM classroom_project_submission_members
    WHERE submission_id = ${submissionId}
    ORDER BY sort_order ASC
  `;
  return rows.map((row) => ({
    student_name: String(row.student_name ?? ''),
    student_number: String(row.student_number ?? ''),
    class_number: String(row.class_number ?? ''),
  }));
}

async function replaceSubmissionMembers(
  projectId: string,
  submissionId: string,
  members: ProjectSubmissionMember[]
): Promise<void> {
  await sql`DELETE FROM classroom_project_submission_members WHERE submission_id = ${submissionId}`;
  for (const [index, member] of members.entries()) {
    await sql`
      INSERT INTO classroom_project_submission_members (
        id, submission_id, project_id, student_name, student_number, class_number, sort_order
      ) VALUES (
        ${nanoid(21)},
        ${submissionId},
        ${projectId},
        ${member.student_name},
        ${member.student_number},
        ${member.class_number},
        ${index}
      )
    `;
  }
}

async function hydrateSubmission(
  row: Record<string, unknown>
): Promise<ProjectSubmissionWithComponents> {
  const submission = rowToSubmission(row);
  let members = await getSubmissionMembers(submission.id);
  if (members.length === 0) {
    members = [
      {
        student_name: submission.student_name,
        student_number: submission.student_number,
        class_number: submission.class_number,
      },
    ];
    if (submission.student_number && submission.class_number) {
      await replaceSubmissionMembers(submission.project_id, submission.id, members);
    }
  }
  return {
    ...submission,
    members,
    components: await getComponentSubmissions(submission.id),
  };
}

function memberKey(member: Pick<ProjectSubmissionMember, 'student_number' | 'class_number'>): string {
  return `${member.class_number.trim().toLowerCase()}::${normalizeStudentNumber(member.student_number)}`;
}

function memberLabel(member: ProjectSubmissionMember): string {
  const name = member.student_name.trim();
  return name ? `#${member.student_number} ${name}` : `#${member.student_number}`;
}

function canonicalClassName(project: ProjectWithComponents, classNumber: string): string {
  const trimmed = classNumber.trim();
  const match = project.class_names.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return match || trimmed;
}

export async function findStudentSubmission(
  projectId: string,
  studentNumber: string,
  classNumber: string
): Promise<ProjectSubmissionWithComponents | null> {
  await ensureProjectsSchema();
  const normalizedNumber = normalizeStudentNumber(studentNumber);
  const classLabel = classNumber.trim().toLowerCase();
  const { rows: memberRows } = await sql`
    SELECT s.*
    FROM classroom_project_submission_members m
    JOIN classroom_project_submissions s ON s.id = m.submission_id
    WHERE m.project_id = ${projectId}
      AND m.student_number = ${normalizedNumber}
      AND lower(trim(m.class_number)) = ${classLabel}
    LIMIT 1
  `;
  if (memberRows.length > 0) {
    return hydrateSubmission(memberRows[0] as Record<string, unknown>);
  }

  const { rows } = await sql`
    SELECT *
    FROM classroom_project_submissions
    WHERE project_id = ${projectId}
      AND student_number = ${normalizedNumber}
      AND lower(trim(class_number)) = ${classLabel}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return hydrateSubmission(rows[0] as Record<string, unknown>);
}

export async function startOrResumeSubmission(
  project: ProjectWithComponents,
  payload: StartProjectPayload
): Promise<ProjectSubmissionWithComponents> {
  await ensureProjectsSchema();
  const members = normalizeMembers(payload).map((member) => ({
    ...member,
    class_number: canonicalClassName(project, member.class_number),
  }));
  for (const member of members) {
    if (
      project.class_names.length > 0 &&
      !project.class_names.some((item) => item.toLowerCase() === member.class_number.toLowerCase())
    ) {
      throw new Error(`${memberLabel(member)} is not in a class assigned to this project`);
    }
  }

  const primary = members[0];
  const existingByMember = new Map<string, ProjectSubmissionWithComponents>();
  for (const member of members) {
    const existing = await findStudentSubmission(project.id, member.student_number, member.class_number);
    if (existing) existingByMember.set(memberKey(member), existing);
  }

  const uniqueExisting = [...new Map([...existingByMember.values()].map((item) => [item.id, item])).values()];
  if (uniqueExisting.length > 1) {
    throw new Error('These students already belong to different submissions. Each student can only be on one.');
  }

  const primaryExisting = existingByMember.get(memberKey(primary)) ?? null;

  if (primaryExisting) {
    const extrasOnOtherSubmissions = members.filter((member) => {
      const match = existingByMember.get(memberKey(member));
      return Boolean(match && match.id !== primaryExisting.id);
    });
    if (extrasOnOtherSubmissions.length > 0) {
      throw new Error(
        `${extrasOnOtherSubmissions.map(memberLabel).join(', ')} already ${
          extrasOnOtherSubmissions.length === 1 ? 'has' : 'have'
        } a different submission for this project.`
      );
    }

    const components = await ensureComponentSubmissionRows(primaryExisting.id, project.components);
    const updated = await findStudentSubmission(project.id, primary.student_number, primary.class_number);
    if (!updated) throw new Error('Failed to open your project');
    return { ...updated, components };
  }

  const alreadySubmitted = members.filter((member) => existingByMember.has(memberKey(member)));
  if (alreadySubmitted.length > 0) {
    throw new Error(
      `${alreadySubmitted.map(memberLabel).join(', ')} already ${
        alreadySubmitted.length === 1 ? 'has' : 'have'
      } a submission for this project and cannot join this group.`
    );
  }

  const id = nanoid(21);
  await sql`
    INSERT INTO classroom_project_submissions (
      id, project_id, student_name, student_number, class_number, status
    ) VALUES (
      ${id},
      ${project.id},
      ${primary.student_name},
      ${primary.student_number},
      ${primary.class_number},
      'in_progress'
    )
  `;
  await replaceSubmissionMembers(project.id, id, members);
  const components = await ensureComponentSubmissionRows(id, project.components);
  const created = await findStudentSubmission(project.id, primary.student_number, primary.class_number);
  if (!created) throw new Error('Failed to start project');
  return { ...created, components };
}

function syncLegacyFileFields(files: SubmissionUploadedFile[]): {
  file_url: string | null;
  file_key: string | null;
  file_name: string | null;
  content_type: string | null;
} {
  const first = files[0];
  if (!first) {
    return {
      file_url: null,
      file_key: null,
      file_name: null,
      content_type: null,
    };
  }
  return {
    file_url: first.url,
    file_key: first.key || null,
    file_name: first.file_name || null,
    content_type: first.content_type || null,
  };
}

async function deleteUploadFilesFromR2(files: SubmissionUploadedFile[]): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      if (!file.key) return;
      try {
        await deleteProjectFileFromR2(file.key);
      } catch (error) {
        console.error('Failed to delete project upload from R2:', file.key, error);
      }
    })
  );
}

function isComponentComplete(
  component: ProjectComponent,
  row: ProjectComponentSubmission
): boolean {
  if (isUploadTaskType(component.type)) {
    const files = getComponentUploadFiles(row);
    return files.length >= 1 || Boolean(row.extra.sent_via_line);
  }
  if (row.text_data === 'in_person') return true;
  return Boolean(row.audio_url);
}

export async function saveComponentProgress(
  project: ProjectWithComponents,
  payload: SaveComponentProgressPayload
): Promise<ProjectSubmissionWithComponents> {
  const submission = await findStudentSubmission(
    project.id,
    payload.student_number,
    payload.class_number
  );
  if (!submission) throw new Error('Start the project before saving progress');
  if (submission.status !== 'in_progress' && !project.allow_resubmission) {
    throw new Error('This project has already been submitted');
  }

  const component = project.components.find((item) => item.id === payload.component_id && item.enabled);
  if (!component) throw new Error('Component not found');

  const rows = await ensureComponentSubmissionRows(submission.id, project.components);
  const row = rows.find((item) => item.component_id === component.id);
  if (!row) throw new Error('Component submission not found');

  const extra = { ...row.extra };
  if (payload.viewed) extra.viewed = true;
  if (payload.sent_via_line) extra.sent_via_line = true;
  if (payload.speaking_method) extra.speaking_method = payload.speaking_method;

  let fileUrl = payload.clear_file ? null : payload.file_url ?? row.file_url;
  let fileKey = payload.clear_file ? null : payload.file_key ?? row.file_key;
  let fileName = payload.clear_file ? null : payload.file_name ?? row.file_name;
  let contentType = payload.clear_file ? null : payload.content_type ?? row.content_type;

  if (isUploadTaskType(component.type)) {
    let files = getComponentUploadFiles(row);
    const settings = asUploadTaskSettings(component.settings);

    if (payload.clear_file) {
      await deleteUploadFilesFromR2(files);
      files = [];
    }

    if (payload.remove_file_key) {
      const key = payload.remove_file_key.trim();
      const removing = files.filter((file) => file.key === key || file.url === key);
      const remaining = files.filter((file) => file.key !== key && file.url !== key);
      await deleteUploadFilesFromR2(removing);
      files = remaining;
    }

    if (payload.append_file) {
      const url = String(payload.file_url ?? '').trim();
      if (!url) throw new Error('Uploaded file is missing');
      if (files.length >= settings.max_uploads) {
        throw new Error(`This task allows up to ${settings.max_uploads} upload${settings.max_uploads === 1 ? '' : 's'}`);
      }
      files = [
        ...files,
        {
          url,
          key: String(payload.file_key ?? ''),
          file_name: String(payload.file_name ?? ''),
          content_type: String(payload.content_type ?? ''),
        },
      ];
    }

    extra.files = files;
    const synced = syncLegacyFileFields(files);
    fileUrl = synced.file_url;
    fileKey = synced.file_key;
    fileName = synced.file_name;
    contentType = synced.content_type;
  }

  const next = {
    file_url: fileUrl,
    file_key: fileKey,
    file_name: fileName,
    content_type: contentType,
    audio_url: payload.clear_audio ? null : payload.audio_url ?? row.audio_url,
    audio_key: payload.clear_audio ? null : payload.audio_key ?? row.audio_key,
    duration_seconds:
      payload.clear_audio ? null : payload.duration_seconds ?? row.duration_seconds,
    text_data: payload.speaking_method ?? row.text_data,
    extra,
  };

  const complete = isComponentComplete(component, { ...row, ...next, extra });

  await sql`
    UPDATE classroom_project_component_submissions
    SET
      status = ${complete ? 'complete' : 'incomplete'},
      file_url = ${next.file_url},
      file_key = ${next.file_key},
      file_name = ${next.file_name},
      content_type = ${next.content_type},
      text_data = ${next.text_data},
      audio_url = ${next.audio_url},
      audio_key = ${next.audio_key},
      duration_seconds = ${next.duration_seconds},
      extra = ${JSON.stringify(next.extra)},
      updated_at = NOW()
    WHERE id = ${row.id}
  `;

  if (submission.status !== 'in_progress' && project.allow_resubmission) {
    await sql`
      UPDATE classroom_project_submissions
      SET status = 'in_progress', submitted_at = NULL, reviewed_at = NULL, updated_at = NOW()
      WHERE id = ${submission.id}
    `;
  } else {
    await sql`
      UPDATE classroom_project_submissions
      SET updated_at = NOW()
      WHERE id = ${submission.id}
    `;
  }

  const updated = await findStudentSubmission(
    project.id,
    payload.student_number,
    payload.class_number
  );
  if (!updated) throw new Error('Failed to save progress');
  return updated;
}

export function requiredComponentsComplete(
  project: Pick<ProjectWithComponents, 'components'>,
  submission: ProjectSubmissionWithComponents
): boolean {
  const required = project.components.filter((item) => item.enabled && item.required);
  return required.every((component) => {
    const row = submission.components.find((item) => item.component_id === component.id);
    return row?.status === 'complete';
  });
}

export async function submitProject(
  project: ProjectWithComponents,
  studentNumber: string,
  classNumber: string
): Promise<ProjectSubmissionWithComponents> {
  const submission = await findStudentSubmission(project.id, studentNumber, classNumber);
  if (!submission) throw new Error('Start the project before submitting');
  if (submission.status !== 'in_progress' && !project.allow_resubmission) {
    throw new Error('This project has already been submitted');
  }
  if (!requiredComponentsComplete(project, submission)) {
    throw new Error('Complete every required part before submitting');
  }

  await sql`
    UPDATE classroom_project_submissions
    SET status = 'submitted', submitted_at = NOW(), reviewed_at = NULL, updated_at = NOW()
    WHERE id = ${submission.id}
  `;

  const updated = await findStudentSubmission(project.id, studentNumber, classNumber);
  if (!updated) throw new Error('Failed to submit project');
  return updated;
}

export async function listProjectSubmissions(projectId: string): Promise<ProjectSubmissionRow[]> {
  await ensureProjectsSchema();
  const project = await getProjectByIdOrSlug(projectId);
  if (!project) return [];

  const { rows } = await sql`
    SELECT *
    FROM classroom_project_submissions
    WHERE project_id = ${project.id}
    ORDER BY
      CASE status
        WHEN 'submitted' THEN 0
        WHEN 'reviewed' THEN 1
        ELSE 2
      END,
      student_number ASC
  `;

  const speaking = project.components.find((item) => item.type === 'speaking');
  const uploadTasks = project.components.filter((item) => isUploadTaskType(item.type) && item.enabled);

  return Promise.all(
    rows.map(async (row) => {
      const submission = await hydrateSubmission(row as Record<string, unknown>);
      const components = submission.components;
      const statusFor = (componentId: string, enabled: boolean): ComponentSubmissionStatus | 'disabled' => {
        if (!enabled) return 'disabled';
        const match = components.find((item) => item.component_id === componentId);
        return match?.status === 'complete' ? 'complete' : 'incomplete';
      };
      return {
        ...submission,
        upload_statuses: uploadTasks.map((component) => ({
          component_id: component.id,
          title: componentDisplayTitle(component),
          status: statusFor(component.id, component.enabled),
        })),
        speaking: speaking ? statusFor(speaking.id, speaking.enabled) : 'disabled',
      };
    })
  );
}

export async function getSubmissionForTeacher(
  projectId: string,
  submissionId: string
): Promise<ProjectSubmissionWithComponents | null> {
  await ensureProjectsSchema();
  const { rows } = await sql`
    SELECT *
    FROM classroom_project_submissions
    WHERE id = ${submissionId} AND project_id = ${projectId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return hydrateSubmission(rows[0] as Record<string, unknown>);
}

export async function deleteProjectSubmission(
  projectId: string,
  submissionId: string
): Promise<boolean> {
  await ensureProjectsSchema();
  const existing = await getSubmissionForTeacher(projectId, submissionId);
  if (!existing) return false;
  await sql`
    DELETE FROM classroom_project_submissions
    WHERE id = ${existing.id} AND project_id = ${projectId}
  `;
  try {
    const project = await getProjectByIdOrSlug(projectId);
    if (project) {
      const { syncProjectScoreToGradebook } = await import('@/lib/gradebook/db');
      await syncProjectScoreToGradebook({
        projectId: project.id,
        projectTitle: project.title,
        members: existing.members,
        score: null,
        teacherId: project.teacher_id,
      });
    }
  } catch (error) {
    console.error('Project gradebook cleanup failed:', error);
  }
  return true;
}

export async function deleteStudentProjectSubmission(
  projectId: string,
  studentNumber: string,
  classNumber: string
): Promise<boolean> {
  const existing = await findStudentSubmission(projectId, studentNumber, classNumber);
  if (!existing) return false;
  await sql`
    DELETE FROM classroom_project_submissions
    WHERE id = ${existing.id} AND project_id = ${projectId}
  `;
  try {
    const project = await getProjectByIdOrSlug(projectId);
    if (project) {
      const { syncProjectScoreToGradebook } = await import('@/lib/gradebook/db');
      await syncProjectScoreToGradebook({
        projectId: project.id,
        projectTitle: project.title,
        members: existing.members,
        score: null,
        teacherId: project.teacher_id,
      });
    }
  } catch (error) {
    console.error('Project gradebook cleanup failed:', error);
  }
  return true;
}

export async function reviewSubmission(
  projectId: string,
  submissionId: string,
  payload: ReviewSubmissionPayload
): Promise<ProjectSubmissionWithComponents> {
  const existing = await getSubmissionForTeacher(projectId, submissionId);
  if (!existing) throw new Error('Submission not found');
  if (existing.status === 'in_progress') {
    throw new Error('This student has not submitted yet');
  }

  const feedback =
    payload.teacher_feedback == null ? existing.teacher_feedback : String(payload.teacher_feedback);
  const score = payload.score === undefined ? existing.score : payload.score;
  const nextStatus = payload.mark_reviewed === true || existing.status === 'reviewed' ? 'reviewed' : 'submitted';

  if (payload.mark_reviewed === true) {
    await sql`
      UPDATE classroom_project_submissions
      SET
        teacher_feedback = ${feedback},
        score = ${score},
        status = 'reviewed',
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = ${existing.id}
    `;
  } else {
    await sql`
      UPDATE classroom_project_submissions
      SET
        teacher_feedback = ${feedback},
        score = ${score},
        status = ${nextStatus},
        updated_at = NOW()
      WHERE id = ${existing.id}
    `;
  }

  const updated = await getSubmissionForTeacher(projectId, submissionId);
  if (!updated) throw new Error('Failed to save review');

  try {
    const project = await getProjectByIdOrSlug(projectId);
    if (project) {
      const { syncProjectScoreToGradebook } = await import('@/lib/gradebook/db');
      await syncProjectScoreToGradebook({
        projectId: project.id,
        projectTitle: project.title,
        members: updated.members,
        score,
        notes: feedback,
        teacherId: project.teacher_id,
      });
    }
  } catch (error) {
    console.error('Project gradebook sync failed:', error);
  }

  return updated;
}

export function getWorksheetSettings(component: ProjectComponent): WorksheetSettings {
  return asWorksheetSettings(component.settings);
}

export function getArtworkSettings(component: ProjectComponent): ArtworkSettings {
  return asArtworkSettings(component.settings);
}

export function getSpeakingSettings(component: ProjectComponent): SpeakingSettings {
  return asSpeakingSettings(component.settings);
}
