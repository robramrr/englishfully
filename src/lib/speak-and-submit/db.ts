import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import type {
  CreateTaskPayload,
  SpeakSubmission,
  SpeakTask,
  SpeakTaskItem,
  SubmitPayload,
  TaskType,
} from './types';

let schemaReady: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS speak_tasks (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL,
          task_type TEXT NOT NULL CHECK (task_type IN ('single_sentence', 'sentence_set', 'vocab_list', 'prompt')),
          class_name TEXT NOT NULL,
          qr_code_url TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS speak_task_items (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES speak_tasks(id) ON DELETE CASCADE,
          order_index INTEGER NOT NULL,
          content TEXT NOT NULL
        )
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
    qr_code_url: (row.qr_code_url as string | null) ?? null,
    created_at: new Date(row.created_at as string).toISOString(),
  };
}

function rowToItem(row: Record<string, unknown>): SpeakTaskItem {
  return {
    id: row.id as string,
    task_id: row.task_id as string,
    order_index: row.order_index as number,
    content: row.content as string,
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
  const items = payload.items
    .map((content) => content.trim())
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error('At least one task item is required');
  }

  await sql`
    INSERT INTO speak_tasks (id, title, task_type, class_name, qr_code_url)
    VALUES (${taskId}, ${payload.title.trim()}, ${payload.task_type}, ${payload.class_name.trim()}, ${studentUrl})
  `;

  const createdItems: SpeakTaskItem[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const itemId = nanoid(21);
    await sql`
      INSERT INTO speak_task_items (id, task_id, order_index, content)
      VALUES (${itemId}, ${taskId}, ${index}, ${items[index]})
    `;
    createdItems.push({
      id: itemId,
      task_id: taskId,
      order_index: index,
      content: items[index],
    });
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
  const { rows } = await sql`
    SELECT * FROM speak_task_items
    WHERE task_id = ${taskId}
    ORDER BY order_index ASC
  `;
  return rows.map(rowToItem);
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

export async function createSubmissions(
  taskId: string,
  payload: SubmitPayload
): Promise<number> {
  await ensureSchema();
  const task = await getTaskById(taskId);
  if (!task) throw new Error('Task not found');

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
        ${payload.student_number.trim()},
        ${payload.class_number.trim()},
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
