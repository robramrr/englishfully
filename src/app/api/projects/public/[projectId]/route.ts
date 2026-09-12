import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { findStudentSubmission, getPublicProject } from '@/lib/projects/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: { projectId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const project = await getPublicProject(params.projectId);
    if (!project) return jsonError('This project is not available yet.', 404);

    const studentNumber = request.nextUrl.searchParams.get('student_number') || '';
    const classNumber = request.nextUrl.searchParams.get('class_number') || '';
    const submission =
      studentNumber && classNumber
        ? await findStudentSubmission(project.id, studentNumber, classNumber)
        : null;

    return NextResponse.json(
      { project, submission },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error) {
    console.error('Public project error:', error);
    return jsonError('Failed to load project', 500);
  }
}
