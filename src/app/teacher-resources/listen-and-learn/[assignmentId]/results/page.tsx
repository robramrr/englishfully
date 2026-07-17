'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../../../../../components/ComicButton';
import ComicCard from '../../../../../components/ComicCard';
import ComicText from '../../../../../components/ComicText';
import ComicTitle from '../../../../../components/ComicTitle';
import Footer from '../../../../../components/Footer';
import ResultsDashboard from '../../../../../components/listen-and-learn/ResultsDashboard';
import TeacherAuthGate from '../../../../../components/speak-and-submit/TeacherAuthGate';
import type { LearnAssignmentWithDetails } from '@/lib/listen-and-learn/types';

interface ResultsPageProps {
  params: { assignmentId: string };
}

function ResultsPageContent({ assignmentId }: { assignmentId: string }) {
  const [assignment, setAssignment] = useState<LearnAssignmentWithDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/listen-and-learn/assignments/${assignmentId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.assignment) {
          setError('Assessment not found.');
          return;
        }
        setAssignment(data.assignment);
      })
      .catch(() => setError('Failed to load assessment.'));
  }, [assignmentId]);

  if (error) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
          Results unavailable
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold mb-4">{error}</ComicText>
        <Link href="/teacher-resources/listen-and-learn">
          <ComicButton variant="accent" size="sm">
            Back to Listen &amp; Learn
          </ComicButton>
        </Link>
      </ComicCard>
    );
  }

  if (!assignment) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading…</ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/listen-and-learn">
          <ComicButton variant="accent" size="sm">
            ← Back to list
          </ComicButton>
        </Link>
        <Link href={`/teacher-resources/listen-and-learn/${assignmentId}`}>
          <ComicButton variant="secondary" size="sm">
            Edit assessment
          </ComicButton>
        </Link>
      </div>
      <ResultsDashboard
        assignmentId={assignmentId}
        title={assignment.title}
        passingScore={assignment.passing_score}
      />
    </div>
  );
}

export default function ListenAndLearnResultsPage({ params }: ResultsPageProps) {
  return (
    <div className="listen-and-learn-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-12 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-text-white mb-2">
          🎧 Listen &amp; Learn Results
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Review student scores, attempts, and responses.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-12 px-4">
          <ResultsPageContent assignmentId={params.assignmentId} />
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
