import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listChallengeActivities, upsertChallengeActivity } from '@/lib/definition-challenge/db';
import {
  createEmptyChallengeActivity,
  normalizeChallengeActivity,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const activities = await listChallengeActivities();
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('List definition challenge error:', error);
    return jsonError('Failed to list definition challenges', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const raw = (body.activity || body) as Partial<DefinitionChallengeActivity>;
    const isCreateOnly = body.create === true || !body.activity;
    const activity = normalizeChallengeActivity(
      isCreateOnly
        ? {
            ...createEmptyChallengeActivity(),
            title: String(body.title || ''),
            topic: String(body.topic || ''),
            level: body.level,
          }
        : raw
    );
    const saved = await upsertChallengeActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Save definition challenge error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save the definition challenge',
      500
    );
  }
}
