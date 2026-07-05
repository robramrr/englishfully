import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { createTask, listTasks } from '@/lib/speak-and-submit/db';
import { getRequestOrigin, jsonError } from '@/lib/speak-and-submit/api';
import { getStudentTaskUrl } from '@/lib/speak-and-submit/qr';
import type { CreateTaskPayload, TaskType } from '@/lib/speak-and-submit/types';

const VALID_TYPES: TaskType[] = ['single_sentence', 'sentence_set', 'vocab_list', 'prompt'];

function validatePayload(body: CreateTaskPayload): string | null {
  if (!body.title?.trim()) return 'Title is required';
  if (!body.class_name?.trim()) return 'Class name is required';
  if (!VALID_TYPES.includes(body.task_type)) return 'Invalid task type';
  if (!Array.isArray(body.items) || body.items.filter((item) => item.trim()).length === 0) {
    return 'At least one item is required';
  }
  if (body.task_type === 'single_sentence' && body.items.filter((item) => item.trim()).length !== 1) {
    return 'Single sentence tasks require exactly one sentence';
  }
  return null;
}

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const tasks = await listTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    return jsonError('Failed to load tasks', 500);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const body = (await request.json()) as CreateTaskPayload;
    const validationError = validatePayload(body);
    if (validationError) return jsonError(validationError, 400);

    const origin = getRequestOrigin(request);
    const { task, items } = await createTask(body, '');

    const actualUrl = getStudentTaskUrl(task.id, origin);
    const { sql } = await import('@vercel/postgres');
    await sql`UPDATE speak_tasks SET qr_code_url = ${actualUrl} WHERE id = ${task.id}`;

    return NextResponse.json({
      task: { ...task, qr_code_url: actualUrl },
      items,
      studentUrl: actualUrl,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return jsonError(error instanceof Error ? error.message : 'Failed to create task', 500);
  }
}
