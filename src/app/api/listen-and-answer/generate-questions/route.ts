import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateListeningQuestions } from '@/lib/listen-and-answer/openai';
import type { AiQuestionPart, CefrLevel } from '@/lib/listen-and-answer/types';
import { CEFR_LEVELS } from '@/lib/listen-and-answer/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const transcript = String(body.transcript ?? '').trim();
    const framework = String(body.framework ?? 'American English File').trim();
    const part = body.part as AiQuestionPart;
    const cefrLevels = Array.isArray(body.cefr_levels)
      ? (body.cefr_levels as CefrLevel[]).filter((level) => CEFR_LEVELS.includes(level))
      : [];

    if (!transcript) {
      return jsonError('Transcript is required. Generate or enter a transcript first.', 400);
    }
    if (part !== 'A' && part !== 'B') {
      return jsonError('Question part must be A or B', 400);
    }
    if (cefrLevels.length === 0) {
      return jsonError('Select at least one CEFR level', 400);
    }

    const questions = await generateListeningQuestions({
      transcript,
      framework,
      cefrLevels,
      part,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Question generation error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate questions',
      500
    );
  }
}
