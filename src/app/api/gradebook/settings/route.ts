import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getGradebookSettings, saveGradebookSettings } from '@/lib/gradebook/db';
import type { SaveGradebookSettingsPayload } from '@/lib/gradebook/types';
import { parseSemester } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const settings = await getGradebookSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get gradebook settings error:', error);
    return jsonError('Failed to load gradebook settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as SaveGradebookSettingsPayload;
    const settings = await saveGradebookSettings({
      school_year: body.school_year,
      active_semester: parseSemester(body.active_semester),
    });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Save gradebook settings error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save gradebook settings',
      500
    );
  }
}
