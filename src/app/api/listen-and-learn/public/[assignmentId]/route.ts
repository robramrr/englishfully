import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { countLearnAttempts, getPublicLearnAssignment } from '@/lib/listen-and-learn/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const assignment = await getPublicLearnAssignment(params.assignmentId);
    if (!assignment) return jsonError('Assignment not found', 404);

    const studentNumber = request.nextUrl.searchParams.get('student_number') || '';
    const classNumber = request.nextUrl.searchParams.get('class_number') || '';
    let attemptsUsed = 0;
    if (studentNumber && classNumber) {
      attemptsUsed = await countLearnAttempts(params.assignmentId, studentNumber, classNumber);
    }

    return NextResponse.json({
      assignment,
      attempts_used: attemptsUsed,
      attempts_remaining: Math.max(0, assignment.attempts_allowed - attemptsUsed),
    });
  } catch (error) {
    console.error('Public listen-and-learn error:', error);
    return jsonError('Failed to load assessment', 500);
  }
}
