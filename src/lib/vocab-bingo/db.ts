import { sql } from '@vercel/postgres';
import {
  bingoActivityTitle,
  bingoWordsReady,
  normalizeBingoActivity,
  type VocabBingoActivity,
  type VocabBingoListItem,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function ensureBingoSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS vocab_bingo_activities (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          activity_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_vocab_bingo_teacher
        ON vocab_bingo_activities(teacher_id, updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function rowToActivity(row: Record<string, unknown>): VocabBingoActivity {
  const raw = row.activity_json;
  const parsed =
    typeof raw === 'string'
      ? (JSON.parse(raw) as VocabBingoActivity)
      : (raw as VocabBingoActivity);
  return normalizeBingoActivity({
    ...parsed,
    id: String(row.id),
    title: String(row.title || parsed?.title || ''),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

export async function listBingoActivities(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<VocabBingoListItem[]> {
  await ensureBingoSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM vocab_bingo_activities
    WHERE teacher_id = ${teacherId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map((row) => {
    const activity = rowToActivity(row);
    return {
      id: activity.id,
      title: bingoActivityTitle(activity),
      topic: activity.topic,
      level: activity.level,
      word_count: bingoWordsReady(activity.words).length,
      grid_size: activity.gridSize,
      updated_at: activity.updatedAt,
    };
  });
}

export async function getBingoActivity(id: string): Promise<VocabBingoActivity | null> {
  await ensureBingoSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM vocab_bingo_activities
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToActivity(rows[0]);
}

export async function upsertBingoActivity(
  activity: VocabBingoActivity,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<VocabBingoActivity> {
  await ensureBingoSchema();
  const normalized = normalizeBingoActivity(activity);
  const title = bingoActivityTitle(normalized);
  const next = normalizeBingoActivity({
    ...normalized,
    title: normalized.title,
    updatedAt: new Date().toISOString(),
  });

  await sql`
    INSERT INTO vocab_bingo_activities (id, teacher_id, title, activity_json, created_at, updated_at)
    VALUES (
      ${next.id},
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

export async function deleteBingoActivity(
  id: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureBingoSchema();
  const { rowCount } = await sql`
    DELETE FROM vocab_bingo_activities
    WHERE id = ${id} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}
