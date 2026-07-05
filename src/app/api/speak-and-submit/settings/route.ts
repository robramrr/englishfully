import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getEntryConfig, saveEntryConfig } from '@/lib/speak-and-submit/settings';
import type { SaveEntryConfigPayload } from '@/lib/speak-and-submit/types';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const config = await getEntryConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get entry config error:', error);
    return jsonError('Failed to load student entry settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as SaveEntryConfigPayload;
    const config = await saveEntryConfig(body);
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Save entry config error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save student entry settings',
      500
    );
  }
}
