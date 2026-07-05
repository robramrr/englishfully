import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { deleteTask, getTaskById, getTaskItems } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const items = await getTaskItems(params.taskId);
    return NextResponse.json({ task, items });
  } catch (error) {
    console.error('Get task error:', error);
    return jsonError('Failed to load task', 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const deleted = await deleteTask(params.taskId);
    if (!deleted) return jsonError('Task not found', 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return jsonError('Failed to delete task', 500);
  }
}
