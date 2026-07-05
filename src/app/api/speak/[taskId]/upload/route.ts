import { NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { taskExists } from '@/lib/speak-and-submit/db';
import { uploadAudioToR2 } from '@/lib/speak-and-submit/r2';

interface RouteParams {
  params: { taskId: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const exists = await taskExists(params.taskId);
    if (!exists) return jsonError('Task not found', 404);

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return jsonError('Audio file is required', 400);
    }

    if (file.size === 0) {
      return jsonError('Audio file is empty', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'audio/webm';
    const { url } = await uploadAudioToR2(params.taskId, buffer, contentType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('R2 upload error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to upload audio',
      500
    );
  }
}
