import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, listProjectSubmissions } from '@/lib/projects/db';

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
