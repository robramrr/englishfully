import { NextResponse } from 'next/server';
import { getCloudinaryUploadParams } from '@/lib/speak-and-submit/cloudinary';
import { taskExists } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const exists = await taskExists(params.taskId);
    if (!exists) return jsonError('Task not found', 404);

    const uploadParams = getCloudinaryUploadParams(params.taskId);
    return NextResponse.json(uploadParams);
  } catch (error) {
    console.error('Upload params error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to prepare upload',
      500
    );
  }
}
