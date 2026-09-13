'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  PROJECT_SUBMISSION_STATUS_LABELS,
  componentDisplayTitle,
  formatSubmissionClassColumn,
  formatSubmissionGroupLabel,
  formatSubmissionStudentsColumn,
  isUploadTaskType,
  type ProjectSubmissionRow,
  type ProjectWithComponents,
} from '@/lib/projects/types';

interface ProjectSubmissionsTableProps {
  project: ProjectWithComponents;
}

function mark(value: ProjectSubmissionRow['speaking']) {
  if (value === 'disabled') return '—';
  return value === 'complete' ? '✓' : '—';
}

export default function ProjectSubmissionsTable({ project }: ProjectSubmissionsTableProps) {
  const [submissions, setSubmissions] = useState<ProjectSubmissionRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [removingId, setRemovingId] = useState('');
  const [error, setError] = useState('');

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
  const uploadTasks = project.components.filter(
    (item) => isUploadTaskType(item.type) && item.enabled
  );
  const showSpeaking = project.components.some((item) => item.type === 'speaking' && item.enabled);

  async function handleRemove(submission: ProjectSubmissionRow) {
    const label = formatSubmissionGroupLabel(submission);
    const confirmed = window.confirm(
      `Remove this submission for ${label}?\n\nThey will be able to start the project again.`
    );
    if (!confirmed) return;

    setRemovingId(submission.id);
    setError('');
    try {
      const response = await fetch(`/api/projects/${project.id}/submissions/${submission.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Failed to remove submission.');
        return;
      }
      setSubmissions((current) => current.filter((item) => item.id !== submission.id));
    } catch {
      setError('Failed to remove submission.');
    } finally {
      setRemovingId('');
    }
  }

  return (
    <ComicCard className="comic-shadow-xl overflow-x-auto">
      <ComicTitle level={3} className="mb-2 text-[var(--comic-secondary)]">
        Student submissions
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
        {submissions.length} submission{submissions.length === 1 ? '' : 's'} · {submittedCount} submitted
      </ComicText>

      {error ? <ComicText className="text-[var(--comic-danger)] font-bold mb-4">{error}</ComicText> : null}

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
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Class</th>
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Students</th>
              {uploadTasks.map((task) => (
                <th key={task.id} className="py-3 pr-3 font-bold text-[var(--comic-dark)]">
                  {componentDisplayTitle(task)}
                </th>
              ))}
              {showSpeaking ? (
                <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Speaking</th>
              ) : null}
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Status</th>
              <th className="py-3 font-bold text-[var(--comic-dark)]"> </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b border-[var(--comic-black)]">
                <td className="py-3 pr-3 font-bold text-[var(--comic-dark)]">
                  {formatSubmissionClassColumn(submission) || '—'}
                </td>
                <td className="py-3 pr-3">
                  <Link
                    href={`/teacher-resources/projects/${project.id}/students/${submission.id}`}
                    className="font-bold text-[var(--comic-secondary)] underline"
                  >
                    {formatSubmissionStudentsColumn(submission) || 'View'}
                  </Link>
                </td>
                {uploadTasks.map((task) => {
                  const status =
                    submission.upload_statuses?.find((item) => item.component_id === task.id)
                      ?.status ?? 'incomplete';
                  return (
                    <td key={task.id} className="py-3 pr-3 font-bold">
                      {mark(status)}
                    </td>
                  );
                })}
                {showSpeaking ? <td className="py-3 pr-3 font-bold">{mark(submission.speaking)}</td> : null}
                <td className="py-3 pr-3 font-bold text-[var(--comic-dark)]">
                  {PROJECT_SUBMISSION_STATUS_LABELS[submission.status]}
                </td>
                <td className="py-3">
                  <ComicButton
                    variant="danger"
                    size="sm"
                    disabled={removingId === submission.id}
                    onClick={() => void handleRemove(submission)}
                  >
                    {removingId === submission.id ? 'Removing…' : 'Remove'}
                  </ComicButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ComicCard>
  );
}
