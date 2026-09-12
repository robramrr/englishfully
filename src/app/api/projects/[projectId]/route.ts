import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { deleteProject, getProjectByIdOrSlug, updateProject } from '@/lib/projects/db';
import type { SaveProjectPayload } from '@/lib/projects/types';

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
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return jsonError('Failed to load project', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const existing = await getProjectByIdOrSlug(params.projectId);
    if (!existing) return jsonError('Project not found', 404);
    const body = (await request.json()) as SaveProjectPayload;
    const project = await updateProject(existing.id, body);
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to save project', 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const existing = await getProjectByIdOrSlug(params.projectId);
    if (!existing) return jsonError('Project not found', 404);
    await deleteProject(existing.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return jsonError('Failed to delete project', 500);
  }
}
