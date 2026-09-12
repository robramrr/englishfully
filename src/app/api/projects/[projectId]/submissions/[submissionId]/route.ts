import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, getSubmissionForTeacher, reviewSubmission } from '@/lib/projects/db';
import type { ReviewSubmissionPayload } from '@/lib/projects/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string; submissionId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getProjectByIdOrSlug(params.projectId);
    if (!project) return jsonError('Project not found', 404);
    const submission = await getSubmissionForTeacher(project.id, params.submissionId);
    if (!submission) return jsonError('Submission not found', 404);
    return NextResponse.json({ project, submission });
  } catch (error) {
    console.error('Get project submission error:', error);
    return jsonError('Failed to load submission', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getProjectByIdOrSlug(params.projectId);
    if (!project) return jsonError('Project not found', 404);
    const body = (await request.json()) as ReviewSubmissionPayload;
    const rawScore = body.score as ReviewSubmissionPayload['score'] | string | undefined;
    const score =
      rawScore === undefined
        ? undefined
        : rawScore === null || (typeof rawScore === 'string' && rawScore.trim() === '')
          ? null
          : Number(rawScore);
    if (score !== undefined && score !== null && !Number.isFinite(score)) {
      return jsonError('Score must be a number', 400);
    }
    const submission = await reviewSubmission(project.id, params.submissionId, {
      teacher_feedback: body.teacher_feedback,
      score,
      mark_reviewed: body.mark_reviewed,
    });
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Review project submission error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to save review', 400);
  }
}
