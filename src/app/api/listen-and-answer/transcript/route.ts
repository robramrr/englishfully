import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { transcribeAudioFromUrl } from '@/lib/listen-and-answer/openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const audioUrl = String(body.audio_url ?? '').trim();
    if (!audioUrl) {
      return jsonError('Audio URL is required', 400);
    }

    const transcript = await transcribeAudioFromUrl(audioUrl);
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Transcript generation error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate transcript',
      500
    );
  }
}
