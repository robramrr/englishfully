import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { createEscapeRoom, listEscapeRooms } from '@/lib/escape-room/db';
import type { CreateEscapeRoomPayload } from '@/lib/escape-room/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const rooms = await listEscapeRooms();
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error('List escape rooms error:', error);
    return jsonError('Failed to load escape rooms', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    let payload: CreateEscapeRoomPayload = {};
    try {
      payload = (await request.json()) as CreateEscapeRoomPayload;
    } catch {
      payload = {};
    }
    const room = await createEscapeRoom(payload);
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Create escape room error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create escape room',
      500
    );
  }
}
