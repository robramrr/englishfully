'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import ComicAudioPlayer from '../ComicAudioPlayer';

interface SubmissionRow {
  id: string;
  task_item_id: string;
  student_name: string;
  student_number: string;
  class_number: string;
  audio_url: string;
  duration_seconds: number | null;
  submitted_at: string;
  item_content: string;
  item_order: number;
}

interface StudentGroup {
  student_name: string;
  student_number: string;
  class_number: string;
  submissions: SubmissionRow[];
}

interface SubmissionsDashboardProps {
  taskId: string;
}

export default function SubmissionsDashboard({ taskId }: SubmissionsDashboardProps) {
  const [students, setStudents] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'student_number' | 'submitted_at'>('student_number');
  const [error, setError] = useState('');

  async function loadSubmissions(nextSort = sort) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/speak-and-submit/tasks/${taskId}/submissions?sort=${nextSort}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load submissions.');
        return;
      }
      setStudents(data.students || []);
    } catch {
      setError('Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  function handleSortChange(nextSort: 'student_number' | 'submitted_at') {
    setSort(nextSort);
    loadSubmissions(nextSort);
  }

  if (loading) {
    return <ComicText className="text-[var(--comic-dark)] font-bold">Loading submissions…</ComicText>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          🎧 Submissions
        </ComicTitle>
        <div className="flex flex-wrap gap-3">
          <ComicButton
            variant={sort === 'student_number' ? 'secondary' : 'accent'}
            size="sm"
            onClick={() => handleSortChange('student_number')}
          >
            Sort by student #
          </ComicButton>
          <ComicButton
            variant={sort === 'submitted_at' ? 'secondary' : 'accent'}
            size="sm"
            onClick={() => handleSortChange('submitted_at')}
          >
            Sort by time
          </ComicButton>
          <ComicButton
            variant="warning"
            size="sm"
            href={`/api/speak-and-submit/tasks/${taskId}/download`}
          >
            Download all
          </ComicButton>
        </div>
      </div>

      {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

      {students.length === 0 ? (
        <ComicCard className="comic-shadow-lg text-center">
          <ComicText className="text-[var(--comic-dark)] font-bold">
            No student submissions yet. Share the QR code or printable handout to get started.
          </ComicText>
        </ComicCard>
      ) : (
        students.map((student) => (
          <ComicCard key={`${student.student_number}-${student.class_number}-${student.student_name}`} className="comic-shadow-lg">
            <ComicTitle level={4} className="mb-2 text-[var(--comic-primary)]">
              {student.student_name}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Student #{student.student_number} · Class {student.class_number}
            </ComicText>
            <div className="space-y-4">
              {student.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border-t-4 border-[var(--comic-black)] pt-4"
                >
                  <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                    Item {submission.item_order + 1}: {submission.item_content}
                  </ComicText>
                  <ComicAudioPlayer src={submission.audio_url} className="mb-2" />
                  <ComicText className="text-[var(--comic-dark)] text-sm">
                    {submission.duration_seconds ? `${Math.round(submission.duration_seconds)}s · ` : ''}
                    {new Date(submission.submitted_at).toLocaleString()}
                  </ComicText>
                </div>
              ))}
            </div>
          </ComicCard>
        ))
      )}
    </div>
  );
}
