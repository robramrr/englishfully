import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { duplicateAssignment } from '@/lib/listen-and-answer/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string };
}

export async function POST(_request: Request, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const assignment = await duplicateAssignment(params.assignmentId);
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Duplicate listen assignment error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to duplicate assignment',
      500
    );
  }
}
