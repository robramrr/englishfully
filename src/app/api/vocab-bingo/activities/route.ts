import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listBingoActivities, upsertBingoActivity } from '@/lib/vocab-bingo/db';
import {
  createEmptyBingoActivity,
  normalizeBingoActivity,
  type VocabBingoActivity,
} from '@/lib/vocab-bingo/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const activities = await listBingoActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('List vocab bingo error:', error);
    return jsonError('Failed to list vocabulary bingo activities', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body.activity || body) as Partial<VocabBingoActivity>;
    const isCreateOnly = body.create === true || (!raw.words && !body.activity);
    const activity = normalizeBingoActivity(
      isCreateOnly
        ? {
            ...createEmptyBingoActivity(),
            title: String(body.title || ''),
            topic: String(body.topic || ''),
            level: body.level,
            wordCount: body.wordCount,
            gridSize: body.gridSize,
            definitionStyle: body.definitionStyle,
          }
        : raw
    );
    const saved = await upsertBingoActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Save vocab bingo error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save vocabulary bingo',
      500
    );
  }
}
