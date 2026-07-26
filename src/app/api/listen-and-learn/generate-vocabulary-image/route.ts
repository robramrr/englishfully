import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { upsertLearnVocabularyImage } from '@/lib/listen-and-learn/db';
import { generateAndStoreVocabularyImage } from '@/lib/listen-and-learn/openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const word = String(body.word ?? '').trim();
    const assignmentId = String(body.assignment_id ?? '').trim();
    const definition = String(body.definition ?? '').trim();
    const vocabularyId = String(body.vocabulary_id ?? '').trim();

    if (!word) return jsonError('Word is required', 400);
    if (!assignmentId) return jsonError('Assignment id is required', 400);

    const imageUrl = await generateAndStoreVocabularyImage({
      assignmentId,
      word,
      definition,
    });

    // Write image_url into DB immediately (by id, by word, or insert a row).
    await upsertLearnVocabularyImage({
      assignmentId,
      vocabularyId: vocabularyId || word,
      word,
      definition,
      imageUrl,
    });

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Listen & Learn vocabulary image error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate vocabulary image',
      500
    );
  }
}
