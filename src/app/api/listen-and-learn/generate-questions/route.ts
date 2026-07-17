import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateQuestionsForSegments } from '@/lib/listen-and-learn/openai';
import type { CefrLevel } from '@/lib/listen-and-answer/types';
import type { LearnDifficulty } from '@/lib/listen-and-learn/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const segments = Array.isArray(body.segments) ? body.segments : [];
    const selected = segments.filter(
      (segment: { selected?: boolean; sentence_text?: string }) =>
        segment.selected !== false && String(segment.sentence_text ?? '').trim()
    );

    if (selected.length === 0) {
      return jsonError('Select at least one listening segment', 400);
    }

    const limit = Math.max(1, Number(body.question_count) || selected.length);
    const questions = await generateQuestionsForSegments({
      framework: String(body.framework ?? 'American English File'),
      cefrLevel: (body.cefr_level as CefrLevel) || 'A2',
      difficulty: (body.difficulty as LearnDifficulty) || 'medium',
      segments: selected.map((segment: { sentence_text: string }) => ({
        sentence_text: String(segment.sentence_text),
      })),
      limit,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Listen & Learn generate error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate questions',
      500
    );
  }
}
