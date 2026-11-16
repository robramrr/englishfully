import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateAnagramWords } from '@/lib/anagram/openai';
import {
  MAX_AI_ANAGRAM_WORDS,
  parseAnagramWordList,
  type AnagramLevel,
} from '@/lib/anagram/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const words = Array.isArray(body.words)
      ? body.words.map((word: unknown) => String(word ?? ''))
      : parseAnagramWordList(String(body.words ?? ''));
    const generated = await generateAnagramWords({
      topic: String(body.topic ?? ''),
      words: words.slice(0, MAX_AI_ANAGRAM_WORDS),
      count: Number(body.count) || 8,
      level: (String(body.level || 'A2').toUpperCase() as AnagramLevel) || 'A2',
      notes: String(body.notes ?? ''),
    });
    return NextResponse.json({ words: generated });
  } catch (error) {
    console.error('Generate anagram error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create anagram words',
      500
    );
  }
}
