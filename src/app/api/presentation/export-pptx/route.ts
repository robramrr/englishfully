import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  buildPresentationPptxBuffer,
  presentationPptxFilename,
} from '@/lib/presentation/exportPptx';
import { normalizeDeck, type PresentationDeck } from '@/lib/presentation/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const deck = normalizeDeck((body.deck || body) as PresentationDeck);
    const buffer = await buildPresentationPptxBuffer(deck);
    const filename = presentationPptxFilename(deck);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PowerPoint export error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to export PowerPoint',
      500
    );
  }
}
