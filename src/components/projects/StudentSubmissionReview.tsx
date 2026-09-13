'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ComicAudioPlayer from '../ComicAudioPlayer';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  PROJECT_COMPONENT_LABELS,
  PROJECT_SUBMISSION_STATUS_LABELS,
  formatProjectDateTime,
  formatSubmissionGroupLabel,
  type ProjectComponentSubmission,
  type ProjectSubmissionWithComponents,
  type ProjectWithComponents,
} from '@/lib/projects/types';

interface StudentSubmissionReviewProps {
  project: ProjectWithComponents;
  initialSubmission: ProjectSubmissionWithComponents;
}

function componentRow(
  project: ProjectWithComponents,
  submission: ProjectSubmissionWithComponents,
  type: 'worksheet' | 'artwork' | 'speaking'
): { component: ProjectWithComponents['components'][number]; row: ProjectComponentSubmission | null } | null {
  const component = project.components.find((item) => item.type === type && item.enabled);
  if (!component) return null;
  return {
    component,
    row: submission.components.find((item) => item.component_id === component.id) ?? null,
  };
}

export default function StudentSubmissionReview({
  project,
  initialSubmission,
}: StudentSubmissionReviewProps) {
  const [submission, setSubmission] = useState(initialSubmission);
  const [feedback, setFeedback] = useState(initialSubmission.teacher_feedback);
  const [score, setScore] = useState(initialSubmission.score?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const worksheet = componentRow(project, submission, 'worksheet');
  const artwork = componentRow(project, submission, 'artwork');
  const speaking = componentRow(project, submission, 'speaking');

  async function saveReview(markReviewed: boolean) {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const parsedScore = score.trim() === '' ? null : Number(score);
      if (parsedScore !== null && !Number.isFinite(parsedScore)) {
        setError('Score must be a number');
        return;
      }
      const response = await fetch(`/api/projects/${project.id}/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_feedback: feedback,
          score: parsedScore,
          mark_reviewed: markReviewed,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save review');
        return;
      }
      setSubmission(data.submission);
      setMessage(markReviewed ? 'Marked as reviewed.' : 'Feedback saved.');
    } catch {
      setError('Failed to save review');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    const label = formatSubmissionGroupLabel(submission);
    const confirmed = window.confirm(
      `Remove this submission for ${label}?\n\nThey will be able to start the project again.`
    );
    if (!confirmed) return;

    setRemoving(true);
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
      router.push(`/teacher-resources/projects/${project.id}`);
    } catch {
      setError('Failed to remove submission.');
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-8">
      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={2} className="mb-2 text-[var(--comic-primary)]">
          {formatSubmissionGroupLabel(submission)}
        </ComicTitle>
        <div className="space-y-1 mb-2">
          {(submission.members?.length
            ? submission.members
            : [
                {
                  student_name: submission.student_name,
                  student_number: submission.student_number,
                  class_number: submission.class_number,
                },
              ]
          ).map((member) => (
            <ComicText
              key={`${member.class_number}-${member.student_number}`}
              className="text-[var(--comic-dark)] font-bold"
            >
              #{member.student_number} {member.student_name} · {member.class_number}
            </ComicText>
          ))}
        </div>
        <ComicText className="text-[var(--comic-dark)] mb-4">
          {PROJECT_SUBMISSION_STATUS_LABELS[submission.status]}
          {submission.submitted_at ? ` · Submitted ${formatProjectDateTime(submission.submitted_at)}` : ''}
        </ComicText>
        <ComicButton variant="danger" size="sm" disabled={removing} onClick={() => void handleRemove()}>
          {removing ? 'Removing…' : 'Remove submission'}
        </ComicButton>
      </ComicCard>

      {worksheet ? (
        <ComicCard className="comic-shadow-xl space-y-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            {PROJECT_COMPONENT_LABELS.worksheet}
          </ComicTitle>
          {worksheet.row?.file_url ? (
            <a
              href={worksheet.row.file_url}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--comic-secondary)] underline"
            >
              View / download student worksheet
              {worksheet.row.file_name ? ` (${worksheet.row.file_name})` : ''}
            </a>
          ) : (
            <ComicText className="text-[var(--comic-dark)]">
              {worksheet.row?.status === 'complete'
                ? 'Student opened the worksheet. No file uploaded.'
                : 'No worksheet work yet.'}
            </ComicText>
          )}
        </ComicCard>
      ) : null}

      {artwork ? (
        <ComicCard className="comic-shadow-xl space-y-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            {PROJECT_COMPONENT_LABELS.artwork}
          </ComicTitle>
          {artwork.row?.file_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.row.file_url}
              alt={`${submission.student_name} artwork`}
              className="max-h-[28rem] w-full object-contain rounded-lg comic-border"
            />
          ) : (
            <ComicText className="text-[var(--comic-dark)]">No artwork uploaded.</ComicText>
          )}
        </ComicCard>
      ) : null}

      {speaking ? (
        <ComicCard className="comic-shadow-xl space-y-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            {PROJECT_COMPONENT_LABELS.speaking}
          </ComicTitle>
          {speaking.row?.text_data === 'in_person' ? (
            <ComicText className="text-[var(--comic-dark)] font-bold">
              In-person presentation
            </ComicText>
          ) : speaking.row?.audio_url ? (
            <div className="space-y-2">
              <ComicAudioPlayer src={speaking.row.audio_url} />
              {speaking.row.duration_seconds ? (
                <ComicText className="text-[var(--comic-dark)]">
                  Duration: {Math.round(speaking.row.duration_seconds)}s
                </ComicText>
              ) : null}
            </div>
          ) : (
            <ComicText className="text-[var(--comic-dark)]">No speaking work yet.</ComicText>
          )}
        </ComicCard>
      ) : null}

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={4} className="text-[var(--comic-secondary)]">
          Teacher feedback
        </ComicTitle>
        <textarea
          className="w-full comic-textarea min-h-32"
          placeholder="Teacher feedback"
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          disabled={submission.status === 'in_progress'}
        />
        <label className="block font-bold text-[var(--comic-dark)]">
          Score (out of 10, also saved to the gradebook)
          <input
            className="w-full comic-input mt-2"
            inputMode="decimal"
            placeholder="e.g. 8"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            disabled={submission.status === 'in_progress'}
          />
        </label>
        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
        {message ? <ComicText className="text-[var(--comic-success)] font-bold">{message}</ComicText> : null}
        <div className="flex flex-wrap gap-3">
          <ComicButton
            variant="secondary"
            disabled={saving || submission.status === 'in_progress'}
            onClick={() => void saveReview(false)}
          >
            {saving ? 'Saving…' : 'Save feedback'}
          </ComicButton>
          <ComicButton
            variant="primary"
            disabled={saving || submission.status === 'in_progress'}
            onClick={() => void saveReview(true)}
          >
            Mark as reviewed
          </ComicButton>
        </div>
      </ComicCard>
    </div>
  );
}
