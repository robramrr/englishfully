'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface ClassGroup {
  class_number: string;
  students: StudentGroup[];
}

interface SubmissionsDashboardProps {
  taskId: string;
}

function studentKey(student: Pick<StudentGroup, 'class_number' | 'student_number' | 'student_name'>) {
  return `${student.class_number}::${student.student_number}::${student.student_name}`;
}

function parseStudentNumber(value: string): number {
  const match = value.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

function groupStudentsByClass(students: StudentGroup[]): ClassGroup[] {
  const map = new Map<string, StudentGroup[]>();
  for (const student of students) {
    const existing = map.get(student.class_number) ?? [];
    existing.push(student);
    map.set(student.class_number, existing);
  }

  return Array.from(map.entries())
    .map(([class_number, classStudents]) => ({
      class_number,
      students: classStudents,
    }))
    .sort((a, b) =>
      a.class_number.localeCompare(b.class_number, undefined, { numeric: true, sensitivity: 'base' })
    );
}

function sortStudentsInClass(
  students: StudentGroup[],
  sort: 'student_number' | 'submitted_at'
): StudentGroup[] {
  return [...students].sort((a, b) => {
    if (sort === 'submitted_at') {
      const latestA = Math.max(...a.submissions.map((row) => new Date(row.submitted_at).getTime()));
      const latestB = Math.max(...b.submissions.map((row) => new Date(row.submitted_at).getTime()));
      return latestB - latestA;
    }

    const numA = parseStudentNumber(a.student_number);
    const numB = parseStudentNumber(b.student_number);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
      return numA - numB;
    }
    return a.student_number.localeCompare(b.student_number);
  });
}

function sortClasses(classes: ClassGroup[], sort: 'student_number' | 'submitted_at'): ClassGroup[] {
  return [...classes]
    .map((classGroup) => ({
      ...classGroup,
      students: sortStudentsInClass(classGroup.students, sort),
    }))
    .sort((a, b) => {
      if (sort === 'submitted_at') {
        const latestA = Math.max(
          ...a.students.flatMap((student) =>
            student.submissions.map((row) => new Date(row.submitted_at).getTime())
          )
        );
        const latestB = Math.max(
          ...b.students.flatMap((student) =>
            student.submissions.map((row) => new Date(row.submitted_at).getTime())
          )
        );
        return latestB - latestA;
      }
      return a.class_number.localeCompare(b.class_number, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
}

export default function SubmissionsDashboard({ taskId }: SubmissionsDashboardProps) {
  const [students, setStudents] = useState<StudentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'student_number' | 'submitted_at'>('student_number');
  const [error, setError] = useState('');
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

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

  const classGroups = useMemo(
    () => sortClasses(groupStudentsByClass(students), sort),
    [students, sort]
  );

  function handleSortChange(nextSort: 'student_number' | 'submitted_at') {
    setSort(nextSort);
    loadSubmissions(nextSort);
  }

  function toggleClass(classNumber: string) {
    setExpandedClasses((current) => {
      const next = new Set(current);
      if (next.has(classNumber)) {
        next.delete(classNumber);
      } else {
        next.add(classNumber);
      }
      return next;
    });
  }

  function toggleStudent(student: StudentGroup) {
    const key = studentKey(student);
    setExpandedStudents((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
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

      {classGroups.length === 0 ? (
        <ComicCard className="comic-shadow-lg text-center">
          <ComicText className="text-[var(--comic-dark)] font-bold">
            No student submissions yet. Share the QR code or printable handout to get started.
          </ComicText>
        </ComicCard>
      ) : (
        <div className="space-y-4">
          {classGroups.map((classGroup) => {
            const classOpen = expandedClasses.has(classGroup.class_number);

            return (
              <ComicCard key={classGroup.class_number} className="comic-shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleClass(classGroup.class_number)}
                  className="w-full text-left flex items-center justify-between gap-4"
                >
                  <div>
                    <ComicTitle level={4} className="text-[var(--comic-primary)]">
                      Class {classGroup.class_number}
                    </ComicTitle>
                    <ComicText className="text-[var(--comic-dark)] font-bold">
                      {classGroup.students.length} student
                      {classGroup.students.length === 1 ? '' : 's'}
                    </ComicText>
                  </div>
                  <span className="font-bungee text-xl text-[var(--comic-secondary)] shrink-0">
                    {classOpen ? '▼' : '▶'}
                  </span>
                </button>

                {classOpen ? (
                  <div className="mt-4 space-y-3 border-t-4 border-[var(--comic-black)] pt-4">
                    {classGroup.students.map((student) => {
                      const key = studentKey(student);
                      const studentOpen = expandedStudents.has(key);
                      const sortedSubmissions = [...student.submissions].sort(
                        (a, b) => a.item_order - b.item_order
                      );

                      return (
                        <div
                          key={key}
                          className="comic-border bg-white rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => toggleStudent(student)}
                            className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-[var(--comic-light)]"
                          >
                            <div>
                              <ComicText className="text-[var(--comic-dark)] font-bold text-lg">
                                {student.student_name}
                              </ComicText>
                              <ComicText className="text-[var(--comic-secondary)] font-bold">
                                Student #{student.student_number} · {sortedSubmissions.length} recording
                                {sortedSubmissions.length === 1 ? '' : 's'}
                              </ComicText>
                            </div>
                            <span className="font-bungee text-lg text-[var(--comic-secondary)] shrink-0">
                              {studentOpen ? '▼' : '▶'}
                            </span>
                          </button>

                          {studentOpen ? (
                            <div className="border-t-4 border-[var(--comic-black)] px-4 py-4 space-y-4 bg-[var(--comic-light)]">
                              {sortedSubmissions.map((submission) => (
                                <div
                                  key={submission.id}
                                  className="comic-border bg-white rounded-lg p-4"
                                >
                                  <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                                    Item {submission.item_order + 1}: {submission.item_content}
                                  </ComicText>
                                  <ComicAudioPlayer src={submission.audio_url} className="mb-2" />
                                  <ComicText className="text-[var(--comic-dark)] text-sm">
                                    {submission.duration_seconds
                                      ? `${Math.round(submission.duration_seconds)}s · `
                                      : ''}
                                    {new Date(submission.submitted_at).toLocaleString()}
                                  </ComicText>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </ComicCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
