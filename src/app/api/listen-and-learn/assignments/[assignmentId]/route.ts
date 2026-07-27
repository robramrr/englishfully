import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  deleteLearnAssignment,
  getLearnAssignmentById,
  saveLearnAssignment,
  saveLearnAssignmentIdentity,
} from '@/lib/listen-and-learn/db';
import type { SaveLearnAssignmentPayload } from '@/lib/listen-and-learn/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { assignmentId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const assignment = await getLearnAssignmentById(params.assignmentId);
    if (!assignment) return jsonError('Assignment not found', 404);
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Get listen-and-learn error:', error);
    return jsonError('Failed to load assignment', 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const body = await request.json();
    if (body?.identity_only) {
      const identity = await saveLearnAssignmentIdentity(params.assignmentId, {
        title: body.title,
        teacher_name: body.teacher_name,
        class_name: body.class_name,
      });
      return NextResponse.json({ identity, assignment: identity });
    }
    const assignment = await saveLearnAssignment(
      params.assignmentId,
      body as SaveLearnAssignmentPayload
    );
    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Save listen-and-learn error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to save assignment',
      500
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }
  try {
    const deleted = await deleteLearnAssignment(params.assignmentId);
    if (!deleted) return jsonError('Assignment not found', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete listen-and-learn error:', error);
    return jsonError('Failed to delete assignment', 500);
  }
}
