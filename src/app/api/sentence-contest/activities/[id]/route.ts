import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteSentenceContest,
  getSentenceContest,
  upsertSentenceContest,
} from '@/lib/sentence-contest/db';
import {
  normalizeSentenceContest,
  type SentenceContestActivity,
} from '@/lib/sentence-contest/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const activity = await getSentenceContest(context.params.id);
    if (!activity) return jsonError('Sentence contest not found', 404);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get sentence contest error:', error);
    return jsonError('Failed to load sentence contest', 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json();
    const activity = normalizeSentenceContest({
      ...((body.activity || body) as SentenceContestActivity),
      id: context.params.id,
    });
    const saved = await upsertSentenceContest(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Update sentence contest error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update sentence contest',
      500
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const deleted = await deleteSentenceContest(context.params.id);
    if (!deleted) return jsonError('Sentence contest not found', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete sentence contest error:', error);
    return jsonError('Failed to delete sentence contest', 500);
  }
}
