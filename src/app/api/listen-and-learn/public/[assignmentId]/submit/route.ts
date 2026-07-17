import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/speak-and-submit/api';
import { submitLearnAssignment } from '@/lib/listen-and-learn/db';
import type { SubmitLearnPayload } from '@/lib/listen-and-learn/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = (await request.json()) as SubmitLearnPayload;
    const submission = await submitLearnAssignment(params.assignmentId, body);
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Submit listen-and-learn error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to submit assessment',
      400
    );
  }
}
