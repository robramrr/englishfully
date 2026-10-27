import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateVocabCards } from '@/lib/vocabulary/openai';
import {
  MAX_AI_CARDS,
  parseWordList,
  type VocabLevel,
} from '@/lib/vocabulary/types';

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
      : parseWordList(String(body.words ?? ''));
    const cards = await generateVocabCards({
      topic: String(body.topic ?? ''),
      words: words.slice(0, MAX_AI_CARDS),
      count: Number(body.count) || 8,
      level: (String(body.level || 'A2').toUpperCase() as VocabLevel) || 'A2',
      notes: String(body.notes ?? ''),
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Generate vocabulary error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create vocabulary cards',
      500
    );
  }
}
