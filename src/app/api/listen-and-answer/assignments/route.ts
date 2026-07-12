import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { createAssignment, listAssignments } from '@/lib/listen-and-answer/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const assignments = await listAssignments();
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('List listen assignments error:', error);
    return jsonError('Failed to load assignments', 500);
  }
}

export async function POST(_request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const assignment = await createAssignment();
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Create listen assignment error:', error);
    return jsonError('Failed to create assignment', 500);
  }
}
