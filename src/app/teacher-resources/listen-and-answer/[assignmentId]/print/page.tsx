import { notFound, redirect } from 'next/navigation';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { getAssignmentById } from '@/lib/listen-and-answer/db';
import PrintHandout from './PrintHandout';

interface PrintPageProps {
  params: { assignmentId: string };
}

export default async function PrintPage({ params }: PrintPageProps) {
  if (!(await isTeacherAuthenticated())) {
    redirect(`/teacher-resources/listen-and-answer/${params.assignmentId}`);
  }

  const assignment = await getAssignmentById(params.assignmentId);
  if (!assignment) notFound();

  return <PrintHandout assignment={assignment} />;
}
