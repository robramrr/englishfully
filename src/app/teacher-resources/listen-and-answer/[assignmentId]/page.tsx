'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../../../../components/ComicButton';
import ComicCard from '../../../../components/ComicCard';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import AssignmentEditor from '../../../../components/listen-and-answer/AssignmentEditor';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import type { ListenAssignmentWithParts } from '@/lib/listen-and-answer/types';

interface EditorPageProps {
  params: { assignmentId: string };
}

function AssignmentEditorPageContent({ assignmentId }: { assignmentId: string }) {
  const [assignment, setAssignment] = useState<ListenAssignmentWithParts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/listen-and-answer/assignments/${assignmentId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.assignment) {
          setError('Assignment not found.');
          return;
        }
        setAssignment(data.assignment);
      })
      .catch(() => setError('Failed to load assignment.'));
  }, [assignmentId]);

  if (error) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
          Assignment unavailable
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold mb-4">{error}</ComicText>
        <Link href="/teacher-resources/listen-and-answer">
          <ComicButton variant="accent" size="sm">
            Back to Listen &amp; Answer
          </ComicButton>
        </Link>
      </ComicCard>
    );
  }

  if (!assignment) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading assignment…</ComicText>
      </ComicCard>
    );
  }

  return <AssignmentEditor assignmentId={assignmentId} initialAssignment={assignment} />;
}

export default function ListenAndAnswerEditorPage({ params }: EditorPageProps) {
  return (
    <div className="listen-and-answer-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-primary py-12 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-text-white mb-2">
          👂 Listen &amp; Answer Editor
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Build listening parts, questions, and your printable worksheet.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-12 px-4">
          <AssignmentEditorPageContent assignmentId={params.assignmentId} />
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
