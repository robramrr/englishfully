'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  PROJECT_SUBMISSION_STATUS_LABELS,
  formatSubmissionGroupLabel,
  type ProjectSubmissionRow,
  type ProjectWithComponents,
} from '@/lib/projects/types';

interface ProjectSubmissionsTableProps {
  project: ProjectWithComponents;
}

function mark(value: ProjectSubmissionRow['worksheet']) {
  if (value === 'disabled') return '—';
  return value === 'complete' ? '✓' : '—';
}

export default function ProjectSubmissionsTable({ project }: ProjectSubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<ProjectSubmissionRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${project.id}/submissions`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        setSubmissions(data.submissions || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [project.id]);

  const submittedCount = submissions.filter(
    (item) => item.status === 'submitted' || item.status === 'reviewed'
  ).length;
  const showWorksheet = project.components.some((item) => item.type === 'worksheet' && item.enabled);
  const showArtwork = project.components.some((item) => item.type === 'artwork' && item.enabled);
  const showSpeaking = project.components.some((item) => item.type === 'speaking' && item.enabled);

  return (
    <ComicCard className="comic-shadow-xl overflow-x-auto">
      <ComicTitle level={3} className="mb-2 text-[var(--comic-secondary)]">
        Student submissions
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
        {submissions.length} submission{submissions.length === 1 ? '' : 's'} · {submittedCount} submitted
      </ComicText>

      {!loaded ? (
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading submissions…</ComicText>
      ) : submissions.length === 0 ? (
        <ComicText className="text-[var(--comic-dark)] font-bold">
          No student work yet. Publish the project and share the student link.
        </ComicText>
      ) : (
        <table className="w-full min-w-[36rem] text-left border-collapse">
          <thead>
            <tr className="border-b-4 border-[var(--comic-black)]">
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Students</th>
              {showWorksheet ? (
                <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Worksheet</th>
              ) : null}
              {showArtwork ? (
                <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Artwork</th>
              ) : null}
              {showSpeaking ? (
                <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Speaking</th>
              ) : null}
              <th className="py-3 font-bold text-[var(--comic-dark)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b border-[var(--comic-black)]">
                <td className="py-3 pr-3">
                  <Link
                    href={`/teacher-resources/projects/${project.id}/students/${submission.id}`}
                    className="font-bold text-[var(--comic-secondary)] underline"
                  >
                    {formatSubmissionGroupLabel(submission)}
                  </Link>
                </td>
                {showWorksheet ? <td className="py-3 pr-3 font-bold">{mark(submission.worksheet)}</td> : null}
                {showArtwork ? <td className="py-3 pr-3 font-bold">{mark(submission.artwork)}</td> : null}
                {showSpeaking ? <td className="py-3 pr-3 font-bold">{mark(submission.speaking)}</td> : null}
                <td className="py-3 font-bold text-[var(--comic-dark)]">
                  {PROJECT_SUBMISSION_STATUS_LABELS[submission.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ComicCard>
  );
}
