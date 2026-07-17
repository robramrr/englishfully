import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import {
  getSpeakSubmissionNumbersForTask,
  listGradebookTasks,
} from '@/lib/gradebook/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const taskId = request.nextUrl.searchParams.get('speak_task_id');
    const classLabel = request.nextUrl.searchParams.get('class_label');

    if (taskId && classLabel) {
      const submitted = await getSpeakSubmissionNumbersForTask(taskId, classLabel);
      return NextResponse.json({ submitted_student_numbers: submitted });
    }

    const tasks = await listGradebookTasks();
    return NextResponse.json({
      tasks,
      speak: tasks.filter((task) => task.tool === 'speak_and_submit'),
      listen: tasks.filter((task) => task.tool === 'listen_and_answer'),
    });
  } catch (error) {
    console.error('Gradebook tasks error:', error);
    return jsonError('Failed to load tasks', 500);
  }
}
