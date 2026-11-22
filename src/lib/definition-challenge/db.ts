import { sql } from '@vercel/postgres';
import {
  challengeActivityTitle,
  challengeGridWords,
  normalizeChallengeActivity,
  type DefinitionChallengeActivity,
  type DefinitionChallengeListItem,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function ensureChallengeSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS definition_challenge_activities (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          activity_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_definition_challenge_teacher
        ON definition_challenge_activities(teacher_id, updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function rowToActivity(row: Record<string, unknown>): DefinitionChallengeActivity {
  const raw = row.activity_json;
  const parsed =
    typeof raw === 'string'
      ? (JSON.parse(raw) as DefinitionChallengeActivity)
      : (raw as DefinitionChallengeActivity);
  return normalizeChallengeActivity({
    ...parsed,
    id: String(row.id),
    title: String(row.title || parsed?.title || ''),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

export async function listChallengeActivities(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<DefinitionChallengeListItem[]> {
  await ensureChallengeSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM definition_challenge_activities
    WHERE teacher_id = ${teacherId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map((row) => {
    const activity = rowToActivity(row);
    return {
      id: activity.id,
      title: challengeActivityTitle(activity),
      topic: activity.topic,
      level: activity.level,
      word_count: activity.words.length,
      grid_count: challengeGridWords(activity).length,
      game_length: activity.callWordIds.length,
      updated_at: activity.updatedAt,
    };
  });
}

export async function getChallengeActivity(id: string): Promise<DefinitionChallengeActivity | null> {
  await ensureChallengeSchema();
  const { rows } = await sql`
    SELECT id, title, activity_json, updated_at
    FROM definition_challenge_activities
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToActivity(rows[0]);
}

export async function upsertChallengeActivity(
  activity: DefinitionChallengeActivity,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<DefinitionChallengeActivity> {
  await ensureChallengeSchema();
  const normalized = normalizeChallengeActivity(activity);
  const title = challengeActivityTitle(normalized);
  const next = normalizeChallengeActivity({
    ...normalized,
    updatedAt: new Date().toISOString(),
  });
  await sql`
    INSERT INTO definition_challenge_activities (id, teacher_id, title, activity_json, created_at, updated_at)
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

export async function deleteChallengeActivity(
  id: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureChallengeSchema();
  const { rowCount } = await sql`
    DELETE FROM definition_challenge_activities
    WHERE id = ${id} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}
