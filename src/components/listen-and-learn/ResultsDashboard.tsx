'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { LearnSubmission } from '@/lib/listen-and-learn/types';

interface ResultsDashboardProps {
  assignmentId: string;
  title: string;
  passingScore: number;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ResultsDashboard({
  assignmentId,
  title,
  passingScore,
}: ResultsDashboardProps) {
  const [submissions, setSubmissions] = useState<LearnSubmission[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(
        `/api/listen-and-learn/assignments/${assignmentId}/submissions`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load results');
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
      setSubmissions([]);
    } finally {
      setLoaded(true);
    }
  }, [assignmentId]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  if (!loaded) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading results…</ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6">
      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-2 text-[var(--comic-primary)]">
          {title || 'Listen & Learn'} — Results
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
          {submissions.length} submission{submissions.length === 1 ? '' : 's'} · Passing score{' '}
          {passingScore}%
        </ComicText>
        <ComicButton variant="accent" size="sm" onClick={() => void loadSubmissions()}>
          Refresh
        </ComicButton>
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold mt-3">{error}</ComicText>
        ) : null}
      </ComicCard>

      {submissions.length === 0 ? (
        <ComicCard className="comic-shadow-xl text-center">
          <ComicText className="text-[var(--comic-dark)] font-bold">
            No student submissions yet.
          </ComicText>
        </ComicCard>
      ) : (
        <div className="overflow-x-auto comic-border-thick rounded-lg bg-white">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--comic-primary)] text-white">
                <th className="p-3 font-black">Student</th>
                <th className="p-3 font-black">#</th>
                <th className="p-3 font-black">Class</th>
                <th className="p-3 font-black">Score</th>
                <th className="p-3 font-black">%</th>
                <th className="p-3 font-black">Attempt</th>
                <th className="p-3 font-black">Time</th>
                <th className="p-3 font-black">Submitted</th>
                <th className="p-3 font-black">Details</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const passed = submission.percent >= passingScore;
                return (
                  <Fragment key={submission.id}>
                    <tr className="border-t-2 border-[var(--comic-black)]">
                      <td className="p-3 font-bold">{submission.student_name}</td>
                      <td className="p-3 font-bold">{submission.student_number}</td>
                      <td className="p-3 font-bold">{submission.class_number}</td>
                      <td className="p-3 font-bold">
                        {submission.score}/{submission.max_score}
                      </td>
                      <td className="p-3 font-bold">
                        <span
                          className={
                            passed ? 'text-[var(--comic-success)]' : 'text-[var(--comic-danger)]'
                          }
                        >
                          {submission.percent.toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-3 font-bold">{submission.attempt_number}</td>
                      <td className="p-3 font-bold">
                        {formatDuration(submission.duration_seconds)}
                      </td>
                      <td className="p-3 font-bold text-sm">
                        {formatDate(submission.submitted_at)}
                      </td>
                      <td className="p-3">
                        <ComicButton
                          variant="accent"
                          size="sm"
                          onClick={() =>
                            setExpandedId((current) =>
                              current === submission.id ? null : submission.id
                            )
                          }
                        >
                          {expandedId === submission.id ? 'Hide' : 'Answers'}
                        </ComicButton>
                      </td>
                    </tr>
                    {expandedId === submission.id ? (
                      <tr>
                        <td colSpan={9} className="p-4 bg-[var(--comic-light)]">
                          <div className="space-y-2">
                            {submission.answers.map((answer, index) => (
                              <ComicText
                                key={`${answer.question_id}-${index}`}
                                className={`font-bold ${
                                  answer.is_correct
                                    ? 'text-[var(--comic-success)]'
                                    : 'text-[var(--comic-danger)]'
                                }`}
                              >
                                Q{index + 1}: {answer.is_correct ? '✓' : '✗'}{' '}
                                {answer.selected_answer || '(no answer)'}
                              </ComicText>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
