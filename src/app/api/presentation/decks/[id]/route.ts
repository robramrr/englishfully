import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deletePresentation,
  getPresentation,
  upsertPresentation,
} from '@/lib/presentation/db';
import { normalizeDeck, type PresentationDeck } from '@/lib/presentation/types';
import { getPresentationUrl } from '@/lib/presentation/qr';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const deck = await getPresentation(context.params.id);
    if (!deck) return jsonError('Presentation not found', 404);
    return NextResponse.json({ presentation: deck });
  } catch (error) {
    console.error('Get presentation error:', error);
    return jsonError('Failed to load presentation', 500);
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
    const deck = normalizeDeck({
      ...((body.deck || body) as PresentationDeck),
      id: context.params.id,
    });
    const saved = await upsertPresentation(deck);
    return NextResponse.json({
      presentation: saved,
      url: getPresentationUrl(saved.id, request.nextUrl.origin),
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update presentation',
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
    const deleted = await deletePresentation(context.params.id);
    if (!deleted) return jsonError('Presentation not found', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete presentation error:', error);
    return jsonError('Failed to delete presentation', 500);
  }
}
