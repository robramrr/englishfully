import { sql } from '@vercel/postgres';
import {
  normalizeVocabDeck,
  type VocabDeck,
  type VocabDeckListItem,
} from './types';

const DEFAULT_TEACHER_ID = 'default';

let schemaReady: Promise<void> | null = null;

function toIsoTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function ensureVocabularySchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS vocabulary_decks (
          id TEXT PRIMARY KEY,
          teacher_id TEXT NOT NULL DEFAULT 'default',
          title TEXT NOT NULL DEFAULT '',
          deck_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_vocabulary_decks_teacher
        ON vocabulary_decks(teacher_id, updated_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function rowToDeck(row: Record<string, unknown>): VocabDeck {
  const raw = row.deck_json;
  const parsed =
    typeof raw === 'string' ? (JSON.parse(raw) as VocabDeck) : (raw as VocabDeck);
  return normalizeVocabDeck({
    ...parsed,
    id: String(row.id),
    title: String(row.title || parsed?.title || ''),
    updatedAt: toIsoTimestamp(row.updated_at),
  });
}

export async function listVocabDecks(
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<VocabDeckListItem[]> {
  await ensureVocabularySchema();
  const { rows } = await sql`
    SELECT id, title, deck_json, updated_at
    FROM vocabulary_decks
    WHERE teacher_id = ${teacherId}
    ORDER BY updated_at DESC
    LIMIT 100
  `;
  return rows.map((row) => {
    const deck = rowToDeck(row);
    return {
      id: deck.id,
      title: deck.title || 'Untitled deck',
      topic: deck.topic,
      level: deck.level,
      card_count: deck.cards.filter((card) => card.word.trim()).length,
      updated_at: deck.updatedAt,
    };
  });
}

export async function getVocabDeck(id: string): Promise<VocabDeck | null> {
  await ensureVocabularySchema();
  const { rows } = await sql`
    SELECT id, title, deck_json, updated_at
    FROM vocabulary_decks
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rowToDeck(rows[0]);
}

export async function upsertVocabDeck(
  deck: VocabDeck,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<VocabDeck> {
  await ensureVocabularySchema();
  const normalized = normalizeVocabDeck(deck);
  const id = normalized.id;
  const title = normalized.title.trim() || 'Untitled deck';
  const next = normalizeVocabDeck({
    ...normalized,
    id,
    title: normalized.title,
    updatedAt: new Date().toISOString(),
  });

  await sql`
    INSERT INTO vocabulary_decks (id, teacher_id, title, deck_json, created_at, updated_at)
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

export async function deleteVocabDeck(
  id: string,
  teacherId: string = DEFAULT_TEACHER_ID
): Promise<boolean> {
  await ensureVocabularySchema();
  const { rowCount } = await sql`
    DELETE FROM vocabulary_decks
    WHERE id = ${id} AND teacher_id = ${teacherId}
  `;
  return (rowCount ?? 0) > 0;
}
