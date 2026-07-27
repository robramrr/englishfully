import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  countLearnAttempts,
  ensureLearnSchema,
  getPublicLearnAssignment,
  hasPassingLearnSubmission,
} from '@/lib/listen-and-learn/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: { assignmentId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Hard repair for the stuck makeup assignment — only while still on create defaults.
    if (params.assignmentId === 'GPTNpBIRmjfS-GP6PSyll') {
      await ensureLearnSchema();
      await sql`
        UPDATE learn_assignments
        SET
          title = 'Listen',
          teacher_name = 'Ro',
          updated_at = NOW()
        WHERE id = ${params.assignmentId}
          AND (
            title = 'Untitled Listen & Learn'
            OR title = ''
            OR teacher_name = 'T Robert'
          )
      `;
    }

    const assignment = await getPublicLearnAssignment(params.assignmentId);
    if (!assignment) return jsonError('Assignment not found', 404);

    const studentNumber = request.nextUrl.searchParams.get('student_number') || '';
    const classNumber = request.nextUrl.searchParams.get('class_number') || '';
    let attemptsUsed = 0;
    let alreadyPassed = false;
    if (studentNumber && classNumber) {
      attemptsUsed = await countLearnAttempts(params.assignmentId, studentNumber, classNumber);
      alreadyPassed = await hasPassingLearnSubmission(
        params.assignmentId,
        studentNumber,
        classNumber,
        assignment.passing_score
      );
    }

    const attemptsRemaining = alreadyPassed
      ? 0
      : Math.max(0, assignment.attempts_allowed - attemptsUsed);

    return NextResponse.json(
      {
        assignment,
        attempts_used: attemptsUsed,
        attempts_remaining: attemptsRemaining,
        already_passed: alreadyPassed,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Public listen-and-learn error:', error);
    return jsonError('Failed to load assessment', 500);
  }
}
