import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { generateGuidedRoleplay } from '@/lib/worksheets/roleplayOpenai';
import { normalizeRoleplayBanks, normalizeRoleplayLine, roleplayDifficulty, roleplayLevel, roleplayWordUse } from '@/lib/worksheets/roleplay';
import type { RoleplayBank, RoleplayLine } from '@/lib/worksheets/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'banks' ? 'banks' : 'conversation';
    const settingsRecord = body.settings && typeof body.settings === 'object' ? body.settings : {};
    const lines = Array.isArray(body.lines)
      ? body.lines
          .map((line: unknown) => normalizeRoleplayLine(line))
          .filter((line: RoleplayLine | null): line is RoleplayLine => Boolean(line))
      : [];
    const banks = normalizeRoleplayBanks(body.banks, false);
    const section = await generateGuidedRoleplay({
      topic: String(body.topic ?? ''),
      exchanges: Number(body.exchanges) || Math.max(4, Math.ceil(lines.length / 2)),
      mode,
      settings: {
        level: roleplayLevel(settingsRecord.level),
        objective: String(settingsRecord.objective ?? '').slice(0, 280),
        vocabulary: String(settingsRecord.vocabulary ?? '').slice(0, 800),
        grammar: String(settingsRecord.grammar ?? '').slice(0, 200),
        difficulty: roleplayDifficulty(settingsRecord.difficulty),
        wordUse: roleplayWordUse(settingsRecord.wordUse),
      },
      banks: banks as RoleplayBank[],
      lines,
    });
    return NextResponse.json({ section });
  } catch (error) {
    console.error('Regenerate roleplay error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to rebuild the roleplay', 500);
  }
}
