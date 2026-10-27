import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listVocabDecks, upsertVocabDeck } from '@/lib/vocabulary/db';
import {
  createEmptyVocabDeck,
  normalizeVocabDeck,
  type VocabDeck,
} from '@/lib/vocabulary/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const decks = await listVocabDecks();
    return NextResponse.json({ decks });
  } catch (error) {
    console.error('List vocabulary decks error:', error);
    return jsonError('Failed to list vocabulary decks', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const rawDeck = (body.deck || body) as Partial<VocabDeck>;
    const isCreateOnly = body.create === true || (!rawDeck.cards && !body.deck);
    const deck = normalizeVocabDeck(
      isCreateOnly
        ? {
            ...createEmptyVocabDeck(),
            title: String(body.title || ''),
            topic: String(body.topic || ''),
            level: body.level,
          }
        : rawDeck
    );
    const saved = await upsertVocabDeck(deck);
    return NextResponse.json({ deck: saved });
  } catch (error) {
    console.error('Save vocabulary deck error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save vocabulary deck',
      500
    );
  }
}
