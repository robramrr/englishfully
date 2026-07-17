import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getClassOverview } from '@/lib/gradebook/db';
import { parseSemester } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const semesterParam = request.nextUrl.searchParams.get('semester');
    const schoolYear = request.nextUrl.searchParams.get('school_year') || undefined;
    const semester = semesterParam ? parseSemester(semesterParam) : undefined;
    const overview = await getClassOverview(semester, schoolYear);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Gradebook overview error:', error);
    return jsonError('Failed to load gradebook overview', 500);
  }
}
