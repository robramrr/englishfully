'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import ComicCard from '../../../../components/ComicCard';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import SubmissionsDashboard from '../../../../components/speak-and-submit/SubmissionsDashboard';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import { generateQrDataUrl } from '@/lib/speak-and-submit/qr';
import type { SpeakTask, SpeakTaskItem, TaskType } from '@/lib/speak-and-submit/types';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  single_sentence: 'Single Sentence',
  sentence_set: 'Multiple Sentences',
  vocab_list: 'Vocabulary List',
  prompt: 'Open Prompt',
};

interface TaskDetailPageProps {
  params: { taskId: string };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const router = useRouter();
  const [task, setTask] = useState<SpeakTask | null>(null);
  const [items, setItems] = useState<SpeakTaskItem[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTask() {
      try {
        const response = await fetch(`/api/speak-and-submit/tasks/${params.taskId}`);
        const data = await response.json();
        if (!response.ok) {
          setError(data.error || 'Task not found');
          return;
        }
        setTask(data.task);
        setItems(data.items);
        const studentUrl =
          data.task.qr_code_url || `${window.location.origin}/speak/${params.taskId}`;
        setQrCode(await generateQrDataUrl(studentUrl));
      } catch {
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [params.taskId]);

  async function handleDelete() {
    if (!window.confirm('Delete this task and all student submissions? This cannot be undone.')) {
      return;
    }

    const response = await fetch(`/api/speak-and-submit/tasks/${params.taskId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      router.push('/teacher-resources/speak-and-submit');
      return;
    }

    setError('Failed to delete task.');
  }

  return (
    <div className="speak-and-submit-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher-resources/speak-and-submit">
              <ComicButton variant="accent" size="sm">
                ← All tasks
              </ComicButton>
            </Link>
            <Link href={`/teacher-resources/speak-and-submit/${params.taskId}/print`}>
              <ComicButton variant="warning" size="sm">
                Printable handout
              </ComicButton>
            </Link>
            <ComicButton variant="danger" size="sm" onClick={handleDelete}>
              Delete task
            </ComicButton>
          </div>

          {loading ? (
            <ComicText className="text-[var(--comic-dark)] font-bold">Loading task…</ComicText>
          ) : error ? (
            <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
          ) : task ? (
            <>
              <ComicCard className="comic-shadow-xl">
                <ComicTitle level={2} className="mb-2 text-[var(--comic-primary)]">
                  {task.title}
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-1">
                  Class: {task.class_name}
                </ComicText>
                <ComicText className="text-[var(--comic-dark)] mb-4">
                  {TASK_TYPE_LABELS[task.task_type]}
                </ComicText>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <ComicTitle level={4} className="mb-3 text-[var(--comic-secondary)]">
                      Task items
                    </ComicTitle>
                    <ol className="space-y-3 text-left">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="comic-border bg-white p-4 rounded-lg text-[var(--comic-dark)] font-bold"
                        >
                          {items.length > 1 ? `${item.order_index + 1}. ` : ''}
                          {item.content}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="text-center">
                    <ComicTitle level={4} className="mb-3 text-[var(--comic-secondary)]">
                      Student QR code
                    </ComicTitle>
                    {qrCode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrCode} alt="QR code for student speaking task" className="mx-auto comic-border-thick" />
                    ) : null}
                    <ComicText className="text-[var(--comic-dark)] font-bold mt-4 break-all">
                      {task.qr_code_url}
                    </ComicText>
                  </div>
                </div>
              </ComicCard>

              <SubmissionsDashboard taskId={params.taskId} />
            </>
          ) : null}
        </section>
      </TeacherAuthGate>
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
