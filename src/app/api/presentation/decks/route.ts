import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listPresentations, upsertPresentation } from '@/lib/presentation/db';
import { normalizeDeck, type PresentationDeck } from '@/lib/presentation/types';
import { getPresentationUrl } from '@/lib/presentation/qr';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const presentations = await listPresentations();
    return NextResponse.json({ presentations });
  } catch (error) {
    console.error('List presentations error:', error);
    return jsonError('Failed to list presentations', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const rawDeck = (body.deck || body) as Partial<PresentationDeck>;
    const isCreateOnly = body.create === true || (!rawDeck.slides && !body.deck);
    const deck = normalizeDeck(
      isCreateOnly
        ? {
            title: String(body.title || 'Untitled presentation'),
            status: 'draft',
          }
        : (rawDeck as PresentationDeck)
    );
    if (body.publish === true) {
      deck.status = 'published';
    }
    const saved = await upsertPresentation(deck);
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      presentation: saved,
      url: getPresentationUrl(saved.id, origin),
    });
  } catch (error) {
    console.error('Save presentation error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save presentation',
      500
    );
  }
}
