import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import { ensureSchema } from './db';
import type {
  NameMode,
  SaveEntryConfigPayload,
  SpeakClassOption,
  SpeakEntryConfig,
} from './types';

const DEFAULT_TEACHER_ID = 'default';
const DEFAULT_MAX_STUDENTS = 35;

function rowToClassOption(row: Record<string, unknown>): SpeakClassOption {
  return {
    id: row.id as string,
    label: row.label as string,
    max_student_number: row.max_student_number as number,
    sort_order: row.sort_order as number,
  };
}

export async function ensureSettingsSchema(): Promise<void> {
  await ensureSchema();
  await sql`
    CREATE TABLE IF NOT EXISTS speak_teacher_settings (
      teacher_id TEXT PRIMARY KEY DEFAULT 'default',
      name_mode TEXT NOT NULL DEFAULT 'nickname' CHECK (name_mode IN ('nickname', 'first_last')),
      student_letter_enabled BOOLEAN NOT NULL DEFAULT false,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE speak_teacher_settings
    ADD COLUMN IF NOT EXISTS student_letter_enabled BOOLEAN NOT NULL DEFAULT false
  `;
  await sql`
    ALTER TABLE speak_teacher_settings
    ADD COLUMN IF NOT EXISTS teacher_name TEXT NOT NULL DEFAULT ''
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS speak_class_options (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL DEFAULT 'default',
      label TEXT NOT NULL,
      max_student_number INTEGER NOT NULL DEFAULT 35,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_speak_class_options_teacher
    ON speak_class_options(teacher_id, sort_order)
  `;
}

export async function getEntryConfig(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<SpeakEntryConfig> {
  await ensureSettingsSchema();

  const { rows: settingsRows } = await sql`
    SELECT name_mode, student_letter_enabled FROM speak_teacher_settings WHERE teacher_id = ${teacherId}
  `;

  const nameMode =
    settingsRows.length > 0 ? (settingsRows[0].name_mode as NameMode) : 'nickname';
  const studentLetterEnabled =
    settingsRows.length > 0 ? Boolean(settingsRows[0].student_letter_enabled) : false;

  const { rows: classRows } = await sql`
    SELECT * FROM speak_class_options
    WHERE teacher_id = ${teacherId}
    ORDER BY sort_order ASC, label ASC
  `;

  return {
    name_mode: nameMode,
    student_letter_enabled: studentLetterEnabled,
    classes: classRows.map(rowToClassOption),
  };
}

export async function saveEntryConfig(
  payload: SaveEntryConfigPayload,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<SpeakEntryConfig> {
  await ensureSettingsSchema();

  if (!['nickname', 'first_last'].includes(payload.name_mode)) {
    throw new Error('Invalid name mode');
  }

  const classes = payload.classes
    .map((item) => ({
      label: item.label.trim(),
      max_student_number: Math.min(
        99,
        Math.max(1, Number.parseInt(String(item.max_student_number), 10) || DEFAULT_MAX_STUDENTS)
      ),
    }))
    .filter((item) => item.label.length > 0);

  const labels = new Set<string>();
  for (const item of classes) {
    const key = item.label.toLowerCase();
    if (labels.has(key)) {
      throw new Error('Each class label must be unique');
    }
    labels.add(key);
  }

  await sql`
    INSERT INTO speak_teacher_settings (teacher_id, name_mode, student_letter_enabled, updated_at)
    VALUES (${teacherId}, ${payload.name_mode}, ${Boolean(payload.student_letter_enabled)}, NOW())
    ON CONFLICT (teacher_id)
    DO UPDATE SET
      name_mode = EXCLUDED.name_mode,
      student_letter_enabled = EXCLUDED.student_letter_enabled,
      updated_at = NOW()
  `;

  await sql`DELETE FROM speak_class_options WHERE teacher_id = ${teacherId}`;

  for (let index = 0; index < classes.length; index += 1) {
    const item = classes[index];
    await sql`
      INSERT INTO speak_class_options (id, teacher_id, label, max_student_number, sort_order)
      VALUES (${nanoid(21)}, ${teacherId}, ${item.label}, ${item.max_student_number}, ${index})
    `;
  }

  return getEntryConfig(teacherId);
}

export async function getTeacherName(teacherId: string = DEFAULT_TEACHER_ID): Promise<string> {
  await ensureSettingsSchema();

  const { rows } = await sql`
    SELECT teacher_name FROM speak_teacher_settings WHERE teacher_id = ${teacherId}
  `;

  return rows.length > 0 ? String(rows[0].teacher_name ?? '').trim() : '';
}

export async function saveTeacherName(
  teacherName: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<string> {
  await ensureSettingsSchema();

  const normalizedName = teacherName.trim();
  if (!normalizedName) {
    throw new Error('Teacher name is required');
  }

  await sql`
    INSERT INTO speak_teacher_settings (teacher_id, teacher_name, updated_at)
    VALUES (${teacherId}, ${normalizedName}, NOW())
    ON CONFLICT (teacher_id)
    DO UPDATE SET
      teacher_name = EXCLUDED.teacher_name,
      updated_at = NOW()
  `;

  return normalizedName;
}
