import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  buildSegmentsFromManualTranscript,
  transcribeAudioWithSegments,
} from '@/lib/listen-and-learn/openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const audioUrl = String(body.audio_url ?? '').trim();
    const manualTranscript = String(body.transcript ?? '').trim();

    if (manualTranscript) {
      const segments = buildSegmentsFromManualTranscript(manualTranscript);
      return NextResponse.json({
        transcript: manualTranscript,
        segments,
        source: 'manual',
      });
    }

    if (!audioUrl) {
      return jsonError('Audio URL or transcript is required', 400);
    }

    const result = await transcribeAudioWithSegments(audioUrl);
    return NextResponse.json({
      transcript: result.transcript,
      segments: result.segments,
      source: 'auto',
    });
  } catch (error) {
    console.error('Listen & Learn transcript error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate transcript',
      500
    );
  }
}
