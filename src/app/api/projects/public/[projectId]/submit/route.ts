import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, getPublicProject, submitProject } from '@/lib/projects/db';
import type { SubmitProjectPayload } from '@/lib/projects/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const publicProject = await getPublicProject(params.projectId);
    if (!publicProject) return jsonError('This project is not available yet.', 404);
    const project = await getProjectByIdOrSlug(publicProject.id);
    if (!project) return jsonError('Project not found', 404);

    const body = (await request.json()) as SubmitProjectPayload;
    if (!body.student_number || !body.class_number) {
      return jsonError('Student number and class are required', 400);
    }

    const submission = await submitProject(project, body.student_number, body.class_number);
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Submit project error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to submit project', 400);
  }
}
