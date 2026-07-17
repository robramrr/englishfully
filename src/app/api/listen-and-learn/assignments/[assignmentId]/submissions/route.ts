import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listLearnSubmissions } from '@/lib/listen-and-learn/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const submissions = await listLearnSubmissions(params.assignmentId);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('List listen-and-learn submissions error:', error);
    return jsonError('Failed to load submissions', 500);
  }
}
