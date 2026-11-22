import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  generateBingoDistractors,
  generateBingoSet,
  regenerateBingoDefinition,
  regenerateBingoWord,
} from '@/lib/vocab-bingo/openai';
import type { BingoGridSize } from '@/lib/vocab-bingo/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const mode = String(body.mode || 'activity');
    const topic = String(body.topic ?? '');
    const level = String(body.level || 'A2');
    const definitionStyle = String(body.definitionStyle || 'standard');
    const gridSize: BingoGridSize = Number(body.gridSize) === 5 ? 5 : 4;

    if (mode === 'word') {
      const word = await regenerateBingoWord({
        topic,
        level,
        definitionStyle,
        avoidWords: Array.isArray(body.avoidWords) ? body.avoidWords.map(String) : [],
      });
      return NextResponse.json({ word });
    }

    if (mode === 'definition') {
      const definition = await regenerateBingoDefinition({
        topic,
        level,
        definitionStyle,
        word: String(body.word ?? ''),
      });
      return NextResponse.json({ definition });
    }

    if (mode === 'distractors') {
      const distractors = await generateBingoDistractors({
        topic,
        words: Array.isArray(body.words) ? body.words.map(String) : [],
        count: Number(body.count) || 6,
      });
      return NextResponse.json({ distractors });
    }

    const generated = await generateBingoSet({
      topic,
      level,
      wordCount: Number(body.wordCount) || 10,
      gridSize,
      definitionStyle,
    });
    return NextResponse.json(generated);
  } catch (error) {
    console.error('Generate vocab bingo error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate vocabulary bingo',
      500
    );
  }
}
