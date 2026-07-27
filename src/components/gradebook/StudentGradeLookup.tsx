'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { StudentGradeLookupResult } from '@/lib/gradebook/types';
import {
  GRADEBOOK_TOOL_LABELS,
  formatTestScore,
  normalizeRollNumber,
} from '@/lib/gradebook/types';
import { STUDENT_LETTER_OPTIONS } from '@/lib/speak-and-submit/types';

interface PublicClassOption {
  id: string;
  label: string;
  letter_enabled: boolean;
}

export default function StudentGradeLookup() {
  const [classes, setClasses] = useState<PublicClassOption[]>([]);
  const [classId, setClassId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentLetter, setStudentLetter] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<StudentGradeLookupResult | null>(null);

  useEffect(() => {
    fetch('/api/grades/classes', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const next = (data.classes || []) as PublicClassOption[];
        setClasses(next);
        if (next.length > 0) setClassId(next[0].id);
      })
      .catch(() => setError('Could not load classes.'))
      .finally(() => setLoadingClasses(false));
  }, []);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId) ?? null,
    [classes, classId]
  );
  const letterEnabled = Boolean(selectedClass?.letter_enabled);
  const maxSeat = 40;
  const numberOptions = useMemo(
    () => Array.from({ length: maxSeat }, (_, index) => String(index + 1)),
    []
  );

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    setError('');
    setGrade(null);

    if (!classId) {
      setError('Please select your class.');
      return;
    }
    if (!studentNumber) {
      setError('Please select your student number.');
      return;
    }
    if (letterEnabled && !studentLetter) {
      setError('Please select your letter (A or B).');
      return;
    }
    const roll = normalizeRollNumber(rollNumber);
    if (roll.length !== 5) {
      setError('Enter your 5-digit roll number.');
      return;
    }

    setChecking(true);
    try {
      const response = await fetch('/api/grades/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: classId,
          student_number: studentNumber,
          student_letter: letterEnabled ? studentLetter : '',
          roll_number: roll,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.grade) {
        setError(data.error || 'No grades found for that information.');
        return;
      }
      setGrade(data.grade as StudentGradeLookupResult);
    } catch {
      setError('Could not look up grades. Try again.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Check My Grades
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Enter your class, student number{letterEnabled ? ' + letter' : ''}, and your 5-digit roll
          number from your teacher.
        </ComicText>

        {loadingClasses ? (
          <ComicText className="font-bold">Loading classes…</ComicText>
        ) : classes.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No classes are set up yet. Ask your teacher to add classes in Speak &amp; Submit
            settings.
          </ComicText>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void handleLookup(event)}>
            <label className="block space-y-1">
              <ComicText className="font-black text-sm">Class</ComicText>
              <select
                className="w-full comic-input"
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setStudentLetter('');
                  setGrade(null);
                }}
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div className={`grid gap-3 ${letterEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <label className="block space-y-1">
                <ComicText className="font-black text-sm">Student number</ComicText>
                <select
                  className="w-full comic-input"
                  value={studentNumber}
                  onChange={(event) => setStudentNumber(event.target.value)}
                >
                  <option value="">Select…</option>
                  {numberOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              {letterEnabled ? (
                <label className="block space-y-1">
                  <ComicText className="font-black text-sm">Letter</ComicText>
                  <select
                    className="w-full comic-input"
                    value={studentLetter}
                    onChange={(event) => setStudentLetter(event.target.value)}
                  >
                    <option value="">Select…</option>
                    {STUDENT_LETTER_OPTIONS.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <label className="block space-y-1">
              <ComicText className="font-black text-sm">Roll number (5 digits)</ComicText>
              <input
                className="w-full comic-input tracking-widest font-bold"
                inputMode="numeric"
                pattern="\d{5}"
                maxLength={5}
                placeholder="12345"
                value={rollNumber}
                onChange={(event) => setRollNumber(normalizeRollNumber(event.target.value))}
              />
            </label>

            {error ? (
              <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
            ) : null}

            <ComicButton type="submit" variant="primary" size="md" disabled={checking}>
              {checking ? 'Checking…' : 'Show my grades'}
            </ComicButton>
          </form>
        )}
      </ComicCard>

      {grade ? (
        <ComicCard className="comic-shadow-xl space-y-4">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            {grade.display_name || `Student #${grade.student_number}`}
          </ComicTitle>
          <ComicText className="font-bold text-[var(--comic-dark)]">
            {grade.class_label} · {grade.school_year} · Semester {grade.semester}
          </ComicText>
          <ComicText className="font-black text-xl text-[var(--comic-primary)]">
            Running total: {grade.total_earned}/{grade.total_possible} ({grade.percent_label})
          </ComicText>

          {grade.tasks.length === 0 ? (
            <ComicText className="font-bold">No graded tasks yet for this semester.</ComicText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr className="border-b-4 border-[var(--comic-black)] text-left">
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Tool</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2">Test</th>
                  </tr>
                </thead>
                <tbody>
                  {grade.tasks.map((task, index) => (
                    <tr key={`${task.tool}-${task.task_title}-${index}`} className="border-b border-[var(--comic-black)]/20">
                      <td className="py-2 pr-3 font-bold">{task.task_title || 'Untitled'}</td>
                      <td className="py-2 pr-3 text-sm">
                        {GRADEBOOK_TOOL_LABELS[task.tool] || task.tool}
                      </td>
                      <td className="py-2 pr-3 font-bold">
                        {task.points}/{task.max_points}
                      </td>
                      <td className="py-2 text-sm">
                        {formatTestScore(task.test_correct, task.test_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComicCard>
      ) : null}
    </div>
  );
}
