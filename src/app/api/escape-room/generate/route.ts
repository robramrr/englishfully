import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateEscapeRoomDraft } from '@/lib/escape-room/openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json();
    const topic = String(body.topic ?? body.worksheet ?? '').trim();
    if (!topic) {
      return jsonError('Enter a topic, mission brief, or worksheet text first.', 400);
    }
    const draft = await generateEscapeRoomDraft({
      topic,
      title: String(body.title ?? '').trim() || undefined,
      mission: String(body.mission ?? '').trim() || undefined,
      learning_objective: String(body.learning_objective ?? '').trim() || undefined,
      english_level: String(body.english_level ?? '').trim() || undefined,
      challenge_count: body.challenge_count,
      worksheet: String(body.worksheet ?? '').trim() || undefined,
      vocabulary: String(body.vocabulary ?? '').trim() || undefined,
      media_notes: String(body.media_notes ?? '').trim() || undefined,
    });
    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Escape room generate error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate escape room draft',
      500
    );
  }
}
