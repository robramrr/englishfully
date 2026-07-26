import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateVocabularyFromTranscript } from '@/lib/listen-and-learn/openai';
import type { CefrLevel } from '@/lib/listen-and-answer/types';
import type { TranscriptSegmentDraft } from '@/lib/listen-and-learn/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const transcript = String(body.transcript ?? '').trim();
    if (!transcript) {
      return jsonError('Generate or enter a transcript before creating vocabulary', 400);
    }

    const vocabulary = await generateVocabularyFromTranscript({
      framework: String(body.framework ?? 'American English File'),
      cefrLevel: (body.cefr_level as CefrLevel) || 'A2',
      transcript,
      audioUrl: String(body.audio_url ?? '').trim() || undefined,
      segments: Array.isArray(body.segments)
        ? (body.segments as TranscriptSegmentDraft[])
        : undefined,
      count: Number(body.count) || 5,
    });

    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error('Listen & Learn vocabulary error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate vocabulary',
      500
    );
  }
}
