import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteVocabDeck,
  getVocabDeck,
  upsertVocabDeck,
} from '@/lib/vocabulary/db';
import { normalizeVocabDeck, type VocabDeck } from '@/lib/vocabulary/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const deck = await getVocabDeck(context.params.id);
    if (!deck) return jsonError('Vocabulary deck not found', 404);
    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Get vocabulary deck error:', error);
    return jsonError('Failed to load vocabulary deck', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json();
    const deck = normalizeVocabDeck({
      ...((body.deck || body) as VocabDeck),
      id: context.params.id,
    });
    const saved = await upsertVocabDeck(deck);
    return NextResponse.json({ deck: saved });
  } catch (error) {
    console.error('Update vocabulary deck error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update vocabulary deck',
      500
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const deleted = await deleteVocabDeck(context.params.id);
    if (!deleted) return jsonError('Vocabulary deck not found', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete vocabulary deck error:', error);
    return jsonError('Failed to delete vocabulary deck', 500);
  }
}
