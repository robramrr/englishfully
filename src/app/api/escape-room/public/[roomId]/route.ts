import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getPublishedEscapeRoomById } from '@/lib/escape-room/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { roomId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const room = await getPublishedEscapeRoomById(params.roomId);
    if (!room) return jsonError('Escape room not found', 404);

    // Do not expose final_code to the client until they attempt the lock
    // (player checks via submit API). Still send challenge content for play.
    return NextResponse.json({
      room: {
        ...room,
        final_code: '',
      },
    });
  } catch (error) {
    console.error('Public escape room error:', error);
    return jsonError('Failed to load escape room', 500);
  }
}
