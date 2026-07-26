import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { uploadVocabularyImageToR2 } from '@/lib/speak-and-submit/r2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const assignmentId = String(formData.get('assignment_id') ?? '').trim();
    const word = String(formData.get('word') ?? 'word').trim() || 'word';

    if (!assignmentId) return jsonError('Assignment id is required', 400);
    if (!file || !(file instanceof Blob)) {
      return jsonError('Image file is required', 400);
    }
    if (file.size === 0) return jsonError('Image file is empty', 400);
    if (file.size > 8 * 1024 * 1024) {
      return jsonError('Image must be 8MB or smaller', 400);
    }

    const contentType = file.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return jsonError('File must be an image', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadVocabularyImageToR2({
      assignmentId,
      word,
      buffer,
      contentType,
    });

    return NextResponse.json({ image_url: uploaded.url });
  } catch (error) {
    console.error('Listen & Learn vocabulary upload error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to upload vocabulary image',
      500
    );
  }
}
