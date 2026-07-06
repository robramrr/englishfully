import { NextRequest, NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { deleteStudentSubmissions, getSubmissionsForTask, getTaskById } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';
import { deleteAudioUrls } from '@/lib/speak-and-submit/r2';

interface RouteParams {
  params: { taskId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const sort = request.nextUrl.searchParams.get('sort') || 'student_number';
    const submissions = await getSubmissionsForTask(params.taskId);

    const sorted = [...submissions].sort((a, b) => {
      if (sort === 'submitted_at') {
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      }
      const numA = Number.parseInt(a.student_number, 10);
      const numB = Number.parseInt(b.student_number, 10);
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
        return numA - numB;
      }
      return a.student_number.localeCompare(b.student_number);
    });

    const grouped = new Map<
      string,
      {
        student_name: string;
        student_number: string;
        class_number: string;
        submissions: typeof sorted;
      }
    >();

    for (const submission of sorted) {
      const key = `${submission.student_number}::${submission.class_number}::${submission.student_name}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.submissions.push(submission);
      } else {
        grouped.set(key, {
          student_name: submission.student_name,
          student_number: submission.student_number,
          class_number: submission.class_number,
          submissions: [submission],
        });
      }
    }

    return NextResponse.json({
      task,
      students: Array.from(grouped.values()),
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return jsonError('Failed to load submissions', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const body = (await request.json()) as {
      student_number?: string;
      class_number?: string;
    };

    if (!body.student_number?.trim() || !body.class_number?.trim()) {
      return jsonError('Student number and class are required', 400);
    }

    const { deletedCount, audioUrls } = await deleteStudentSubmissions(
      params.taskId,
      body.student_number,
      body.class_number
    );

    if (deletedCount === 0) {
      return jsonError('No submissions found for this student', 404);
    }

    await deleteAudioUrls(audioUrls);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Delete submissions error:', error);
    return jsonError('Failed to delete submissions', 500);
  }
}
