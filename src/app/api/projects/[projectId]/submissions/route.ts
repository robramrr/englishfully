import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  createManualTeacherSubmission,
  getProjectByIdOrSlug,
  listProjectSubmissions,
} from '@/lib/projects/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getProjectByIdOrSlug(params.projectId);
    if (!project) return jsonError('Project not found', 404);
    const submissions = await listProjectSubmissions(project.id);
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('List project submissions error:', error);
    return jsonError('Failed to load submissions', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getProjectByIdOrSlug(params.projectId);
    if (!project) return jsonError('Project not found', 404);
    const body = await request.json();
    const submission = await createManualTeacherSubmission(project, {
      class_number: String(body.class_number ?? ''),
      student_numbers: String(body.student_numbers ?? ''),
      component_ids: Array.isArray(body.component_ids) ? body.component_ids.map(String) : [],
      delivery:
        body.delivery === 'file_upload'
          ? 'file_upload'
          : body.delivery === 'in_person'
            ? 'in_person'
            : 'line',
      status: 'submitted',
    });
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Create manual project submission error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to add submission', 400);
  }
}
