import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { awardSentenceContest } from '@/lib/sentence-contest/openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const prompt = String(body.prompt ?? '');
    const criteria = String(body.criteria ?? '').trim();
    const grammarTarget = String(body.grammar_target ?? body.grammarTarget ?? '').trim();
    const sentences = Array.isArray(body.sentences)
      ? body.sentences.map((item: unknown) => String(item ?? '').trim()).filter(Boolean)
      : [];

    if (!criteria) {
      return jsonError('Say how the AI should award the winner.', 400);
    }
    if (sentences.length < 2) {
      return jsonError('Add at least two sentences before awarding a winner.', 400);
    }
    if (sentences.length > 12) {
      return jsonError('Award from 12 sentences or fewer.', 400);
    }

    const result = await awardSentenceContest({
      prompt,
      criteria,
      grammarTarget,
      sentences,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sentence contest error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to award a winner',
      500
    );
  }
}
