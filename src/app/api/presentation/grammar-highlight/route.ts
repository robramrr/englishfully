import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { findGrammarMatches } from '@/lib/presentation/openai';
import { buildGrammarHighlightSpans } from '@/lib/presentation/grammarHighlight';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = await request.json();
    const text = String(body.text ?? '');
    const grammarTarget = String(body.grammar_target ?? body.grammarTarget ?? '').trim();

    if (!grammarTarget) {
      return jsonError('Enter a target grammar concept first.', 400);
    }
    if (!text.trim()) {
      return NextResponse.json({ matches: [], spans: [] });
    }

    const matches = await findGrammarMatches({ text, grammarTarget });
    const spans = buildGrammarHighlightSpans(text, matches);
    return NextResponse.json({ matches, spans });
  } catch (error) {
    console.error('Grammar highlight error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to highlight grammar',
      500
    );
  }
}
