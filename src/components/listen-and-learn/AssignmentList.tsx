'use client';

import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { LearnAssignmentListItem } from '@/lib/listen-and-learn/types';

interface AssignmentListProps {
  assignments: LearnAssignmentListItem[];
  onRefresh: () => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AssignmentList({ assignments, onRefresh }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
          No Listen &amp; Learn assessments yet
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Create your first short-listening assessment above.
        </ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {assignments.map((assignment) => (
        <ComicCard key={assignment.id} className="comic-shadow-xl flex flex-col">
          <ComicTitle level={4} className="mb-2 text-[var(--comic-primary)]">
            {assignment.title || 'Untitled Listen & Learn'}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-1">
            Class: {assignment.class_name || '—'}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-1">
            {assignment.selected_segment_count}/{assignment.segment_count} segments ·{' '}
            {assignment.question_count} question{assignment.question_count === 1 ? '' : 's'} ·{' '}
            {assignment.submission_count} submission
            {assignment.submission_count === 1 ? '' : 's'}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4 text-sm">
            Updated {formatDate(assignment.updated_at)} · {assignment.status}
          </ComicText>
          <div className="mt-auto flex flex-col gap-3">
            <Link href={`/teacher-resources/listen-and-learn/${assignment.id}`}>
              <ComicButton variant="secondary" size="sm" className="w-full">
                Edit assessment
              </ComicButton>
            </Link>
            <Link href={`/teacher-resources/listen-and-learn/${assignment.id}/results`}>
              <ComicButton variant="warning" size="sm" className="w-full">
                View results
              </ComicButton>
            </Link>
          </div>
        </ComicCard>
      ))}
      <div className="md:col-span-2 text-center">
        <ComicButton variant="accent" size="sm" onClick={onRefresh}>
          Refresh assessment list
        </ComicButton>
      </div>
    </div>
  );
}
