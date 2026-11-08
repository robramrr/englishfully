import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateWorksheet } from '@/lib/worksheets/openai';
import {
  isWorksheetExerciseType,
  VOCAB_LEVELS,
  type WorksheetExerciseRequest,
  type WorksheetLevel,
} from '@/lib/worksheets/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function parseExercises(value: unknown): WorksheetExerciseRequest[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const exercises: WorksheetExerciseRequest[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as { type?: unknown; count?: unknown };
    const type = String(record.type ?? '');
    if (!isWorksheetExerciseType(type) || seen.has(type)) continue;
    const count = Math.max(3, Math.min(8, Math.round(Number(record.count) || 4)));
    seen.add(type);
    exercises.push({ type, count });
    if (exercises.length >= 6) break;
  }
  return exercises;
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const level = String(body.level || 'A2').toUpperCase();
    const safeLevel = (VOCAB_LEVELS as readonly string[]).includes(level)
      ? (level as WorksheetLevel)
      : 'A2';
    const worksheet = await generateWorksheet({
      source: String(body.source ?? ''),
      level: safeLevel,
      exercises: parseExercises(body.exercises),
    });
    return NextResponse.json(worksheet);
  } catch (error) {
    console.error('Generate worksheet error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create the worksheet',
      500
    );
  }
}
