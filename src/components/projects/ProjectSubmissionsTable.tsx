'use client';

import { useEffect, useMemo, useState } from 'react';
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
  formatUploadDeliveryLabel,
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
  const [message, setMessage] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [adding, setAdding] = useState(false);

  const uploadTasks = useMemo(
    () => project.components.filter((item) => isUploadTaskType(item.type) && item.enabled),
    [project.components]
  );
  const showSpeaking = project.components.some((item) => item.type === 'speaking' && item.enabled);
  const classOptions = useMemo(() => {
    const fromProject =
      project.class_names?.length > 0
        ? project.class_names
        : [project.class_label || project.class_name].filter(Boolean);
    return [...new Set(fromProject.map((item) => item.trim()).filter(Boolean))];
  }, [project.class_label, project.class_name, project.class_names]);

  const [classNumber, setClassNumber] = useState(classOptions[0] || '');
  const [studentNumbers, setStudentNumbers] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>(() =>
    uploadTasks.map((task) => task.id)
  );
  const [delivery, setDelivery] = useState<'file_upload' | 'line' | 'in_person'>('line');

  useEffect(() => {
    fetch(`/api/projects/${project.id}/submissions`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        setSubmissions(data.submissions || []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [project.id]);

  useEffect(() => {
    if (!classNumber && classOptions[0]) setClassNumber(classOptions[0]);
  }, [classNumber, classOptions]);

  const submittedCount = submissions.filter(
    (item) => item.status === 'submitted' || item.status === 'reviewed'
  ).length;

  function toggleComponent(componentId: string) {
    setSelectedComponentIds((current) =>
      current.includes(componentId)
        ? current.filter((id) => id !== componentId)
        : [...current, componentId]
    );
  }

  async function handleRemove(submission: ProjectSubmissionRow) {
    const label = formatSubmissionGroupLabel(submission);
    const confirmed = window.confirm(
      `Remove this submission for ${label}?\n\nThey will be able to start the project again.`
    );
    if (!confirmed) return;

    setRemovingId(submission.id);
    setError('');
    setMessage('');
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

  async function handleAddSubmission() {
    setAdding(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/projects/${project.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_number: classNumber,
          student_numbers: studentNumbers,
          component_ids: selectedComponentIds,
          delivery,
          status: 'submitted',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Failed to add submission.');
        return;
      }
      if (data.submission) {
        setSubmissions((current) => {
          const without = current.filter((item) => item.id !== data.submission.id);
          return [data.submission, ...without];
        });
      }
      setStudentNumbers('');
      setDelivery('line');
      setSelectedComponentIds(uploadTasks.map((task) => task.id));
      setShowAddRow(false);
      setMessage('Submission added and scored in the gradebook.');
    } catch {
      setError('Failed to add submission.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <ComicCard className="comic-shadow-xl overflow-x-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ComicTitle level={3} className="mb-2 text-[var(--comic-secondary)]">
            Student submissions
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {submissions.length} submission{submissions.length === 1 ? '' : 's'} · {submittedCount}{' '}
            submitted
          </ComicText>
        </div>
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowAddRow((current) => !current);
            setError('');
            setMessage('');
          }}
        >
          {showAddRow ? 'Cancel' : 'Add submission'}
        </ComicButton>
      </div>

      {error ? <ComicText className="text-[var(--comic-danger)] font-bold mb-4">{error}</ComicText> : null}
      {message ? (
        <ComicText className="text-[var(--comic-success)] font-bold mb-4">{message}</ComicText>
      ) : null}

      {showAddRow ? (
        <div className="mb-6 space-y-3 rounded-lg comic-border bg-white p-4">
          <ComicText className="text-[var(--comic-dark)] font-bold">
            Quick add for LINE (or file) turn-ins
          </ComicText>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="block font-bold text-[var(--comic-dark)]">
              Class
              <select
                className="mt-1 w-full comic-input"
                value={classNumber}
                onChange={(event) => setClassNumber(event.target.value)}
              >
                {classOptions.length === 0 ? (
                  <option value="">No classes on this project</option>
                ) : (
                  classOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="block font-bold text-[var(--comic-dark)] md:col-span-1 xl:col-span-1">
              Students
              <input
                className="mt-1 w-full comic-input"
                placeholder="18A, 11B, 3C"
                value={studentNumbers}
                onChange={(event) => setStudentNumbers(event.target.value)}
              />
            </label>
            <label className="block font-bold text-[var(--comic-dark)]">
              Submitted by
              <select
                className="mt-1 w-full comic-input"
                value={delivery}
                onChange={(event) => {
                  const value = event.target.value;
                  setDelivery(
                    value === 'file_upload'
                      ? 'file_upload'
                      : value === 'in_person'
                        ? 'in_person'
                        : 'line'
                  );
                }}
              >
                <option value="line">LINE</option>
                <option value="file_upload">File upload</option>
                <option value="in_person">In person</option>
              </select>
            </label>
            <label className="block font-bold text-[var(--comic-dark)]">
              Status
              <select className="mt-1 w-full comic-input" value="submitted" disabled>
                <option value="submitted">Submitted</option>
              </select>
            </label>
          </div>
          {uploadTasks.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {uploadTasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-2 font-bold text-[var(--comic-dark)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedComponentIds.includes(task.id)}
                    onChange={() => toggleComponent(task.id)}
                  />
                  {componentDisplayTitle(task)}
                </label>
              ))}
            </div>
          ) : null}
          <ComicButton
            type="button"
            variant="primary"
            size="sm"
            disabled={adding || !classNumber || !studentNumbers.trim()}
            onClick={() => void handleAddSubmission()}
          >
            {adding ? 'Adding…' : 'Add'}
          </ComicButton>
        </div>
      ) : null}

      {!loaded ? (
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading submissions…</ComicText>
      ) : submissions.length === 0 && !showAddRow ? (
        <ComicText className="text-[var(--comic-dark)] font-bold">
          No student work yet. Publish the project and share the student link, or use Add
          submission for LINE turn-ins.
        </ComicText>
      ) : submissions.length === 0 ? null : (
        <table className="w-full min-w-[40rem] text-left border-collapse">
          <thead>
            <tr className="border-b-4 border-[var(--comic-black)]">
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Class</th>
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Students</th>
              <th className="py-3 pr-3 font-bold text-[var(--comic-dark)]">Submitted by</th>
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
                <td className="py-3 pr-3 font-bold text-[var(--comic-dark)]">
                  {formatUploadDeliveryLabel(submission.upload_delivery || 'none')}
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
