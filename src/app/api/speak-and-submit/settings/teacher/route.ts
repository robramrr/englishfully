import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { saveTeacherName } from '@/lib/speak-and-submit/settings';

export async function PUT(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const teacherName = String(body.teacher_name ?? '').trim();
    if (!teacherName) {
      return jsonError('Teacher name is required', 400);
    }

    const savedName = await saveTeacherName(teacherName);
    return NextResponse.json({ teacher_name: savedName });
  } catch (error) {
    console.error('Save teacher name error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save teacher settings',
      500
    );
  }
}
