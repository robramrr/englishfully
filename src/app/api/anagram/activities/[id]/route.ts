import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteAnagramActivity,
  getAnagramActivity,
  upsertAnagramActivity,
} from '@/lib/anagram/db';
import { normalizeAnagramActivity, type AnagramActivity } from '@/lib/anagram/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const activity = await getAnagramActivity(context.params.id);
    if (!activity) return jsonError('Anagram activity not found', 404);
    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Get anagram activity error:', error);
    return jsonError('Failed to load anagram activity', 500);
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
    const activity = normalizeAnagramActivity({
      ...((body.activity || body) as AnagramActivity),
      id: context.params.id,
    });
    const saved = await upsertAnagramActivity(activity);
    return NextResponse.json({ activity: saved });
  } catch (error) {
    console.error('Update anagram activity error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update anagram activity',
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
    const deleted = await deleteAnagramActivity(context.params.id);
    if (!deleted) return jsonError('Anagram activity not found', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Delete anagram activity error:', error);
    return jsonError('Failed to delete anagram activity', 500);
  }
}
