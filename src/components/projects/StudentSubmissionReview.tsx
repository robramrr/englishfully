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
  asUploadTaskSettings,
  componentDisplayTitle,
  formatProjectDateTime,
  formatSubmissionClassColumn,
  formatSubmissionGroupLabel,
  getComponentUploadFiles,
  isUploadTaskType,
  submissionMembersList,
  type ProjectComponentSubmission,
  type ProjectSubmissionWithComponents,
  type ProjectWithComponents,
} from '@/lib/projects/types';

interface StudentSubmissionReviewProps {
  project: ProjectWithComponents;
  initialSubmission: ProjectSubmissionWithComponents;
}

function rowForComponent(
  submission: ProjectSubmissionWithComponents,
  componentId: string
): ProjectComponentSubmission | null {
  return submission.components.find((item) => item.component_id === componentId) ?? null;
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

  const uploadTasks = project.components.filter(
    (item) => isUploadTaskType(item.type) && item.enabled
  );
  const speaking = project.components.find((item) => item.type === 'speaking' && item.enabled);
  const speakingRow = speaking ? rowForComponent(submission, speaking.id) : null;

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
          {formatSubmissionClassColumn(submission) || 'Submission'}
        </ComicTitle>
        <div className="space-y-1 mb-2">
          {submissionMembersList(submission).map((member) => {
            const name = `${member.student_number} ${member.student_name}`.trim();
            return (
              <ComicText
                key={`${member.class_number}-${member.student_number}`}
                className="text-[var(--comic-dark)] font-bold"
              >
                #{name || member.student_number}
              </ComicText>
            );
          })}
        </div>
        <ComicText className="text-[var(--comic-dark)] mb-4">
          {PROJECT_SUBMISSION_STATUS_LABELS[submission.status]}
          {submission.submitted_at ? ` · Submitted ${formatProjectDateTime(submission.submitted_at)}` : ''}
        </ComicText>
        <ComicButton variant="danger" size="sm" disabled={removing} onClick={() => void handleRemove()}>
          {removing ? 'Removing…' : 'Remove submission'}
        </ComicButton>
      </ComicCard>

      {uploadTasks.map((task) => {
        const row = rowForComponent(submission, task.id);
        const settings = asUploadTaskSettings(task.settings);
        const title = componentDisplayTitle(task);
        const files = getComponentUploadFiles(row);
        return (
          <ComicCard key={task.id} className="comic-shadow-xl space-y-3">
            <ComicTitle level={4} className="text-[var(--comic-secondary)]">
              {title}
            </ComicTitle>
            {files.length > 0 ? (
              <ul className="space-y-3">
                {files.map((file, index) => (
                  <li key={`${file.key || file.url}-${index}`} className="space-y-2">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[var(--comic-secondary)] underline"
                    >
                      View / download
                      {file.file_name ? ` (${file.file_name})` : ` file ${index + 1}`}
                    </a>
                    {file.content_type?.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.url}
                        alt={`${submission.student_name} ${title} ${index + 1}`}
                        className="max-h-[28rem] w-full object-contain rounded-lg comic-border"
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <ComicText className="text-[var(--comic-dark)]">
                {row?.extra?.sent_via_line || row?.extra?.manual_delivery === 'line'
                  ? 'Student sent this in LINE. No file uploaded here.'
                  : row?.extra?.manual_delivery === 'file_upload'
                    ? 'Teacher marked file upload complete (no file stored here).'
                    : row?.extra?.manual_delivery === 'in_person'
                      ? 'Teacher marked this as turned in in person.'
                      : `No ${title.toLowerCase()} work yet.`}
              </ComicText>
            )}
            {settings.example_image_enabled && settings.example_image ? (
              <ComicText className="text-[var(--comic-dark)]">
                Teacher example was shown for this task.
              </ComicText>
            ) : null}
          </ComicCard>
        );
      })}

      {speaking ? (
        <ComicCard className="comic-shadow-xl space-y-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            {PROJECT_COMPONENT_LABELS.speaking}
          </ComicTitle>
          {speakingRow?.text_data === 'in_person' ? (
            <ComicText className="text-[var(--comic-dark)] font-bold">
              In-person presentation
            </ComicText>
          ) : speakingRow?.audio_url ? (
            <div className="space-y-2">
              <ComicAudioPlayer src={speakingRow.audio_url} />
              {speakingRow.duration_seconds ? (
                <ComicText className="text-[var(--comic-dark)]">
                  Duration: {Math.round(speakingRow.duration_seconds)}s
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
