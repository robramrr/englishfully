import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, getPublicProject, startOrResumeSubmission } from '@/lib/projects/db';
import type { StartProjectPayload } from '@/lib/projects/types';

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

    const body = (await request.json()) as StartProjectPayload;
    const submission = await startOrResumeSubmission(project, body);
    return NextResponse.json({ project: publicProject, submission });
  } catch (error) {
    console.error('Start project error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to start project', 400);
  }
}
