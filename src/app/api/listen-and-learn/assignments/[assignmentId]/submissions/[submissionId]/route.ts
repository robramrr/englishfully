import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { deleteLearnSubmission } from '@/lib/listen-and-learn/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string; submissionId: string };
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const deleted = await deleteLearnSubmission(params.assignmentId, params.submissionId);
    if (!deleted) {
      return jsonError('Submission not found', 404);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete listen-and-learn submission error:', error);
    return jsonError('Failed to delete submission', 500);
  }
}
