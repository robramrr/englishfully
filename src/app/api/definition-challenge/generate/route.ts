import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { defineChallengeWords, suggestChallengeWords } from '@/lib/definition-challenge/openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const mode = String(body.mode || 'definitions');
    const topic = String(body.topic ?? '');
    const level = String(body.level || 'A2');
    const otherWords = Array.isArray(body.otherWords) ? body.otherWords.map(String) : [];

    if (mode === 'words') {
      const words = await suggestChallengeWords({
        topic,
        level,
        count: Number(body.count) || 8,
        avoidWords: Array.isArray(body.avoidWords) ? body.avoidWords.map(String) : [],
      });
      return NextResponse.json({ words });
    }

    const words = await defineChallengeWords({
      topic,
      level,
      words: Array.isArray(body.words) ? body.words.map(String) : [String(body.word ?? '')],
      otherWords,
    });
    return NextResponse.json({ definitions: words });
  } catch (error) {
    console.error('Generate definition challenge error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to write the definitions',
      500
    );
  }
}
