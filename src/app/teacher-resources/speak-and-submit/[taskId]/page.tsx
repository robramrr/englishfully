'use client';

import { useEffect, useMemo, useState } from 'react';
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
import type { SpeakTask, SpeakTaskItem } from '@/lib/speak-and-submit/types';
import {
  TASK_TYPE_LABELS,
  formatTaskTypesFromItems,
  groupTaskItemsBySection,
} from '@/lib/speak-and-submit/types';

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

  const itemSections = useMemo(() => groupTaskItemsBySection(items), [items]);
  const hasMultipleParts = itemSections.length > 1;

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
                  {task.task_type === 'mixed'
                    ? formatTaskTypesFromItems(items)
                    : TASK_TYPE_LABELS[task.task_type]}
                </ComicText>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <ComicTitle level={4} className="mb-3 text-[var(--comic-secondary)]">
                      Task items
                    </ComicTitle>
                    <div className="space-y-6 text-left">
                      {itemSections.map((section) => (
                        <div key={`section-${section.sectionIndex}`}>
                          {hasMultipleParts ? (
                            <ComicText className="text-[var(--comic-secondary)] font-bold mb-2">
                              Part {section.sectionIndex + 1}: {TASK_TYPE_LABELS[section.itemType]}
                            </ComicText>
                          ) : null}
                          {section.itemType === 'prompt' ? (
                            <ol className="space-y-3">
                              {section.items.length > 1 ? (
                                <ComicText className="text-[var(--comic-secondary)] font-bold text-sm">
                                  Student chooses one prompt:
                                </ComicText>
                              ) : null}
                              {section.items.map((item, index) => (
                                <li
                                  key={item.id}
                                  className="comic-border bg-white p-4 rounded-lg text-[var(--comic-dark)] font-bold space-y-2"
                                >
                                  {section.items.length > 1 ? (
                                    <ComicText className="text-[var(--comic-secondary)] text-sm">
                                      Option {index + 1}
                                    </ComicText>
                                  ) : null}
                                  <div>{item.content}</div>
                                  {item.prompt_rules ? (
                                    <ComicText className="text-sm">
                                      <span className="text-[var(--comic-secondary)]">Rules: </span>
                                      {item.prompt_rules}
                                    </ComicText>
                                  ) : null}
                                  {item.prompt_example ? (
                                    <ComicText className="text-sm italic">
                                      <span className="text-[var(--comic-secondary)] not-italic">Example: </span>
                                      {item.prompt_example}
                                    </ComicText>
                                  ) : null}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <ol className="space-y-3">
                              {section.items.map((item, index) => (
                                <li
                                  key={item.id}
                                  className="comic-border bg-white p-4 rounded-lg text-[var(--comic-dark)] font-bold"
                                >
                                  {section.items.length > 1 ? `${index + 1}. ` : ''}
                                  {item.content}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      ))}
                    </div>
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
