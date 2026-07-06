import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { createTask, listTasks } from '@/lib/speak-and-submit/db';
import { getRequestOrigin, jsonError } from '@/lib/speak-and-submit/api';
import { getStudentTaskUrl } from '@/lib/speak-and-submit/qr';
import type { CreateTaskPayload, ItemTaskType, TaskSectionInput } from '@/lib/speak-and-submit/types';
import {
  ITEM_TASK_TYPES,
  getDefaultMaxRecordingSeconds,
  normalizeTaskItemInput,
} from '@/lib/speak-and-submit/types';

function normalizeSection(section: TaskSectionInput): TaskSectionInput | null {
  const itemType = section.item_type;
  if (!ITEM_TASK_TYPES.includes(itemType)) return null;

  const items = section.items.map((item) => normalizeTaskItemInput(item)).filter((item) => item.content);
  if (items.length === 0) return null;

  if (itemType === 'single_sentence' && items.length !== 1) return null;

  const maxSeconds =
    section.max_recording_seconds ?? getDefaultMaxRecordingSeconds(itemType);
  if (maxSeconds < 5 || maxSeconds > 300) return null;

  return {
    item_type: itemType,
    max_recording_seconds: maxSeconds,
    items,
  };
}

function validatePayload(body: CreateTaskPayload): string | null {
  if (!body.title?.trim()) return 'Title is required';
  if (!body.class_name?.trim()) return 'Class name is required';
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return 'At least one task part is required';
  }

  for (let index = 0; index < body.sections.length; index += 1) {
    const section = normalizeSection(body.sections[index]);
    if (!section) {
      return `Task part ${index + 1} is invalid. Check the type, items, and recording limit.`;
    }
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

    const sections = body.sections
      .map((section) => normalizeSection(section))
      .filter((section): section is TaskSectionInput => section !== null);

    const origin = getRequestOrigin(request);
    const { task, items } = await createTask({ ...body, sections }, '');

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
