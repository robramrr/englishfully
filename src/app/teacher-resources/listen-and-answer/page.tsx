'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import AssignmentList from '../../../components/listen-and-answer/AssignmentList';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import type { AssignmentListItem } from '@/lib/listen-and-answer/types';

function ListenAndAnswerContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadAssignments = useCallback(async () => {
    const response = await fetch('/api/listen-and-answer/assignments');
    if (!response.ok) return;
    const data = await response.json();
    setAssignments(data.assignments || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function handleCreateAssignment() {
    setCreating(true);
    try {
      const response = await fetch('/api/listen-and-answer/assignments', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create assignment');
      router.push(`/teacher-resources/listen-and-answer/${data.assignment.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-10">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources">
          <ComicButton variant="accent" size="sm">
            ← Back to Teacher Resources
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
          Create a listening worksheet
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
          Start a new assignment with listening parts, questions, and a printable answer key.
        </ComicText>
        <ComicButton variant="secondary" size="md" disabled={creating} onClick={handleCreateAssignment}>
          {creating ? 'Creating…' : '+ New Assignment'}
        </ComicButton>
      </ComicCard>

      {loaded ? (
        <AssignmentList assignments={assignments} onRefresh={loadAssignments} />
      ) : (
        <ComicCard className="comic-shadow-xl text-center">
          <ComicText className="text-[var(--comic-dark)] font-bold">Loading assignments…</ComicText>
        </ComicCard>
      )}
    </section>
  );
}

export default function ListenAndAnswerPage() {
  return (
    <div className="listen-and-answer-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-primary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          👂 Listen &amp; Answer
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Build printable listening worksheets from audio URLs, with optional AI transcripts and comprehension questions.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <ListenAndAnswerContent />
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
