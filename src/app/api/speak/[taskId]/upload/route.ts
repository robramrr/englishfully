import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { getTaskById } from '@/lib/speak-and-submit/db';
import { uploadAudioToR2 } from '@/lib/speak-and-submit/r2';

interface RouteParams {
  params: { taskId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const formData = await request.formData();
    const file = formData.get('file');
    const studentName = String(formData.get('student_name') ?? '').trim();
    const studentNumber = String(formData.get('student_number') ?? '').trim();
    const classNumber = String(formData.get('class_number') ?? '').trim();
    const itemIndexRaw = formData.get('item_index');

    if (!file || !(file instanceof Blob)) {
      return jsonError('Audio file is required', 400);
    }

    if (file.size === 0) {
      return jsonError('Audio file is empty', 400);
    }

    if (!studentName || !studentNumber || !classNumber) {
      return jsonError('Student name, number, and class are required', 400);
    }

    const itemIndex = Number.parseInt(String(itemIndexRaw ?? ''), 10);
    if (Number.isNaN(itemIndex) || itemIndex < 0) {
      return jsonError('Valid item index is required', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'audio/webm';
    const { url } = await uploadAudioToR2(
      {
        taskId: params.taskId,
        classNumber,
        studentNumber,
        studentName,
        itemIndex,
      },
      buffer,
      contentType
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error('R2 upload error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to upload audio',
      500
    );
  }
}
