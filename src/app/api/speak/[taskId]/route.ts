import { unstable_noStore as noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getTaskById, getTaskItems } from '@/lib/speak-and-submit/db';
import { getEntryConfig } from '@/lib/speak-and-submit/settings';
import { jsonError } from '@/lib/speak-and-submit/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

interface RouteParams {
  params: { taskId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  noStore();

  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const items = await getTaskItems(params.taskId);
    const teacherId = task.teacher_id || 'default';
    const entryConfig = await getEntryConfig(teacherId);

    return NextResponse.json(
      {
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
          item_type: item.item_type,
          section_index: item.section_index,
          max_recording_seconds: item.max_recording_seconds,
          prompt_rules: item.prompt_rules,
          prompt_example: item.prompt_example,
        })),
      },
      {
        headers: {
          ...NO_STORE_HEADERS,
          'X-Class-Count': String(entryConfig.classes.length),
        },
      }
    );
  } catch (error) {
    console.error('Public task fetch error:', error);
    return jsonError('Failed to load task', 500);
  }
}
