import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getProjectByIdOrSlug,
  getPublicProject,
  saveComponentProgress,
} from '@/lib/projects/db';
import type { SaveComponentProgressPayload } from '@/lib/projects/types';

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

    const body = (await request.json()) as SaveComponentProgressPayload;
    if (!body.component_id || !body.student_number || !body.class_number) {
      return jsonError('Student number, class, and component are required', 400);
    }

    const submission = await saveComponentProgress(project, body);
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Save project component error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to save progress', 400);
  }
}
