import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getGradebookSettingsBySlug,
  listPublicGradeClasses,
} from '@/lib/gradebook/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { schoolSlug: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const settings = await getGradebookSettingsBySlug(params.schoolSlug);
    if (!settings) {
      return jsonError('School grades page not found', 404);
    }

    const classes = await listPublicGradeClasses(settings.teacher_id);
    return NextResponse.json(
      {
        school_name: settings.school_name || settings.grades_slug,
        school_year: settings.school_year,
        grades_slug: settings.grades_slug,
        classes,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Public grade classes error:', error);
    return jsonError('Failed to load classes', 500);
  }
}
