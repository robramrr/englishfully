import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteEscapeRoom,
  duplicateEscapeRoom,
  getEscapeRoomById,
  updateEscapeRoom,
} from '@/lib/escape-room/db';
import type { UpdateEscapeRoomPayload } from '@/lib/escape-room/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { roomId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const room = await getEscapeRoomById(params.roomId);
    if (!room) return jsonError('Escape room not found', 404);
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Get escape room error:', error);
    return jsonError('Failed to load escape room', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const payload = (await request.json()) as UpdateEscapeRoomPayload;
    const room = await updateEscapeRoom(params.roomId, payload);
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Update escape room error:', error);
    const message = error instanceof Error ? error.message : 'Failed to update escape room';
    const status = message.includes('not found') ? 404 : 500;
    return jsonError(message, status);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const deleted = await deleteEscapeRoom(params.roomId);
    if (!deleted) return jsonError('Escape room not found', 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete escape room error:', error);
    return jsonError('Failed to delete escape room', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const action = String((body as { action?: string }).action ?? '').trim();
    if (action !== 'duplicate') {
      return jsonError('Unsupported action', 400);
    }
    const room = await duplicateEscapeRoom(params.roomId);
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Duplicate escape room error:', error);
    const message = error instanceof Error ? error.message : 'Failed to duplicate escape room';
    const status = message.includes('not found') ? 404 : 500;
    return jsonError(message, status);
  }
}
