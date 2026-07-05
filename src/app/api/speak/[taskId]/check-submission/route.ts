import { NextRequest, NextResponse } from 'next/server';
import { submissionExists, taskExists } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';
import { normalizeStudentNumber } from '@/lib/speak-and-submit/types';

interface RouteParams {
  params: { taskId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const exists = await taskExists(params.taskId);
    if (!exists) return jsonError('Task not found', 404);

    const body = await request.json();
    const studentNumber = normalizeStudentNumber(String(body.student_number ?? ''));
    const classNumber = String(body.class_number ?? '').trim();

    if (!studentNumber || !classNumber) {
      return jsonError('Student number and class are required', 400);
    }

    const alreadySubmitted = await submissionExists(params.taskId, studentNumber, classNumber);
    return NextResponse.json({ alreadySubmitted });
  } catch (error) {
    console.error('Check submission error:', error);
    return jsonError('Failed to check submission status', 500);
  }
}
