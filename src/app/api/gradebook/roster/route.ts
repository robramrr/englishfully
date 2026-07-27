import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { upsertRosterRoll } from '@/lib/gradebook/db';
import type { UpsertRosterRollPayload } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as UpsertRosterRollPayload;
    const result = await upsertRosterRoll(body);
    return NextResponse.json({ roster: result });
  } catch (error) {
    console.error('Upsert roster roll error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save roll number',
      400
    );
  }
}
