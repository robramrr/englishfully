import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { getSubmissionsForTask, getTaskById } from '@/lib/speak-and-submit/db';
import { jsonError } from '@/lib/speak-and-submit/api';
import { fetchAudioBuffer } from '@/lib/speak-and-submit/r2';

interface RouteParams {
  params: { taskId: string };
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const task = await getTaskById(params.taskId);
    if (!task) return jsonError('Task not found', 404);

    const submissions = await getSubmissionsForTask(params.taskId);
    if (submissions.length === 0) {
      return jsonError('No submissions to download', 404);
    }

    const zip = new JSZip();

    await Promise.all(
      submissions.map(async (submission, index) => {
        const buffer = await fetchAudioBuffer(submission.audio_url);
        if (!buffer) return;
        const extension = submission.audio_url.includes('.mp4')
          ? 'mp4'
          : submission.audio_url.includes('.webm')
            ? 'webm'
            : submission.audio_url.includes('.mp3')
              ? 'mp3'
              : 'audio';
        const filename = sanitizeFilename(
          `${submission.student_number}_item${submission.item_order + 1}_${index + 1}.${extension}`
        );
        zip.file(filename, buffer);
      })
    );

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${sanitizeFilename(task.title)}-submissions.zip"`,
      },
    });
  } catch (error) {
    console.error('Download zip error:', error);
    return jsonError('Failed to create download', 500);
  }
}
