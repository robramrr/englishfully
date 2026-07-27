import { NextResponse } from 'next/server';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { jsonError } from '@/lib/speak-and-submit/api';
import { listPublishedMakeupAssignments } from '@/lib/listen-and-learn/db';
import { getAssignmentById } from '@/lib/listen-and-answer/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isTeacherAuthenticated())) {
    return jsonError('Unauthorized', 401);
  }

  try {
    const makeups = await listPublishedMakeupAssignments();
    const items = await Promise.all(
      makeups.map(async (makeup) => {
        let tiedTitle = '';
        try {
          const tied = await getAssignmentById(makeup.makeup_listen_assignment_id);
          tiedTitle = tied?.title || '';
        } catch {
          tiedTitle = '';
        }
        return {
          id: makeup.id,
          title: makeup.title,
          status: makeup.status,
          makeup_listen_assignment_id: makeup.makeup_listen_assignment_id,
          makeup_listen_title: tiedTitle,
          makeup_class_names: makeup.makeup_class_names,
          student_url: `/listen-learn/${makeup.id}`,
        };
      })
    );
    return NextResponse.json({ makeups: items });
  } catch (error) {
    console.error('List gradebook makeups error:', error);
    return jsonError('Failed to load makeup assignments', 500);
  }
}
