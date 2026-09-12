import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { createProject, listProjects } from '@/lib/projects/db';
import type { CreateProjectPayload } from '@/lib/projects/types';

export const dynamic = 'force-dynamic';

function validateCreate(body: CreateProjectPayload): string | null {
  if (!body.title?.trim()) return 'Project title is required';
  if (!body.class_name?.trim()) return 'Class is required';
  if (!body.worksheet_enabled && !body.artwork_enabled && !body.speaking_enabled) {
    return 'Enable at least one project component';
  }
  return null;
}

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return jsonError('Failed to load projects', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as CreateProjectPayload;
    const validationError = validateCreate(body);
    if (validationError) return jsonError(validationError, 400);

    const project = await createProject({
      title: body.title,
      description: body.description || '',
      class_name: body.class_name,
      due_date: body.due_date || null,
      worksheet_enabled: Boolean(body.worksheet_enabled),
      artwork_enabled: Boolean(body.artwork_enabled),
      speaking_enabled: Boolean(body.speaking_enabled),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to create project', 500);
  }
}
