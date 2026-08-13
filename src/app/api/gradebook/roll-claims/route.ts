import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { clearRollClaims, listRollClaims, listRosterRollsBySeat } from '@/lib/gradebook/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const [claims, roster_rolls] = await Promise.all([
      listRollClaims(),
      listRosterRollsBySeat(),
    ]);
    return NextResponse.json({ claims, roster_rolls });
  } catch (error) {
    console.error('List roll claims error:', error);
    return jsonError('Failed to load claimed roll numbers', 500);
  }
}

export async function DELETE() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const deleted = await clearRollClaims();
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error('Clear roll claims error:', error);
    return jsonError('Failed to clear claimed roll numbers', 500);
  }
}
