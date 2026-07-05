'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import CreateTaskForm from '../../../components/speak-and-submit/CreateTaskForm';
import TaskList from '../../../components/speak-and-submit/TaskList';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import type { SpeakTask } from '@/lib/speak-and-submit/types';

export default function SpeakAndSubmitPage() {
  const [tasks, setTasks] = useState<SpeakTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadTasks = useCallback(async () => {
    const response = await fetch('/api/speak-and-submit/tasks');
    if (!response.ok) return;
    const data = await response.json();
    setTasks(data.tasks || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="speak-and-submit-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          🎙️ Speak &amp; Submit
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Create one QR-code speaking homework task. Students scan once, record every item, and submit from their phone.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-16 px-4 space-y-10">
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher-resources">
              <ComicButton variant="accent" size="sm">
                ← Back to Teacher Resources
              </ComicButton>
            </Link>
          </div>

          <CreateTaskForm
            onCreated={() => {
              loadTasks();
            }}
          />

          {loaded ? (
            <TaskList tasks={tasks} onRefresh={loadTasks} />
          ) : (
            <ComicCard className="comic-shadow-xl text-center">
              <ComicText className="text-[var(--comic-dark)] font-bold">Loading tasks…</ComicText>
            </ComicCard>
          )}
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
