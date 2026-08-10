import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { startEscapeProgress } from '@/lib/escape-room/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { roomId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json().catch(() => ({}));
    const progress = await startEscapeProgress({
      roomId: params.roomId,
      studentLabel: String((body as { student_label?: string }).student_label ?? ''),
      studentNumber: String((body as { student_number?: string }).student_number ?? ''),
      classNumber: String((body as { class_number?: string }).class_number ?? ''),
    });
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Escape room start error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to start mission',
      500
    );
  }
}
