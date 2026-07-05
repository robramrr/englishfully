import { NextRequest, NextResponse } from 'next/server';
import { createSubmissions, getTaskById, getTaskItems } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';
import type { SubmitPayload } from '@/lib/speak-and-submit/types';

interface RouteParams {
  params: { taskId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const body = (await request.json()) as SubmitPayload;

    if (!body.student_name?.trim() || !body.student_number?.trim() || !body.class_number?.trim()) {
      return jsonError('Student name, number, and class are required', 400);
    }

    if (!Array.isArray(body.recordings) || body.recordings.length === 0) {
      return jsonError('At least one recording is required', 400);
    }

    const items = await getTaskItems(params.taskId);
    if (body.recordings.length !== items.length) {
      return jsonError('Please submit a recording for every item', 400);
    }

    for (const recording of body.recordings) {
      if (!recording.audio_url?.trim()) {
        return jsonError('Each recording must include an audio URL', 400);
      }
    }

    const count = await createSubmissions(params.taskId, body);
    return NextResponse.json({ success: true, submittedCount: count });
  } catch (error) {
    console.error('Submit recordings error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit recordings';
    if (message.includes('already submitted')) {
      return jsonError(message, 409);
    }
    return jsonError(message, 500);
  }
}
