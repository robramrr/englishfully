'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type {
  GradebookSeat,
  GradebookSemester,
  GradebookSettings,
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

interface ClassGradebookProps {
  classId: string;
}

export default function ClassGradebook({ classId }: ClassGradebookProps) {
  const searchParams = useSearchParams();
  const initialSemester = parseSemester(searchParams.get('semester'));
  const initialYear = searchParams.get('school_year') || '';

  const [settings, setSettings] = useState<GradebookSettings | null>(null);
  const [classLabel, setClassLabel] = useState('');
  const [seats, setSeats] = useState<GradebookSeat[]>([]);
  const [taskColumns, setTaskColumns] = useState<GradebookTaskColumn[]>([]);
  const [availableTasks, setAvailableTasks] = useState<GradebookTaskOption[]>([]);
  const [semester, setSemester] = useState<GradebookSemester>(initialSemester);
  const [schoolYear, setSchoolYear] = useState(initialYear);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [savingNumber, setSavingNumber] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [tool, setTool] = useState<GradebookTool>('speak_and_submit');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [maxPoints, setMaxPoints] = useState(String(DEFAULT_MAX_POINTS));
  const [passPercent, setPassPercent] = useState(String(LISTEN_PASS_PERCENT));
  const [applyingCutoff, setApplyingCutoff] = useState(false);
  const [bulkCorrect, setBulkCorrect] = useState('');
  const [bulkTotal, setBulkTotal] = useState('');
  const [applyingTestScore, setApplyingTestScore] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [draftCorrect, setDraftCorrect] = useState<Record<string, string>>({});
  const [draftTotal, setDraftTotal] = useState<Record<string, string>>({});
  const [draftRolls, setDraftRolls] = useState<Record<string, string>>({});
  const [savingRollNumber, setSavingRollNumber] = useState<string | null>(null);
  const [submittedNumbers, setSubmittedNumbers] = useState<Set<string>>(new Set());

  const filteredTasks = useMemo(
    () => availableTasks.filter((task) => task.tool === tool),
    [availableTasks, tool]
  );

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) || null;
  const activeTaskKey = selectedTask ? taskKey(tool, selectedTask.id) : '';
  const defaultTestTotal = selectedTask?.question_count ?? null;
  const isListen = tool === 'listen_and_answer';
  const activePassPercent = clampPassPercent(passPercent);

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

    setSettings(data.settings);
    setClassLabel(data.class_label);
    setSeats(data.seats || []);
    setTaskColumns(data.task_columns || []);
    setAvailableTasks(data.available_tasks || []);
    const nextRolls: Record<string, string> = {};
    for (const seat of (data.seats || []) as GradebookSeat[]) {
      nextRolls[seat.student_number] = seat.roll_number || '';
    }
    setDraftRolls(nextRolls);
    if (!schoolYear && data.settings.school_year) {
      setSchoolYear(data.settings.school_year);
    }
    setError('');
    setLoaded(true);
  }, [classId, schoolYear, semester]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  useEffect(() => {
    if (!selectedTaskId && filteredTasks.length > 0) {
      setSelectedTaskId(filteredTasks[0].id);
    }
    if (selectedTaskId && !filteredTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0]?.id || '');
    }
  }, [filteredTasks, selectedTaskId]);

  useEffect(() => {
    if (!isListen || !selectedTask) {
      setBulkCorrect('');
      setBulkTotal('');
      return;
    }
    setBulkCorrect('');
    setBulkTotal(selectedTask.question_count ? String(selectedTask.question_count) : '');
  }, [isListen, selectedTask?.id, selectedTask?.question_count]);

  useEffect(() => {
    if (!selectedTask) {
      setDraftScores({});
      setDraftCorrect({});
      setDraftTotal({});
      setSubmittedNumbers(new Set());
      return;
    }

    const nextDrafts: Record<string, string> = {};
    const nextCorrect: Record<string, string> = {};
    const nextTotal: Record<string, string> = {};
    for (const seat of seats) {
      const existing = seat.entries_by_task[taskKey(tool, selectedTask.id)];
      nextDrafts[seat.student_number] = existing ? String(existing.points) : '';
      nextCorrect[seat.student_number] =
        existing?.test_correct != null ? String(existing.test_correct) : '';
      nextTotal[seat.student_number] =
        existing?.test_total != null
          ? String(existing.test_total)
          : selectedTask.question_count
            ? String(selectedTask.question_count)
            : '';
    }
    setDraftScores(nextDrafts);
    setDraftCorrect(nextCorrect);
    setDraftTotal(nextTotal);

    const column = taskColumns.find(
      (item) => item.tool === tool && item.task_id === selectedTask.id
    );
    if (column) {
      setMaxPoints(String(column.max_points || DEFAULT_MAX_POINTS));
    } else {
      setMaxPoints(String(DEFAULT_MAX_POINTS));
    }

    // Always refresh Speak online indicators from submissions (source of truth).
    // Don't trust an empty column.submitted_student_numbers cache alone.
    if (tool === 'speak_and_submit') {
      const fromColumn = new Set(column?.submitted_student_numbers || []);
      setSubmittedNumbers(fromColumn);
      if (classLabel.trim()) {
        void fetch(
          `/api/gradebook/tasks?speak_task_id=${encodeURIComponent(selectedTask.id)}&class_label=${encodeURIComponent(classLabel)}`
        )
          .then((response) => response.json())
          .then((data) => {
            const fromApi = data.submitted_student_numbers || [];
            setSubmittedNumbers(new Set([...fromColumn, ...fromApi]));
          })
          .catch(() => {
            /* keep column-based set */
          });
      }
    } else {
      setSubmittedNumbers(new Set());
    }
  }, [selectedTask, seats, taskColumns, tool, classLabel]);

  async function clearEntry(studentNumber: string) {
    if (!selectedTask) return;
    const existing = seats.find((seat) => seat.student_number === studentNumber)?.entries_by_task[
      activeTaskKey
    ];
    if (!existing) {
      setDraftScores((prev) => ({ ...prev, [studentNumber]: '' }));
      setDraftCorrect((prev) => ({ ...prev, [studentNumber]: '' }));
      setDraftTotal((prev) => ({
        ...prev,
        [studentNumber]: defaultTestTotal ? String(defaultTestTotal) : '',
      }));
      return;
    }
    setSavingNumber(studentNumber);
    try {
      const response = await fetch(`/api/gradebook/entries?id=${existing.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear grade');
      }
      setMessage(`Cleared grade for #${studentNumber}`);
      await loadClass();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear grade');
    } finally {
      setSavingNumber(null);
    }
  }

  async function saveRollNumber(studentNumber: string, rawValue: string) {
    const digits = rawValue.replace(/\D/g, '').slice(0, 5);
    setDraftRolls((prev) => ({ ...prev, [studentNumber]: digits }));
    const current = seats.find((seat) => seat.student_number === studentNumber)?.roll_number || '';
    if (digits === (current || '')) return;
    if (digits && digits.length !== 5) {
      setError('Roll number must be exactly 5 digits (or leave blank).');
      return;
    }

    setSavingRollNumber(studentNumber);
    setError('');
    try {
      const response = await fetch('/api/gradebook/roster', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          class_label: classLabel,
          student_number: studentNumber,
          roll_number: digits,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save roll number');
      setSeats((prev) =>
        prev.map((seat) =>
          seat.student_number === studentNumber
            ? { ...seat, roll_number: data.roster?.roll_number || null }
            : seat
        )
      );
      setMessage(
        digits
          ? `Saved roll #${digits} for student #${studentNumber}`
          : `Cleared roll number for #${studentNumber}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save roll number');
      setDraftRolls((prev) => ({ ...prev, [studentNumber]: current }));
    } finally {
      setSavingRollNumber(null);
    }
  }

  async function saveScore(studentNumber: string, rawValue: string) {
    if (!selectedTask || !settings || isListen) return;
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      await clearEntry(studentNumber);
      return;
    }

    const points = Number(trimmed);
    if (!Number.isFinite(points)) {
      setError('Enter a valid number.');
      return;
    }

    setSavingNumber(studentNumber);
    setError('');
    try {
      const response = await fetch('/api/gradebook/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_year: schoolYear || settings.school_year,
          semester,
          class_id: classId,
          class_label: classLabel,
          student_number: studentNumber,
          tool,
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          points,
          max_points: Number(maxPoints) || DEFAULT_MAX_POINTS,
          test_correct: null,
          test_total: null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save grade');
      setMessage(`Saved #${studentNumber}: ${data.entry.points}/${data.entry.max_points}`);
      await loadClass();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    } finally {
      setSavingNumber(null);
    }
  }

  async function saveListenTestScore(studentNumber: string) {
    if (!selectedTask || !settings || !isListen) return;
    const correctRaw = (draftCorrect[studentNumber] ?? '').trim();
    const totalRaw = (draftTotal[studentNumber] ?? '').trim();

    // Empty correct field means "no score" — never coerce "" to 0 via Number('').
    // (Total often still has the default 25, which previously caused accidental 0/25 saves.)
    if (correctRaw === '') {
      await clearEntry(studentNumber);
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(correctRaw)) {
      setError('Enter a valid number of correct answers (or clear the field to remove the score).');
      return;
    }

    const correct = Number(correctRaw);
    const total = Number(totalRaw || defaultTestTotal || 0);
    if (!Number.isFinite(correct) || correct < 0) {
      setError('Enter a valid number of correct answers.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError('Enter a valid test total (e.g. 25).');
      return;
    }

    const existing = seats.find((seat) => seat.student_number === studentNumber)?.entries_by_task[
      activeTaskKey
    ];
    const max = Number(maxPoints) || DEFAULT_MAX_POINTS;
    const cutoff = clampPassPercent(passPercent);
    const autoPoints = gradePointsFromTestScore(correct, total, max, cutoff);
    const percent = getTestPercent(correct, total);

    // Skip no-op saves so clearing/editing isn't fought by a reload loop
    if (
      existing &&
      existing.test_correct === correct &&
      existing.test_total === total &&
      existing.points === autoPoints &&
      existing.max_points === max
    ) {
      return;
    }

    setSavingNumber(studentNumber);
    setError('');
    try {
      const response = await fetch('/api/gradebook/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_year: schoolYear || settings.school_year,
          semester,
          class_id: classId,
          class_label: classLabel,
          student_number: studentNumber,
          tool,
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          points: autoPoints,
          max_points: max,
          test_correct: correct,
          test_total: total,
          pass_percent: cutoff,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save grade');
      setDraftScores((prev) => ({
        ...prev,
        [studentNumber]: String(data.entry.points),
      }));
      setMessage(
        `Saved #${studentNumber}: test ${correct}/${total} (${Math.round(percent ?? 0)}%) → grade points ${data.entry.points}/${data.entry.max_points} (pass ≥${cutoff}%)`
      );
      await loadClass();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grade');
    } finally {
      setSavingNumber(null);
    }
  }

  async function fillSubmittedWithMax() {
    if (!selectedTask || tool !== 'speak_and_submit') return;
    const max = Number(maxPoints) || DEFAULT_MAX_POINTS;
    for (const studentNumber of submittedNumbers) {
      const current = draftScores[studentNumber];
      if (current.trim() !== '') continue;
      setDraftScores((prev) => ({ ...prev, [studentNumber]: String(max) }));
      await saveScore(studentNumber, String(max));
    }
  }

  async function applyCutoffToSavedScores(nextCutoffRaw?: string) {
    if (!selectedTask || !settings || !isListen) return;

    const cutoff = clampPassPercent(nextCutoffRaw ?? passPercent);
    setPassPercent(String(cutoff));

    const max = Number(maxPoints) || DEFAULT_MAX_POINTS;
    const toUpdate = seats.filter((seat) => {
      const entry = seat.entries_by_task[activeTaskKey];
      return (
        entry &&
        entry.test_correct != null &&
        entry.test_total != null &&
        entry.test_total > 0
      );
    });

    if (toUpdate.length === 0) {
      setMessage(
        `Pass cutoff set to ${cutoff}%. Enter or update test scores to apply it — no saved Listen scores to recalculate yet.`
      );
      return;
    }

    setApplyingCutoff(true);
    setError('');
    let updated = 0;
    let changed = 0;

    try {
      for (const seat of toUpdate) {
        const entry = seat.entries_by_task[activeTaskKey];
        if (!entry || entry.test_correct == null || entry.test_total == null) continue;

        const nextPoints = gradePointsFromTestScore(
          entry.test_correct,
          entry.test_total,
          max,
          cutoff
        );
        updated += 1;
        if (nextPoints === entry.points && entry.max_points === max) continue;
        changed += 1;

        const response = await fetch('/api/gradebook/entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_year: schoolYear || settings.school_year,
            semester,
            class_id: classId,
            class_label: classLabel,
            student_number: seat.student_number,
            tool,
            task_id: selectedTask.id,
            task_title: selectedTask.title,
            points: nextPoints,
            max_points: max,
            test_correct: entry.test_correct,
            test_total: entry.test_total,
            pass_percent: cutoff,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to update #${seat.student_number}`);
        }
      }

      await loadClass();
      setMessage(
        changed > 0
          ? `Applied ${cutoff}% cutoff: updated ${changed} of ${updated} saved test scores.`
          : `Pass cutoff is ${cutoff}%. All ${updated} saved scores already matched.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply cutoff');
    } finally {
      setApplyingCutoff(false);
    }
  }

  async function applyTestScoreToAll() {
    if (!selectedTask || !settings || !isListen) return;

    const correctRaw = bulkCorrect.trim();
    const totalRaw = bulkTotal.trim();

    if (correctRaw === '' || !/^\d+(\.\d+)?$/.test(correctRaw)) {
      setError('Enter the correct-answers value to apply (e.g. 18).');
      return;
    }
    if (totalRaw === '' || !/^\d+(\.\d+)?$/.test(totalRaw)) {
      setError('Enter the test total to apply (e.g. 22).');
      return;
    }

    const correct = Number(correctRaw);
    const total = Number(totalRaw);
    if (!Number.isFinite(correct) || correct < 0) {
      setError('Enter a valid number of correct answers.');
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setError('Enter a valid test total (e.g. 22).');
      return;
    }

    const max = Number(maxPoints) || DEFAULT_MAX_POINTS;
    const cutoff = clampPassPercent(passPercent);
    const autoPoints = gradePointsFromTestScore(correct, total, max, cutoff);
    const percent = getTestPercent(correct, total);

    setApplyingTestScore(true);
    setError('');

    const nextCorrect: Record<string, string> = {};
    const nextTotal: Record<string, string> = {};
    const nextScores: Record<string, string> = {};
    for (const seat of seats) {
      nextCorrect[seat.student_number] = String(correct);
      nextTotal[seat.student_number] = String(total);
      nextScores[seat.student_number] = String(autoPoints);
    }
    setDraftCorrect(nextCorrect);
    setDraftTotal(nextTotal);
    setDraftScores(nextScores);

    try {
      for (const seat of seats) {
        const response = await fetch('/api/gradebook/entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_year: schoolYear || settings.school_year,
            semester,
            class_id: classId,
            class_label: classLabel,
            student_number: seat.student_number,
            tool,
            task_id: selectedTask.id,
            task_title: selectedTask.title,
            points: autoPoints,
            max_points: max,
            test_correct: correct,
            test_total: total,
            pass_percent: cutoff,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || `Failed to update #${seat.student_number}`);
        }
      }

      await loadClass();
      setMessage(
        `Applied test score ${correct}/${total} (${Math.round(percent ?? 0)}%) to all ${seats.length} students → grade points ${autoPoints}/${max} (pass ≥${cutoff}%).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply test score');
    } finally {
      setApplyingTestScore(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/gradebook">
          <ComicButton variant="accent" size="sm">
            ← Back to Gradebook
          </ComicButton>
        </Link>
        <Link href="/teacher-resources/speak-and-submit">
          <ComicButton variant="secondary" size="sm">
            Speak submissions
          </ComicButton>
        </Link>
        {settings?.grades_slug ? (
          <Link href={`/grades/${settings.grades_slug}`} target="_blank">
            <ComicButton variant="warning" size="sm">
              Student grade lookup
            </ComicButton>
          </Link>
        ) : null}
      </div>

      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-2 text-[var(--comic-primary)]">
          Class {classLabel || '…'}
        </ComicTitle>
        <ComicText className="mb-4">
          {schoolYear || settings?.school_year || '—'} · Semester {semester}
        </ComicText>
        <div className="flex flex-wrap gap-2">
          <ComicButton
            type="button"
            variant={semester === 1 ? 'primary' : 'accent'}
            size="sm"
            onClick={() => {
              setSemester(1);
              setLoaded(false);
            }}
          >
            Semester 1
          </ComicButton>
          <ComicButton
            type="button"
            variant={semester === 2 ? 'primary' : 'accent'}
            size="sm"
            onClick={() => {
              setSemester(2);
              setLoaded(false);
            }}
          >
            Semester 2
          </ComicButton>
        </div>
      </ComicCard>

      <ComicCard className="comic-shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-secondary)]">
            Enter Grades
          </ComicTitle>
          {selectedTask ? (
            <Link
              href={`/teacher-resources/gradebook/${classId}/print?semester=${semester}&tool=${tool}&task_id=${encodeURIComponent(selectedTask.id)}&pass_percent=${encodeURIComponent(passPercent)}&max_points=${encodeURIComponent(maxPoints || String(DEFAULT_MAX_POINTS))}${
                schoolYear || settings?.school_year
                  ? `&school_year=${encodeURIComponent(schoolYear || settings?.school_year || '')}`
                  : ''
              }`}
            >
              <ComicButton variant="warning" size="sm">
                Print grades
              </ComicButton>
            </Link>
          ) : null}
        </div>
        <ComicText className="mb-4 text-[var(--comic-dark)] font-bold text-sm">
          Set each student’s 5-digit roll number in the Roll # column (used only for the student
          grade lookup page). Speak &amp; Listen tools stay unchanged.
        </ComicText>
        <div className={`grid gap-4 mb-4 ${isListen ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Tool</ComicText>
            <select
              className="w-full comic-input"
              value={tool}
              onChange={(event) => setTool(event.target.value as GradebookTool)}
            >
              <option value="speak_and_submit">{GRADEBOOK_TOOL_LABELS.speak_and_submit}</option>
              <option value="listen_and_answer">{GRADEBOOK_TOOL_LABELS.listen_and_answer}</option>
              <option value="listen_and_learn">{GRADEBOOK_TOOL_LABELS.listen_and_learn}</option>
            </select>
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Task</ComicText>
            <select
              className="w-full comic-input"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
            >
              {filteredTasks.length === 0 ? (
                <option value="">No tasks found</option>
              ) : (
                filteredTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                    {task.class_name ? ` (${task.class_name})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">
              {isListen ? 'Grade Points (max)' : 'Max Points'}
            </ComicText>
            <input
              className="w-full comic-input"
              value={maxPoints}
              onChange={(event) => setMaxPoints(event.target.value)}
              inputMode="numeric"
            />
          </div>
          {isListen ? (
            <div>
              <ComicText className="font-bold mb-1 text-sm">Pass cutoff (%)</ComicText>
              <div className="flex gap-2 items-center">
                <input
                  className="w-full comic-input"
                  value={passPercent}
                  onChange={(event) => setPassPercent(event.target.value)}
                  onBlur={() => void applyCutoffToSavedScores()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur();
                    }
                  }}
                  inputMode="numeric"
                  placeholder={String(LISTEN_PASS_PERCENT)}
                  disabled={applyingCutoff || applyingTestScore}
                />
                <ComicButton
                  type="button"
                  variant="success"
                  size="sm"
                  disabled={applyingCutoff || applyingTestScore || !selectedTask}
                  onClick={() => void applyCutoffToSavedScores()}
                >
                  {applyingCutoff ? 'Applying…' : 'Apply'}
                </ComicButton>
              </div>
            </div>
          ) : null}
          {isListen ? (
            <div className="md:col-span-2 lg:col-span-4">
              <ComicText className="font-bold mb-1 text-sm">
                Test Score (apply to all)
              </ComicText>
              <div className="flex flex-wrap gap-2 items-center">
                <input
                  className="comic-input w-20"
                  value={bulkCorrect}
                  onChange={(event) => setBulkCorrect(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void applyTestScoreToAll();
                  }}
                  inputMode="numeric"
                  placeholder="18"
                  disabled={applyingTestScore || applyingCutoff}
                  aria-label="Correct answers to apply to all"
                />
                <span className="font-bold">/</span>
                <input
                  className="comic-input w-20"
                  value={bulkTotal}
                  onChange={(event) => setBulkTotal(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void applyTestScoreToAll();
                  }}
                  inputMode="numeric"
                  placeholder={defaultTestTotal ? String(defaultTestTotal) : '22'}
                  disabled={applyingTestScore || applyingCutoff}
                  aria-label="Test total to apply to all"
                />
                <ComicButton
                  type="button"
                  variant="success"
                  size="sm"
                  disabled={applyingTestScore || applyingCutoff || !selectedTask || seats.length === 0}
                  onClick={() => void applyTestScoreToAll()}
                >
                  {applyingTestScore ? 'Applying…' : 'Apply'}
                </ComicButton>
              </div>
            </div>
          ) : null}
        </div>

        {tool === 'speak_and_submit' ? (
          <div className="flex flex-wrap gap-3 mb-4">
            <ComicText className="text-sm">
              Online recordings in this class: {submittedNumbers.size}
            </ComicText>
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              disabled={!selectedTask || submittedNumbers.size === 0}
              onClick={() => void fillSubmittedWithMax()}
            >
              Fill online submitters with max points
            </ComicButton>
          </div>
        ) : null}

        {isListen ? (
          <ComicText className="text-sm mb-4 text-[var(--comic-dark)]">
            Enter <strong>Test Score</strong> as correct / total (example 18/25), or use{' '}
            <strong>Test Score (apply to all)</strong> to set the same score for every student
            (example 18/22). Percentage is calculated automatically. If the score is{' '}
            {activePassPercent}% or higher, <strong>Grade Points</strong> become{' '}
            {maxPoints || DEFAULT_MAX_POINTS}/{maxPoints || DEFAULT_MAX_POINTS}; otherwise 0/
            {maxPoints || DEFAULT_MAX_POINTS}. Change <strong>Pass cutoff (%)</strong>, then press{' '}
            <strong>Apply</strong> (or leave the field) to recalculate all saved scores for this
            task. Default cutoff is {LISTEN_PASS_PERCENT}%.
            {defaultTestTotal
              ? ` This task defaults to ${defaultTestTotal} questions.`
              : ' Set the total questions if needed.'}
          </ComicText>
        ) : (
          <ComicText className="text-sm mb-4 text-[var(--comic-dark)]">
            Enter a score and press Enter or leave the field to save. Clear the field and leave it to
            remove a grade. In-person Speak completions can be graded here even without a recording.
          </ComicText>
        )}

        {!loaded ? (
          <ComicText className="font-bold">Loading roster…</ComicText>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b-4 border-[var(--comic-black)] text-left">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Roll #</th>
                  {tool === 'speak_and_submit' ? (
                    <th className="py-2 pr-3">Recording</th>
                  ) : null}
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
                  const hasRecording = submittedNumbers.has(seat.student_number);
                  const correctNum = Number(draftCorrect[seat.student_number]);
                  const totalNum = Number(
                    draftTotal[seat.student_number] || defaultTestTotal || 0
                  );
                  const livePercent =
                    isListen &&
                    Number.isFinite(correctNum) &&
                    Number.isFinite(totalNum) &&
                    totalNum > 0 &&
                    (draftCorrect[seat.student_number] ?? '').trim() !== ''
                      ? getTestPercent(correctNum, totalNum)
                      : null;
                  const liveGradePoints =
                    livePercent === null
                      ? draftScores[seat.student_number] || '—'
                      : String(
                          gradePointsFromTestScore(
                            correctNum,
                            totalNum,
                            Number(maxPoints) || DEFAULT_MAX_POINTS,
                            activePassPercent
                          )
                        );

                  return (
                    <tr
                      key={seat.student_number}
                      className="border-b border-[var(--comic-black)]/20"
                    >
                      <td className="py-2 pr-3 font-bold">{seat.student_number}</td>
                      <td className="py-2 pr-3">{seat.display_name || '—'}</td>
                      <td className="py-2 pr-3">
                        <input
                          className="comic-input w-24 tracking-wider font-bold"
                          inputMode="numeric"
                          maxLength={5}
                          placeholder="12345"
                          value={draftRolls[seat.student_number] ?? ''}
                          disabled={savingRollNumber === seat.student_number}
                          onChange={(event) =>
                            setDraftRolls((prev) => ({
                              ...prev,
                              [seat.student_number]: event.target.value.replace(/\D/g, '').slice(0, 5),
                            }))
                          }
                          onBlur={(event) =>
                            void saveRollNumber(seat.student_number, event.target.value)
                          }
                          aria-label={`Roll number for ${seat.student_number}`}
                        />
                      </td>
                      {tool === 'speak_and_submit' ? (
                        <td className="py-2 pr-3">
                          {hasRecording ? (
                            <span className="text-[var(--comic-success)] font-bold">Online</span>
                          ) : (
                            <span className="text-[var(--comic-dark)]">In person / none</span>
                          )}
                        </td>
                      ) : null}
                      {isListen ? (
                        <>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1">
                              <input
                                className="comic-input w-16"
                                value={draftCorrect[seat.student_number] ?? ''}
                                disabled={!selectedTask || savingNumber === seat.student_number}
                                onChange={(event) =>
                                  setDraftCorrect((prev) => ({
                                    ...prev,
                                    [seat.student_number]: event.target.value,
                                  }))
                                }
                                onBlur={() => void saveListenTestScore(seat.student_number)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') event.currentTarget.blur();
                                }}
                                inputMode="numeric"
                                placeholder="18"
                                aria-label={`Test correct answers for ${seat.student_number}`}
                              />
                              <span>/</span>
                              <input
                                className="comic-input w-16"
                                value={draftTotal[seat.student_number] ?? ''}
                                disabled={!selectedTask || savingNumber === seat.student_number}
                                onChange={(event) =>
                                  setDraftTotal((prev) => ({
                                    ...prev,
                                    [seat.student_number]: event.target.value,
                                  }))
                                }
                                onBlur={() => void saveListenTestScore(seat.student_number)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') event.currentTarget.blur();
                                }}
                                inputMode="numeric"
                                placeholder={defaultTestTotal ? String(defaultTestTotal) : '25'}
                                aria-label={`Test total questions for ${seat.student_number}`}
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-3 font-bold">
                            {livePercent === null ? '—' : `${Math.round(livePercent)}%`}
                          </td>
                          <td className="py-2 pr-3 font-bold">
                            {liveGradePoints}
                            <span className="font-normal text-sm">
                              {' '}
                              / {maxPoints || DEFAULT_MAX_POINTS}
                            </span>
                          </td>
                        </>
                      ) : (
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-2">
                            <input
                              className="comic-input w-20"
                              value={draftScores[seat.student_number] ?? ''}
                              disabled={!selectedTask || savingNumber === seat.student_number}
                              onChange={(event) =>
                                setDraftScores((prev) => ({
                                  ...prev,
                                  [seat.student_number]: event.target.value,
                                }))
                              }
                              onBlur={(event) =>
                                void saveScore(seat.student_number, event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.currentTarget.blur();
                                }
                              }}
                              inputMode="decimal"
                              placeholder="—"
                            />
                            <span className="text-sm">/ {maxPoints || DEFAULT_MAX_POINTS}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-2 font-bold">
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
          </div>
        )}

        {message ? (
          <ComicText className="text-[var(--comic-success)] font-bold mt-4">{message}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold mt-4">{error}</ComicText>
        ) : null}
      </ComicCard>

      {taskColumns.length > 0 ? (
        <ComicCard className="comic-shadow-xl overflow-x-auto">
          <ComicTitle level={3} className="comic-title-no-shadow mb-4 text-[var(--comic-primary)]">
            All Graded Tasks
          </ComicTitle>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b-4 border-[var(--comic-black)] text-left">
                <th className="py-2 pr-2">#</th>
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
                <tr key={`summary-${seat.student_number}`} className="border-b border-black/10">
                  <td className="py-2 pr-2 font-bold">{seat.student_number}</td>
                  {taskColumns.map((column) => {
                    const entry = seat.entries_by_task[column.task_key];
                    if (!entry) {
                      return (
                        <td key={`${seat.student_number}-${column.task_key}`} className="py-2 pr-2">
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={`${seat.student_number}-${column.task_key}`} className="py-2 pr-2">
                        {column.tool === 'listen_and_answer' &&
                        entry.test_correct != null &&
                        entry.test_total != null ? (
                          <div>
                            <div>{formatTestScore(entry.test_correct, entry.test_total)}</div>
                            <div className="text-xs">
                              Grade pts {entry.points}/{entry.max_points}
                            </div>
                          </div>
                        ) : (
                          `${entry.points}/${entry.max_points}`
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 font-bold">
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
        </ComicCard>
      ) : null}
    </div>
  );
}
