import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import {
  normalizeDeck,
  type PresentationDeck,
  type PresentationListItem,
} from './types';

export type { PresentationListItem };

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function ensurePresentationSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS presentations (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          deck_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_presentations_teacher
        ON presentations(teacher_id, updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function rowToDeck(row: Record<string, unknown>): PresentationDeck {
  const raw = row.deck_json;
  const parsed =
    typeof raw === 'string'
      ? (JSON.parse(raw) as PresentationDeck)
      : (raw as PresentationDeck);
  return normalizeDeck({
    ...parsed,
    id: String(row.id),
    title: String(row.title || parsed?.title || ''),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

export async function listPresentations(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<PresentationListItem[]> {
  await ensurePresentationSchema();
  const { rows } = await sql`
    SELECT id, title, deck_json, updated_at
    FROM presentations
    WHERE teacher_id = ${teacherId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map((row) => {
    const deck = rowToDeck(row);
    return {
      id: deck.id,
      title: deck.title || 'Untitled presentation',
      brand_label: deck.brandLabel,
      status: deck.status,
      slide_count: deck.slides.length,
      updated_at: deck.updatedAt,
    };
  });
}

export async function getPresentation(
  id: string
): Promise<PresentationDeck | null> {
  await ensurePresentationSchema();
  const { rows } = await sql`
    SELECT id, title, deck_json, updated_at
    FROM presentations
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToDeck(rows[0]);
}

export async function upsertPresentation(
  deck: PresentationDeck,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<PresentationDeck> {
  await ensurePresentationSchema();
  const normalized = normalizeDeck(deck);
  const id = normalized.id || nanoid(21);
  const title = normalized.title.trim() || 'Untitled presentation';
  const next = normalizeDeck({ ...normalized, id, title });

  await sql`
    INSERT INTO presentations (id, teacher_id, title, deck_json, created_at, updated_at)
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
      deck_json = EXCLUDED.deck_json,
      updated_at = NOW()
  `;

  return next;
}

export async function deletePresentation(
  id: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensurePresentationSchema();
  const { rowCount } = await sql`
    DELETE FROM presentations
    WHERE id = ${id} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}
