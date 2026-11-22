import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateWorksheet } from '@/lib/worksheets/openai';
import { emptyRoleplaySettings, roleplayDifficulty, roleplayLevel, roleplayWordUse } from '@/lib/worksheets/roleplay';
import {
  exerciseCountMax,
  exerciseCountMin,
  isWorksheetExerciseType,
  VOCAB_LEVELS,
  WORKSHEET_EXERCISES,
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
    const fallback = type === 'guided_roleplay' ? 8 : 4;
    const count = Math.max(
      exerciseCountMin(type),
      Math.min(exerciseCountMax(type), Math.round(Number(record.count) || fallback))
    );
    seen.add(type);
    exercises.push({ type, count });
    if (exercises.length >= WORKSHEET_EXERCISES.length) break;
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
    const roleplay = body.roleplay && typeof body.roleplay === 'object' ? body.roleplay : {};
    const worksheet = await generateWorksheet({
      source: String(body.source ?? ''),
      level: safeLevel,
      exercises: parseExercises(body.exercises),
      roleplay: {
        ...emptyRoleplaySettings(safeLevel === 'C1' ? 'C1' : safeLevel),
        level: roleplayLevel(roleplay.level, safeLevel === 'C1' ? 'C1' : safeLevel),
        objective: String(roleplay.objective ?? '').slice(0, 280),
        vocabulary: String(roleplay.vocabulary ?? '').slice(0, 800),
        grammar: String(roleplay.grammar ?? '').slice(0, 200),
        difficulty: roleplayDifficulty(roleplay.difficulty),
        wordUse: roleplayWordUse(roleplay.wordUse),
      },
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
