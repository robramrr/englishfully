import { notFound, redirect } from 'next/navigation';
import { isTeacherAuthenticated } from '@/lib/speak-and-submit/auth';
import { getTaskById, getTaskItems } from '@/lib/speak-and-submit/db';
import { getTeacherName } from '@/lib/speak-and-submit/settings';
import { generateQrDataUrl, getStudentTaskUrl } from '@/lib/speak-and-submit/qr';
import PrintHandout from './PrintHandout';

interface PrintPageProps {
  params: { taskId: string };
}

export default async function PrintPage({ params }: PrintPageProps) {
  if (!(await isTeacherAuthenticated())) {
    redirect(`/teacher-resources/speak-and-submit/${params.taskId}`);
  }

  const task = await getTaskById(params.taskId);
  if (!task) notFound();

  const items = await getTaskItems(params.taskId);
  const teacherName = await getTeacherName();
  const studentUrl = task.qr_code_url || getStudentTaskUrl(params.taskId);
  const qrCode = await generateQrDataUrl(studentUrl);

  return (
    <PrintHandout
      task={task}
      items={items}
      studentUrl={studentUrl}
      qrCode={qrCode}
      teacherName={teacherName}
    />
  );
}
