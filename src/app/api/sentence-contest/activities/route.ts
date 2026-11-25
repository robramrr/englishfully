import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listSentenceContests, upsertSentenceContest } from '@/lib/sentence-contest/db';
import {
  createEmptySentenceContest,
  normalizeSentenceContest,
  type SentenceContestActivity,
} from '@/lib/sentence-contest/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const activities = await listSentenceContests();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('List sentence contests error:', error);
    return jsonError('Failed to list sentence contests', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body.activity || body) as Partial<SentenceContestActivity>;
    const isCreateOnly = body.create === true || !body.activity;
    const activity = normalizeSentenceContest(
      isCreateOnly
        ? {
            ...createEmptySentenceContest(),
            title: String(body.title || ''),
            prompt: String(body.prompt || ''),
            criteria: String(body.criteria || ''),
            grammarTarget: String(body.grammarTarget || body.grammar_target || ''),
          }
        : raw
    );
    const saved = await upsertSentenceContest(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Save sentence contest error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save sentence contest',
      500
    );
  }
}
