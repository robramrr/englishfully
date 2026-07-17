import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { createLearnAssignment, listLearnAssignments } from '@/lib/listen-and-learn/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const assignments = await listLearnAssignments();
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('List listen-and-learn error:', error);
    return jsonError('Failed to load assignments', 500);
  }
}

export async function POST(_request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const assignment = await createLearnAssignment();
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Create listen-and-learn error:', error);
    return jsonError('Failed to create assignment', 500);
  }
}
