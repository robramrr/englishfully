import { NextResponse } from 'next/server';
import { getTaskById, getTaskItems } from '@/lib/speak-and-submit/db';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import { jsonError } from '@/lib/speak-and-submit/api';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const items = await getTaskItems(params.taskId);
    const entryConfig = await getEntryConfig(task.teacher_id);

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        task_type: task.task_type,
        class_name: task.class_name,
        max_recording_seconds: task.max_recording_seconds,
        entry_config: entryConfig,
      },
      items: items.map((item) => ({
        id: item.id,
        order_index: item.order_index,
        content: item.content,
      })),
    });
  } catch (error) {
    console.error('Public task fetch error:', error);
    return jsonError('Failed to load task', 500);
  }
}
