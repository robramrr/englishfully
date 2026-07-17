import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { deleteGradeEntry, upsertGradeEntry } from '@/lib/gradebook/db';
import type { UpsertGradeEntryPayload } from '@/lib/gradebook/types';
import { parseSemester } from '@/lib/gradebook/types';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as UpsertGradeEntryPayload;
    const entry = await upsertGradeEntry({
      ...body,
      semester: parseSemester(body.semester),
    });
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Upsert grade entry error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save grade',
      400
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const entryId = request.nextUrl.searchParams.get('id');
    if (!entryId) return jsonError('Entry id is required', 400);
    const deleted = await deleteGradeEntry(entryId);
    if (!deleted) return jsonError('Grade entry not found', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete grade entry error:', error);
    return jsonError('Failed to delete grade', 500);
  }
}
