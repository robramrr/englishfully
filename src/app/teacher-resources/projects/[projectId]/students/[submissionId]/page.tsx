'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../../../../../../components/ComicButton';
import ComicText from '../../../../../../components/ComicText';
import Footer from '../../../../../../components/Footer';
import TeacherAuthGate from '../../../../../../components/speak-and-submit/TeacherAuthGate';
import StudentSubmissionReview from '../../../../../../components/projects/StudentSubmissionReview';
import type { ProjectSubmissionWithComponents, ProjectWithComponents } from '@/lib/projects/types';

interface ReviewPageProps {
  params: { projectId: string; submissionId: string };
}

export default function StudentReviewPage({ params }: ReviewPageProps) {
  const [project, setProject] = useState<ProjectWithComponents | null>(null);
  const [submission, setSubmission] = useState<ProjectSubmissionWithComponents | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.projectId}/submissions/${params.submissionId}`, {
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.project || !data.submission) {
          setError(data.error || 'Submission not found');
          return;
        }
        setProject(data.project);
        setSubmission(data.submission);
      })
      .catch(() => setError('Failed to load submission'))
      .finally(() => setLoading(false));
  }, [params.projectId, params.submissionId]);

  return (
    <div className="projects-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <section className="max-w-4xl mx-auto py-16 px-4">
          <div className="mb-8">
            <Link href={`/teacher-resources/projects/${params.projectId}`}>
              <ComicButton variant="accent" size="sm">
                ← Back to project
              </ComicButton>
            </Link>
          </div>
          {loading ? (
            <ComicText className="text-[var(--comic-dark)] font-bold">Loading submission…</ComicText>
          ) : error ? (
            <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
          ) : project && submission ? (
            <StudentSubmissionReview project={project} initialSubmission={submission} />
          ) : null}
        </section>
      </TeacherAuthGate>
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
