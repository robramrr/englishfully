import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listAnagramActivities, upsertAnagramActivity } from '@/lib/anagram/db';
import {
  createEmptyAnagramActivity,
  normalizeAnagramActivity,
  type AnagramActivity,
} from '@/lib/anagram/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const activities = await listAnagramActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('List anagram activities error:', error);
    return jsonError('Failed to list anagram activities', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body.activity || body) as Partial<AnagramActivity>;
    const isCreateOnly = body.create === true || (!raw.words && !body.activity);
    const activity = normalizeAnagramActivity(
      isCreateOnly
        ? {
            ...createEmptyAnagramActivity(),
            title: String(body.title || ''),
            topic: String(body.topic || ''),
            level: body.level,
          }
        : raw
    );
    const saved = await upsertAnagramActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Save anagram activity error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save anagram activity',
      500
    );
  }
}
