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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
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
    SELECT name_mode FROM speak_teacher_settings WHERE teacher_id = ${teacherId}
  `;

  const nameMode =
    settingsRows.length > 0 ? (settingsRows[0].name_mode as NameMode) : 'nickname';

  const { rows: classRows } = await sql`
    SELECT * FROM speak_class_options
    WHERE teacher_id = ${teacherId}
    ORDER BY sort_order ASC, label ASC
  `;

  return {
    name_mode: nameMode,
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
    INSERT INTO speak_teacher_settings (teacher_id, name_mode, updated_at)
    VALUES (${teacherId}, ${payload.name_mode}, NOW())
    ON CONFLICT (teacher_id)
    DO UPDATE SET name_mode = EXCLUDED.name_mode, updated_at = NOW()
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
