import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type {
  CreateTaskPayload,
  ItemTaskType,
  SpeakSubmission,
  SpeakTask,
  SpeakTaskItem,
  SubmitPayload,
  TaskType,
} from './types';
import {
  deriveTaskType,
  getDefaultMaxRecordingSeconds,
  normalizeStudentNumber,
  normalizeTaskItemInput,
} from './types';
import type { TaskItemInput } from './types';

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS speak_tasks (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL,
          task_type TEXT NOT NULL,
          class_name TEXT NOT NULL,
          max_recording_seconds INTEGER NOT NULL DEFAULT 25,
          qr_code_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        ALTER TABLE speak_tasks
        ADD COLUMN IF NOT EXISTS max_recording_seconds INTEGER NOT NULL DEFAULT 25
      `;
      await sql`
        ALTER TABLE speak_tasks
        DROP CONSTRAINT IF EXISTS speak_tasks_task_type_check
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS speak_task_items (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES speak_tasks(id) ON DELETE CASCADE,
          order_index INTEGER NOT NULL,
          content TEXT NOT NULL,
          item_type TEXT,
          section_index INTEGER NOT NULL DEFAULT 0,
          max_recording_seconds INTEGER
        )
      `;
      await sql`
        ALTER TABLE speak_task_items
        ADD COLUMN IF NOT EXISTS item_type TEXT
      `;
      await sql`
        ALTER TABLE speak_task_items
        ADD COLUMN IF NOT EXISTS section_index INTEGER NOT NULL DEFAULT 0
      `;
      await sql`
        ALTER TABLE speak_task_items
        ADD COLUMN IF NOT EXISTS max_recording_seconds INTEGER
      `;
      await sql`
        ALTER TABLE speak_task_items
        ADD COLUMN IF NOT EXISTS prompt_rules TEXT
      `;
      await sql`
        ALTER TABLE speak_task_items
        ADD COLUMN IF NOT EXISTS prompt_example TEXT
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS speak_submissions (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES speak_tasks(id) ON DELETE CASCADE,
          task_item_id TEXT NOT NULL REFERENCES speak_task_items(id) ON DELETE CASCADE,
          student_name TEXT NOT NULL,
          student_number TEXT NOT NULL,
          class_number TEXT NOT NULL,
          audio_url TEXT NOT NULL,
          duration_seconds REAL,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_speak_task_items_task_id ON speak_task_items(task_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_speak_submissions_task_id ON speak_submissions(task_id)`;
    })();
  }
  await schemaReady;
}

function rowToTask(row: Record<string, unknown>): SpeakTask {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    title: row.title as string,
    task_type: row.task_type as TaskType,
    class_name: row.class_name as string,
    max_recording_seconds: (row.max_recording_seconds as number) ?? 25,
    qr_code_url: (row.qr_code_url as string | null) ?? null,
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function rowToItem(row: Record<string, unknown>, fallbackType?: ItemTaskType): SpeakTaskItem {
  return {
    id: row.id as string,
    task_id: row.task_id as string,
    order_index: row.order_index as number,
    content: row.content as string,
    item_type: (row.item_type as ItemTaskType) ?? fallbackType ?? 'single_sentence',
    section_index: (row.section_index as number) ?? 0,
    max_recording_seconds: (row.max_recording_seconds as number | null) ?? null,
    prompt_rules: (row.prompt_rules as string | null) ?? null,
    prompt_example: (row.prompt_example as string | null) ?? null,
  };
}

function rowToSubmission(row: Record<string, unknown>): SpeakSubmission {
  return {
    id: row.id as string,
    task_id: row.task_id as string,
    task_item_id: row.task_item_id as string,
    student_name: row.student_name as string,
    student_number: row.student_number as string,
    class_number: row.class_number as string,
    audio_url: row.audio_url as string,
    duration_seconds: row.duration_seconds as number | null,
    submitted_at: new Date(row.submitted_at as string).toISOString(),
  };
}

export async function createTask(
  payload: CreateTaskPayload,
  studentUrl: string
): Promise<{ task: SpeakTask; items: SpeakTaskItem[] }> {
  await ensureSchema();
  const taskId = nanoid(21);
  const sections = payload.sections.map((section) => ({
    item_type: section.item_type,
    max_recording_seconds: Math.min(
      300,
      Math.max(
        5,
        section.max_recording_seconds || getDefaultMaxRecordingSeconds(section.item_type)
      )
    ),
    items: section.items
      .map((item) => normalizeTaskItemInput(item))
      .filter((item) => item.content.length > 0),
  }));

  const flatItems = sections.flatMap((section) => section.items);
  if (flatItems.length === 0) {
    throw new Error('At least one task item is required');
  }

  const taskType = deriveTaskType(sections);
  const maxRecordingSeconds = Math.max(...sections.map((section) => section.max_recording_seconds));

  await sql`
    INSERT INTO speak_tasks (id, title, task_type, class_name, max_recording_seconds, qr_code_url)
    VALUES (${taskId}, ${payload.title.trim()}, ${taskType}, ${payload.class_name.trim()}, ${maxRecordingSeconds}, ${studentUrl})
  `;

  const createdItems: SpeakTaskItem[] = [];
  let orderIndex = 0;
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    for (const item of section.items) {
      const itemId = nanoid(21);
      await sql`
        INSERT INTO speak_task_items (
          id, task_id, order_index, content, item_type, section_index, max_recording_seconds,
          prompt_rules, prompt_example
        )
        VALUES (
          ${itemId},
          ${taskId},
          ${orderIndex},
          ${item.content},
          ${section.item_type},
          ${sectionIndex},
          ${section.max_recording_seconds},
          ${item.prompt_rules ?? null},
          ${item.prompt_example ?? null}
        )
      `;
      createdItems.push({
        id: itemId,
        task_id: taskId,
        order_index: orderIndex,
        content: item.content,
        item_type: section.item_type,
        section_index: sectionIndex,
        max_recording_seconds: section.max_recording_seconds,
        prompt_rules: item.prompt_rules ?? null,
        prompt_example: item.prompt_example ?? null,
      });
      orderIndex += 1;
    }
  }

  const { rows } = await sql`SELECT * FROM speak_tasks WHERE id = ${taskId}`;
  return { task: rowToTask(rows[0]), items: createdItems };
}

export async function listTasks(): Promise<SpeakTask[]> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM speak_tasks ORDER BY created_at DESC`;
  return rows.map(rowToTask);
}

export async function getTaskById(taskId: string): Promise<SpeakTask | null> {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM speak_tasks WHERE id = ${taskId}`;
  if (rows.length === 0) return null;
  return rowToTask(rows[0]);
}

export async function getTaskItems(taskId: string): Promise<SpeakTaskItem[]> {
  await ensureSchema();
  const task = await getTaskById(taskId);
  const fallbackType =
    task && task.task_type !== 'mixed' ? (task.task_type as ItemTaskType) : 'single_sentence';
  const { rows } = await sql`
    SELECT * FROM speak_task_items
    WHERE task_id = ${taskId}
    ORDER BY order_index ASC
  `;
  return rows.map((row) => rowToItem(row, fallbackType));
}

export async function deleteTask(taskId: string): Promise<boolean> {
  await ensureSchema();
  const result = await sql`DELETE FROM speak_tasks WHERE id = ${taskId}`;
  return (result.rowCount ?? 0) > 0;
}

export async function getSubmissionsForTask(taskId: string): Promise<
  Array<SpeakSubmission & { item_content: string; item_order: number }>
> {
  await ensureSchema();
  const { rows } = await sql`
    SELECT s.*, i.content AS item_content, i.order_index AS item_order
    FROM speak_submissions s
    JOIN speak_task_items i ON i.id = s.task_item_id
    WHERE s.task_id = ${taskId}
    ORDER BY s.student_number ASC, i.order_index ASC, s.submitted_at ASC
  `;
  return rows.map((row) => ({
    ...rowToSubmission(row),
    item_content: row.item_content as string,
    item_order: row.item_order as number,
  }));
}

export async function submissionExists(
  taskId: string,
  studentNumber: string,
  classNumber: string
): Promise<boolean> {
  await ensureSchema();
  const normalizedNumber = normalizeStudentNumber(studentNumber);
  const normalizedClass = classNumber.trim();

  const { rows } = await sql`
    SELECT 1 FROM speak_submissions
    WHERE task_id = ${taskId}
      AND student_number = ${normalizedNumber}
      AND class_number = ${normalizedClass}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createSubmissions(
  taskId: string,
  payload: SubmitPayload
): Promise<number> {
  await ensureSchema();
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const normalizedNumber = normalizeStudentNumber(payload.student_number);
  const normalizedClass = payload.class_number.trim();

  const alreadySubmitted = await submissionExists(taskId, normalizedNumber, normalizedClass);
  if (alreadySubmitted) {
    throw new Error('You have already submitted for this task.');
  }

  const items = await getTaskItems(taskId);
  const itemIds = new Set(items.map((item) => item.id));

  for (const recording of payload.recordings) {
    if (!itemIds.has(recording.task_item_id)) {
      throw new Error('Invalid task item');
    }
  }

  let created = 0;
  for (const recording of payload.recordings) {
    const submissionId = nanoid(21);
    await sql`
      INSERT INTO speak_submissions (
        id, task_id, task_item_id, student_name, student_number, class_number, audio_url, duration_seconds
      ) VALUES (
        ${submissionId},
        ${taskId},
        ${recording.task_item_id},
        ${payload.student_name.trim()},
        ${normalizedNumber},
        ${normalizedClass},
        ${recording.audio_url},
        ${recording.duration_seconds}
      )
    `;
    created += 1;
  }

  return created;
}

export async function taskExists(taskId: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await sql`SELECT 1 FROM speak_tasks WHERE id = ${taskId} LIMIT 1`;
  return rows.length > 0;
}
