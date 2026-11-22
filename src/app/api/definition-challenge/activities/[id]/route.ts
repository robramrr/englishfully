import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteChallengeActivity,
  getChallengeActivity,
  upsertChallengeActivity,
} from '@/lib/definition-challenge/db';
import {
  normalizeChallengeActivity,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const activity = await getChallengeActivity(context.params.id);
    if (!activity) return jsonError('Definition challenge not found', 404);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get definition challenge error:', error);
    return jsonError('Failed to load the definition challenge', 500);
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
    const activity = normalizeChallengeActivity({
      ...((body.activity || body) as DefinitionChallengeActivity),
      id: context.params.id,
    });
    const saved = await upsertChallengeActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Update definition challenge error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save the definition challenge',
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
    const deleted = await deleteChallengeActivity(context.params.id);
    if (!deleted) return jsonError('Definition challenge not found', 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete definition challenge error:', error);
    return jsonError('Failed to delete the definition challenge', 500);
  }
}
