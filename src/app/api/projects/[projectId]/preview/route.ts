import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getTeacherPreviewProject } from '@/lib/projects/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const project = await getTeacherPreviewProject(params.projectId);
    if (!project) return jsonError('Project not found', 404);
    return NextResponse.json({ project, preview: true });
  } catch (error) {
    console.error('Preview project error:', error);
    return jsonError('Failed to load project preview', 500);
  }
}
