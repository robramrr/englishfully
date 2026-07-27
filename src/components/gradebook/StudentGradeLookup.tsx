'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
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

const ROLL_LENGTH = 5;
const EMPTY_ROLL_DIGITS = ['', '', '', '', ''] as const;

interface StudentGradeLookupProps {
  schoolSlug: string;
  /** When true, render the page hero using the saved school name once loaded. */
  showHero?: boolean;
}

export default function StudentGradeLookup({ schoolSlug, showHero = false }: StudentGradeLookupProps) {
  const [classes, setClasses] = useState<PublicClassOption[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [classId, setClassId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentLetter, setStudentLetter] = useState('');
  const [rollDigits, setRollDigits] = useState<string[]>([...EMPTY_ROLL_DIGITS]);
  const rollInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [grade, setGrade] = useState<StudentGradeLookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoadingClasses(true);
    setNotFound(false);
    setError('');
    fetch(`/api/grades/${encodeURIComponent(schoolSlug)}/classes?_=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setNotFound(true);
          setError(data.error || 'School grades page not found.');
          return;
        }
        const next = (data.classes || []) as PublicClassOption[];
        setClasses(next);
        setSchoolName(String(data.school_name || schoolSlug).trim());
        if (next.length > 0) setClassId(next[0].id);
      })
      .catch(() => {
        setNotFound(true);
        setError('Could not load classes.');
      })
      .finally(() => setLoadingClasses(false));
  }, [schoolSlug]);

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
  const rollNumber = rollDigits.join('');

  function focusRollBox(index: number) {
    const clamped = Math.min(ROLL_LENGTH - 1, Math.max(0, index));
    rollInputRefs.current[clamped]?.focus();
    rollInputRefs.current[clamped]?.select();
  }

  function applyRollDigits(nextDigits: string[], focusIndex?: number) {
    const padded = Array.from({ length: ROLL_LENGTH }, (_, index) => nextDigits[index] || '');
    setRollDigits(padded);
    if (typeof focusIndex === 'number') {
      window.requestAnimationFrame(() => focusRollBox(focusIndex));
    }
  }

  function handleRollChange(index: number, rawValue: string) {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      applyRollDigits(
        rollDigits.map((digit, digitIndex) => (digitIndex === index ? '' : digit)),
        index
      );
      return;
    }

    // Typing or pasting into a box can fill multiple digits from here.
    const next = [...rollDigits];
    const incoming = digitsOnly.slice(0, ROLL_LENGTH - index).split('');
    incoming.forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    const nextFocus = Math.min(ROLL_LENGTH - 1, index + incoming.length);
    applyRollDigits(next, nextFocus);
  }

  function handleRollKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      if (rollDigits[index]) {
        event.preventDefault();
        applyRollDigits(
          rollDigits.map((digit, digitIndex) => (digitIndex === index ? '' : digit)),
          index
        );
        return;
      }
      if (index > 0) {
        event.preventDefault();
        applyRollDigits(
          rollDigits.map((digit, digitIndex) => (digitIndex === index - 1 ? '' : digit)),
          index - 1
        );
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusRollBox(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < ROLL_LENGTH - 1) {
      event.preventDefault();
      focusRollBox(index + 1);
    }
  }

  function handleRollPaste(index: number, pastedText: string) {
    const digits = normalizeRollNumber(pastedText).slice(0, ROLL_LENGTH);
    if (!digits) return;
    const next = [...rollDigits];
    digits.split('').forEach((digit, offset) => {
      const target = index + offset;
      if (target < ROLL_LENGTH) next[target] = digit;
    });
    applyRollDigits(next, Math.min(ROLL_LENGTH - 1, index + digits.length));
  }

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
      setError('Enter all 5 digits of your roll number.');
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(`/api/grades/${encodeURIComponent(schoolSlug)}/lookup`, {
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
      {showHero ? (
        <section className="comic-bg-secondary py-10 px-4 comic-pattern-dots text-center">
          <ComicTitle level={2} className="comic-text-white mb-2">
            <span className="inline-flex items-center justify-center gap-3">
              <FontAwesomeIcon
                icon={faGraduationCap}
                aria-hidden
                className="h-[0.85em] w-[0.85em] shrink-0"
              />
              <span>Check My Grades</span>
            </span>
          </ComicTitle>
          <ComicText className="comic-text-white font-bold">
            {schoolName.trim() || (loadingClasses ? '…' : schoolSlug)}
          </ComicText>
        </section>
      ) : null}

      <section className={showHero ? 'max-w-xl mx-auto py-10 px-4 space-y-6' : 'space-y-6'}>
      <ComicCard className="comic-shadow-xl">
        {loadingClasses ? (
          <ComicText className="font-bold text-center">Loading classes…</ComicText>
        ) : notFound ? (
          <ComicText className="font-bold text-[var(--comic-danger)] text-center">
            {error || 'This school grades link was not found. Ask your teacher for the correct link.'}
          </ComicText>
        ) : classes.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)] text-center">
            No classes are set up yet. Ask your teacher to add classes in Speak &amp; Submit
            settings.
          </ComicText>
        ) : (
          <form className="space-y-4" onSubmit={(event) => void handleLookup(event)}>
            <ComicTitle
              level={6}
              className="speak-identity-title mb-4 text-[var(--comic-primary)] text-center"
            >
              👋 Who are you?
            </ComicTitle>

            <label className="block space-y-1">
              <ComicText className="font-black text-sm">Class</ComicText>
              <select
                className="w-full comic-input text-lg py-4"
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
              <select
                className="w-full comic-input text-lg py-4"
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
                aria-label="Student number"
              >
                <option value="">#</option>
                {numberOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {letterEnabled ? (
                <select
                  className="w-full comic-input text-lg py-4"
                  value={studentLetter}
                  onChange={(event) => setStudentLetter(event.target.value)}
                  aria-label="Student ID letter"
                >
                  <option value="">ID</option>
                  {STUDENT_LETTER_OPTIONS.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="space-y-2">
              <ComicText className="font-black text-sm">Roll number (5 digits)</ComicText>
              <div
                className="flex flex-nowrap justify-between gap-1.5 sm:gap-2"
                role="group"
                aria-label="5-digit roll number"
              >
                {rollDigits.map((digit, index) => (
                  <input
                    key={`roll-digit-${index}`}
                    ref={(element) => {
                      rollInputRefs.current[index] = element;
                    }}
                    className="comic-input min-w-0 flex-1 max-w-[3rem] sm:max-w-none sm:w-12 h-11 sm:h-14 text-center text-xl sm:text-2xl font-black"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    aria-label={`Roll digit ${index + 1}`}
                    onChange={(event) => handleRollChange(index, event.target.value)}
                    onKeyDown={(event) => handleRollKeyDown(index, event)}
                    onFocus={(event) => event.target.select()}
                    onPaste={(event) => {
                      event.preventDefault();
                      handleRollPaste(index, event.clipboardData.getData('text'));
                    }}
                  />
                ))}
              </div>
            </div>

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
            <ComicText className="font-bold">No assigned tasks yet for this semester.</ComicText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr className="border-b-4 border-[var(--comic-black)] text-left">
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Tool</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {grade.tasks.map((task) => {
                    const isAssessment = task.tool === 'listen_and_answer';
                    const isMakeup = task.tool === 'listen_and_learn' || Boolean(task.makeup_for_task_id);
                    const testLabel = formatTestScore(task.test_correct, task.test_total);
                    const earnedFull =
                      task.status === 'graded' &&
                      task.points != null &&
                      task.points >= (task.max_points || 0);
                    let statusNode: ReactNode;
                    if (task.status === 'graded') {
                      if (isAssessment && testLabel !== '—') {
                        statusNode = (
                          <span
                            className={
                              earnedFull
                                ? 'text-[var(--comic-success)]'
                                : 'text-[var(--comic-danger)]'
                            }
                          >
                            {earnedFull ? `Graded - ${testLabel}` : `Failed - ${testLabel}`}
                          </span>
                        );
                      } else if (isMakeup) {
                        statusNode = (
                          <span className="text-[var(--comic-success)]">Makeup completed</span>
                        );
                      } else {
                        statusNode = (
                          <span className="text-[var(--comic-success)]">Graded</span>
                        );
                      }
                    } else if (task.submitted) {
                      statusNode = (
                        <span className="text-[var(--comic-warning)]">Submitted</span>
                      );
                    } else if (task.student_url) {
                      statusNode = (
                        <a
                          href={task.student_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-[var(--comic-danger)]"
                        >
                          {isMakeup ? 'Open makeup' : 'Not turned in — open task'}
                        </a>
                      );
                    } else {
                      statusNode = (
                        <span className="text-[var(--comic-danger)]">Not turned in</span>
                      );
                    }

                    return (
                      <tr
                        key={`${task.tool}-${task.task_id}`}
                        className="border-b border-[var(--comic-black)]/20"
                      >
                        <td className="py-2 pr-3 font-bold">
                          {task.student_url ? (
                            <a
                              href={task.student_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-[var(--comic-primary)] hover:opacity-80"
                            >
                              {task.task_title || 'Untitled'}
                            </a>
                          ) : (
                            task.task_title || 'Untitled'
                          )}
                        </td>
                        <td className="py-2 pr-3 text-sm">
                          {GRADEBOOK_TOOL_LABELS[task.tool] || task.tool}
                        </td>
                        <td className="py-2 pr-3 text-sm font-bold">{statusNode}</td>
                        <td className="py-2 font-bold">
                          {task.status === 'graded' && task.points != null
                            ? `${task.points}/${task.max_points}`
                            : `—/${task.max_points}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ComicCard>
      ) : null}
      </section>
    </div>
  );
}
