import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteStudentProjectSubmission,
  getProjectByIdOrSlug,
  getPublicProject,
} from '@/lib/projects/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const publicProject = await getPublicProject(params.projectId);
    if (!publicProject) return jsonError('This project is not available yet.', 404);
    const project = await getProjectByIdOrSlug(publicProject.id);
    if (!project) return jsonError('Project not found', 404);

    const body = (await request.json()) as { student_number?: string; class_number?: string };
    const studentNumber = String(body.student_number ?? '').trim();
    const classNumber = String(body.class_number ?? '').trim();
    if (!studentNumber || !classNumber) {
      return jsonError('Student number and class are required', 400);
    }

    const deleted = await deleteStudentProjectSubmission(project.id, studentNumber, classNumber);
    if (!deleted) return jsonError('Submission not found', 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Student delete project submission error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to remove submission', 400);
  }
}
