import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { getRequestOrigin, jsonError } from '@/lib/speak-and-submit/api';
import { getProjectByIdOrSlug, publishProject, unpublishProject } from '@/lib/projects/db';
import { getStudentProjectUrl } from '@/lib/projects/qr';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { projectId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const existing = await getProjectByIdOrSlug(params.projectId);
    if (!existing) return jsonError('Project not found', 404);
    const origin = getRequestOrigin(request);
    const shareUrl = getStudentProjectUrl(existing.slug, origin);
    const project = await publishProject(existing.id, shareUrl);
    return NextResponse.json({ project, studentUrl: shareUrl });
  } catch (error) {
    console.error('Publish project error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to publish project', 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const existing = await getProjectByIdOrSlug(params.projectId);
    if (!existing) return jsonError('Project not found', 404);
    const project = await unpublishProject(existing.id);
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Unpublish project error:', error);
    return jsonError('Failed to unpublish project', 500);
  }
}
