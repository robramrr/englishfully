'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import AssignmentList from '../../../components/listen-and-learn/AssignmentList';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import type { LearnAssignmentListItem } from '@/lib/listen-and-learn/types';

function ListenAndLearnContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<LearnAssignmentListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadAssignments = useCallback(async () => {
    const response = await fetch('/api/listen-and-learn/assignments');
    if (!response.ok) {
      setLoaded(true);
      setAssignments([]);
      return;
    }
    const data = await response.json();
    setAssignments(data.assignments || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  async function handleCreateAssignment() {
    setCreating(true);
    try {
      const response = await fetch('/api/listen-and-learn/assignments', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create assessment');
      router.push(`/teacher-resources/listen-and-learn/${data.assignment.id}`);
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
          Create a short listening assessment
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
          Students hear one sentence or short clip, then answer a single multiple-choice question.
        </ComicText>
        <ComicButton
          variant="secondary"
          size="md"
          disabled={creating}
          onClick={() => void handleCreateAssignment()}
        >
          {creating ? 'Creating…' : '+ New Assessment'}
        </ComicButton>
      </ComicCard>

      {loaded ? (
        <AssignmentList assignments={assignments} onRefresh={() => void loadAssignments()} />
      ) : (
        <ComicCard className="comic-shadow-xl text-center">
          <ComicText className="text-[var(--comic-dark)] font-bold">Loading assessments…</ComicText>
        </ComicCard>
      )}
    </section>
  );
}

export default function ListenAndLearnPage() {
  return (
    <div className="listen-and-learn-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          🎧 Listen &amp; Learn
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Focused listening practice: short audio segments, one question each, with AI-assisted
          generation and student results.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <ListenAndLearnContent />
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
