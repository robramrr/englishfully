import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getClassGradebook } from '@/lib/gradebook/db';
import { parseSemester } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { classId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const semesterParam = request.nextUrl.searchParams.get('semester');
    const schoolYear = request.nextUrl.searchParams.get('school_year') || undefined;
    const semester = semesterParam ? parseSemester(semesterParam) : undefined;
    const data = await getClassGradebook(params.classId, semester, schoolYear);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Gradebook class error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to load class gradebook',
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    );
  }
}
