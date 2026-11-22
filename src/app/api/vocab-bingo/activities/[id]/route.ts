import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteBingoActivity,
  getBingoActivity,
  upsertBingoActivity,
} from '@/lib/vocab-bingo/db';
import { normalizeBingoActivity, type VocabBingoActivity } from '@/lib/vocab-bingo/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const activity = await getBingoActivity(context.params.id);
    if (!activity) return jsonError('Vocabulary bingo activity not found', 404);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get vocab bingo error:', error);
    return jsonError('Failed to load vocabulary bingo', 500);
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
    const activity = normalizeBingoActivity({
      ...((body.activity || body) as VocabBingoActivity),
      id: context.params.id,
    });
    const saved = await upsertBingoActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Update vocab bingo error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update vocabulary bingo',
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
    const deleted = await deleteBingoActivity(context.params.id);
    if (!deleted) return jsonError('Vocabulary bingo activity not found', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete vocab bingo error:', error);
    return jsonError('Failed to delete vocabulary bingo', 500);
  }
}
