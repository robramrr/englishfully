import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { sanitizePathSegment, uploadBinaryToR2 } from '@/lib/speak-and-submit/r2';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function extensionForImage(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const deckId = String(formData.get('deck_id') ?? '').trim() || 'deck';
    const word = String(formData.get('word') ?? 'word').trim() || 'word';

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
    const key = `vocabulary/${sanitizePathSegment(deckId)}/${sanitizePathSegment(word)}-${Date.now()}.${extensionForImage(contentType)}`;
    const uploaded = await uploadBinaryToR2({
      key,
      buffer,
      contentType,
    });

    return NextResponse.json({ image_url: uploaded.url });
  } catch (error) {
    console.error('Vocabulary image upload error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to upload picture',
      500
    );
  }
}
