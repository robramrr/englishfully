'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type {
  GradebookSeat,
  GradebookSemester,
  GradebookTaskColumn,
  GradebookTaskOption,
  GradebookTool,
} from '@/lib/gradebook/types';
import {
  DEFAULT_MAX_POINTS,
  GRADEBOOK_TOOL_LABELS,
  LISTEN_PASS_PERCENT,
  formatPercent,
  formatTestScore,
  getTestPercent,
  gradePointsFromTestScore,
  parseSemester,
  runningTotalHighlightClass,
  taskKey,
  clampPassPercent,
} from '@/lib/gradebook/types';

interface PrintGradebookProps {
  classId: string;
}

export default function PrintGradebook({ classId }: PrintGradebookProps) {
  const searchParams = useSearchParams();
  const semester = parseSemester(searchParams.get('semester')) as GradebookSemester;
  const schoolYear = searchParams.get('school_year') || '';
  const view = searchParams.get('view') || '';
  const allTasksOnly = view === 'all_tasks';
  const tool = (searchParams.get('tool') as GradebookTool) || 'listen_and_answer';
  const taskId = searchParams.get('task_id') || '';
  const passPercent = clampPassPercent(searchParams.get('pass_percent') || LISTEN_PASS_PERCENT);
  const maxPointsParam = Number(searchParams.get('max_points'));
  const maxPoints = Number.isFinite(maxPointsParam) && maxPointsParam > 0
    ? maxPointsParam
    : DEFAULT_MAX_POINTS;

  const [classLabel, setClassLabel] = useState('');
  const [seats, setSeats] = useState<GradebookSeat[]>([]);
  const [taskColumns, setTaskColumns] = useState<GradebookTaskColumn[]>([]);
  const [availableTasks, setAvailableTasks] = useState<GradebookTaskOption[]>([]);
  const [resolvedYear, setResolvedYear] = useState(schoolYear);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const loadClass = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('semester', String(semester));
    if (schoolYear) params.set('school_year', schoolYear);
    const response = await fetch(`/api/gradebook/class/${classId}?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load class gradebook.');
      setLoaded(true);
      return;
    }
    setClassLabel(data.class_label || '');
    setSeats(data.seats || []);
    setTaskColumns(data.task_columns || []);
    setAvailableTasks(data.available_tasks || []);
    setResolvedYear(schoolYear || data.settings?.school_year || '');
    setError('');
    setLoaded(true);
  }, [classId, schoolYear, semester]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  useEffect(() => {
    if (!loaded || !allTasksOnly) return;
    const classPart = (classLabel || 'Class').replace(/\//g, '-');
    const yearPart = resolvedYear || 'School-Year';
    document.title = `Class ${classPart} · ${yearPart} · Semester ${semester} · Gradebook`;
  }, [loaded, allTasksOnly, classLabel, resolvedYear, semester]);

  const selectedTask = useMemo(
    () =>
      availableTasks.find((task) => task.tool === tool && task.id === taskId) ||
      availableTasks.find((task) => task.tool === tool) ||
      null,
    [availableTasks, taskId, tool]
  );

  const activeTaskKey = selectedTask ? taskKey(tool, selectedTask.id) : '';
  const isListen = tool === 'listen_and_answer';
  const backHref = `/teacher-resources/gradebook/${classId}?semester=${semester}${
    resolvedYear ? `&school_year=${encodeURIComponent(resolvedYear)}` : ''
  }`;

  const printedOn = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!loaded) {
    return (
      <div className="p-8 text-center">
        <ComicText className="font-bold">Loading printable gradebook…</ComicText>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        <Link href={backHref}>
          <ComicButton variant="accent" size="sm">
            Back to gradebook
          </ComicButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="gradebook-print-page min-h-screen bg-white text-[var(--comic-dark)]">
      <style jsx global>{`
        @media print {
          /* Site chrome only — do not hide .print-doc-header (the PDF title block). */
          body > header,
          body > footer,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .gradebook-print-page {
            background: white !important;
          }
          .print-page {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-doc-header {
            display: block !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-doc-header h1,
          .print-doc-header p {
            color: #000 !important;
          }
          .print-table th,
          .print-table td {
            font-size: 11pt;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      <div className="no-print bg-[var(--comic-light)] px-4 py-6 text-center space-y-3">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={backHref}>
            <ComicButton variant="accent" size="sm">
              ← Back to gradebook
            </ComicButton>
          </Link>
          <ComicButton variant="secondary" size="sm" onClick={() => window.print()}>
            {allTasksOnly ? 'Print / Save as PDF' : 'Print'}
          </ComicButton>
        </div>
        <ComicText className="font-bold text-sm">
          {allTasksOnly
            ? 'Use Print → Save as PDF for a clean gradebook export (toolbar controls are hidden when printing).'
            : 'Print this page for a clean grade sheet (header and controls are hidden when printing).'}
        </ComicText>
      </div>

      <main className="print-page max-w-4xl mx-auto px-6 py-8">
        <div className="print-doc-header mb-6 border-b-2 border-[var(--comic-black)] pb-4">
          <h1 className="comic-title comic-title-no-shadow text-2xl md:text-3xl text-[var(--comic-primary)] mb-2">
            Gradebook
          </h1>
          <p className="font-bold text-lg">
            Class {classLabel || '—'} · {resolvedYear || '—'} · Semester {semester}
          </p>
          {!allTasksOnly && selectedTask ? (
            <p className="font-bold mt-1">
              {GRADEBOOK_TOOL_LABELS[tool]} — {selectedTask.title}
              {selectedTask.class_name ? ` (${selectedTask.class_name})` : ''}
            </p>
          ) : null}
          {!allTasksOnly && !selectedTask ? (
            <p className="font-bold mt-1">{GRADEBOOK_TOOL_LABELS[tool]}</p>
          ) : null}
          {!allTasksOnly && isListen ? (
            <p className="text-sm mt-1">
              Pass cutoff {passPercent}% · Grade points max {maxPoints}
            </p>
          ) : null}
          {!allTasksOnly && !isListen ? (
            <p className="text-sm mt-1">Max points {maxPoints}</p>
          ) : null}
          <p className="text-sm mt-1">Printed {printedOn}</p>
        </div>

        {!allTasksOnly && selectedTask ? (
          <section className="mb-8">
            <h2 className="comic-title comic-title-no-shadow text-xl text-[var(--comic-secondary)] mb-3">
              Task scores
            </h2>
            <table className="print-table w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--comic-black)] text-left">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Name</th>
                  {isListen ? (
                    <>
                      <th className="py-2 pr-3">Test Score</th>
                      <th className="py-2 pr-3">%</th>
                      <th className="py-2 pr-3">Grade Points</th>
                    </>
                  ) : (
                    <th className="py-2 pr-3">Score</th>
                  )}
                  <th className="py-2">Running total</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((seat) => {
                  const entry = seat.entries_by_task[activeTaskKey];
                  const correct = entry?.test_correct ?? null;
                  const total = entry?.test_total ?? null;
                  const percent =
                    isListen && correct != null && total != null && total > 0
                      ? getTestPercent(correct, total)
                      : null;
                  const gradePoints =
                    isListen && correct != null && total != null
                      ? gradePointsFromTestScore(correct, total, maxPoints, passPercent)
                      : entry?.points;

                  return (
                    <tr
                      key={seat.student_number}
                      className="border-b border-[var(--comic-black)]/25"
                    >
                      <td className="py-1.5 pr-3 font-bold">{seat.student_number}</td>
                      <td className="py-1.5 pr-3">{seat.display_name || '—'}</td>
                      {isListen ? (
                        <>
                          <td className="py-1.5 pr-3">
                            {correct != null && total != null
                              ? formatTestScore(correct, total)
                              : '—'}
                          </td>
                          <td className="py-1.5 pr-3">
                            {percent === null ? '—' : `${Math.round(percent)}%`}
                          </td>
                          <td className="py-1.5 pr-3">
                            {gradePoints != null
                              ? `${gradePoints}/${entry?.max_points ?? maxPoints}`
                              : '—'}
                          </td>
                        </>
                      ) : (
                        <td className="py-1.5 pr-3">
                          {entry
                            ? `${entry.points}/${entry.max_points}`
                            : '—'}
                        </td>
                      )}
                      <td className="py-1.5 font-bold">
                        {seat.total_possible > 0
                          ? `${seat.total_earned}/${seat.total_possible} (${formatPercent(
                              seat.total_earned,
                              seat.total_possible
                            )})`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : !allTasksOnly ? (
          <ComicText className="font-bold mb-8">No task selected for this printout.</ComicText>
        ) : null}

        {taskColumns.length > 0 ? (
          <section>
            {!allTasksOnly ? (
              <h2 className="comic-title comic-title-no-shadow text-xl text-[var(--comic-primary)] mb-3">
                All graded tasks
              </h2>
            ) : null}
            <table className="print-table w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[var(--comic-black)] text-left">
                  <th className="py-2 pr-2">#</th>
                  {allTasksOnly ? null : <th className="py-2 pr-2">Name</th>}
                  {taskColumns.map((column) => (
                    <th key={column.task_key} className="py-2 pr-2">
                      <div>{GRADEBOOK_TOOL_LABELS[column.tool]}</div>
                      <div className="font-normal">{column.task_title}</div>
                    </th>
                  ))}
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((seat) => (
                  <tr
                    key={`summary-${seat.student_number}`}
                    className="border-b border-[var(--comic-black)]/25"
                  >
                    <td className="py-1.5 pr-2 font-bold">{seat.student_number}</td>
                    {allTasksOnly ? null : (
                      <td className="py-1.5 pr-2">{seat.display_name || '—'}</td>
                    )}
                    {taskColumns.map((column) => {
                      const entry = seat.entries_by_task[column.task_key];
                      if (!entry) {
                        return (
                          <td key={`${seat.student_number}-${column.task_key}`} className="py-1.5 pr-2">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={`${seat.student_number}-${column.task_key}`} className="py-1.5 pr-2">
                          {column.tool === 'listen_and_answer' &&
                          entry.test_correct != null &&
                          entry.test_total != null ? (
                            <div>
                              <div>{formatTestScore(entry.test_correct, entry.test_total)}</div>
                              <div className="text-xs">
                                {entry.points}/{entry.max_points} pts
                              </div>
                            </div>
                          ) : (
                            `${entry.points}/${entry.max_points}`
                          )}
                        </td>
                      );
                    })}
                    <td className="py-1.5 font-bold">
                      {seat.total_possible > 0 ? (
                        <span
                          className={runningTotalHighlightClass(
                            seat.total_earned,
                            seat.total_possible
                          )}
                        >
                          {seat.total_earned}/{seat.total_possible}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </main>
    </div>
  );
}
