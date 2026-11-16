import { sql } from '@vercel/postgres';
import {
  anagramWordsReady,
  normalizeAnagramActivity,
  type AnagramActivity,
  type AnagramActivityListItem,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function ensureAnagramSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS anagram_activities (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          activity_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_anagram_activities_teacher
        ON anagram_activities(teacher_id, updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function rowToActivity(row: Record<string, unknown>): AnagramActivity {
  const raw = row.activity_json;
  const parsed =
    typeof raw === 'string'
      ? (JSON.parse(raw) as AnagramActivity)
      : (raw as AnagramActivity);
  return normalizeAnagramActivity({
    ...parsed,
    id: String(row.id),
    title: String(row.title || parsed?.title || ''),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

export async function listAnagramActivities(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<AnagramActivityListItem[]> {
  await ensureAnagramSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM anagram_activities
    WHERE teacher_id = ${teacherId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map((row) => {
    const activity = rowToActivity(row);
    return {
      id: activity.id,
      title: activity.title.trim() || activity.topic.trim() || 'Untitled anagram',
      topic: activity.topic,
      level: activity.level,
      word_count: anagramWordsReady(activity.words).length,
      timer_enabled: activity.timerEnabled,
      seconds_per_word: activity.secondsPerWord,
      updated_at: activity.updatedAt,
    };
  });
}

export async function getAnagramActivity(id: string): Promise<AnagramActivity | null> {
  await ensureAnagramSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM anagram_activities
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToActivity(rows[0]);
}

export async function upsertAnagramActivity(
  activity: AnagramActivity,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<AnagramActivity> {
  await ensureAnagramSchema();
  const normalized = normalizeAnagramActivity(activity);
  const id = normalized.id;
  const title = normalized.title.trim() || normalized.topic.trim() || 'Untitled anagram';
  const next = normalizeAnagramActivity({
    ...normalized,
    id,
    title: normalized.title,
    updatedAt: new Date().toISOString(),
  });

  await sql`
    INSERT INTO anagram_activities (id, teacher_id, title, activity_json, created_at, updated_at)
    VALUES (
      ${id},
      ${teacherId},
      ${title},
      ${JSON.stringify(next)},
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      activity_json = EXCLUDED.activity_json,
      updated_at = NOW()
  `;

  return next;
}

export async function deleteAnagramActivity(
  id: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureAnagramSchema();
  const { rowCount } = await sql`
    DELETE FROM anagram_activities
    WHERE id = ${id} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}
