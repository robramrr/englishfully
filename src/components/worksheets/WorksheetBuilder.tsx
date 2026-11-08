'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import WorksheetTemplate from './WorksheetTemplate';
import {
  emptyWorksheetHeader,
  todayInputValue,
  VOCAB_LEVELS,
  WORKSHEET_EXERCISES,
  type WorksheetDocument,
  type WorksheetExerciseType,
  type WorksheetHeader,
  type WorksheetLevel,
  type WorksheetSection,
} from '@/lib/worksheets/types';

const HEADER_STORAGE_KEY = 'ef-worksheet-header';

interface ExerciseChoice {
  on: boolean;
  count: number;
}

function initialChoices(): Record<WorksheetExerciseType, ExerciseChoice> {
  return WORKSHEET_EXERCISES.reduce(
    (choices, exercise) => {
      choices[exercise.type] = {
        on: exercise.defaultOn,
        count: exercise.defaultCount,
      };
      return choices;
    },
    {} as Record<WorksheetExerciseType, ExerciseChoice>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block font-bold text-[var(--comic-dark)] mb-1">
      {children}
    </label>
  );
}

export default function WorksheetBuilder() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState('');
  const [level, setLevel] = useState<WorksheetLevel>('A2');
  const [choices, setChoices] = useState(initialChoices);
  const [header, setHeader] = useState<WorksheetHeader>(() => emptyWorksheetHeader('A2'));
  const [sections, setSections] = useState<WorksheetSection[]>([]);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setHeader((current) => ({
      ...current,
      date: current.date || todayInputValue(),
    }));
    try {
      const saved = JSON.parse(localStorage.getItem(HEADER_STORAGE_KEY) || '{}') as {
        teacherName?: string;
        className?: string;
      };
      setHeader((current) => ({
        ...current,
        teacherName: saved.teacherName || current.teacherName,
        className: saved.className || current.className,
      }));
    } catch {
      /* The sheet still works if the saved header cannot be read. */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        HEADER_STORAGE_KEY,
        JSON.stringify({
          teacherName: header.teacherName,
          className: header.className,
        })
      );
    } catch {
      /* Ignore private-mode storage failures. */
    }
  }, [header.teacherName, header.className]);

  const selected = useMemo(
    () =>
      WORKSHEET_EXERCISES.filter((exercise) => choices[exercise.type].on).map((exercise) => ({
        type: exercise.type,
        count: choices[exercise.type].count,
      })),
    [choices]
  );

  const documentSheet: WorksheetDocument = {
    header: { ...header, level },
    sections,
  };

  function updateHeader(patch: Partial<WorksheetHeader>) {
    setHeader((current) => ({ ...current, ...patch }));
  }

  function updateChoice(type: WorksheetExerciseType, patch: Partial<ExerciseChoice>) {
    setChoices((current) => ({
      ...current,
      [type]: { ...current[type], ...patch },
    }));
  }

  async function handleCreate() {
    setError('');
    if (source.trim().length < 3) {
      setError('Paste a topic or a transcript first.');
      return;
    }
    if (selected.length === 0) {
      setError('Choose at least one exercise.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/worksheets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, level, exercises: selected }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create the worksheet');
      }
      setSections(Array.isArray(data.sections) ? data.sections : []);
      setHeader((current) => ({
        ...current,
        title: current.title.trim() || String(data.title || ''),
        instructions: current.instructions.trim() || String(data.instructions || ''),
      }));
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the worksheet');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div className="print:hidden space-y-8">
        <div className="flex flex-wrap gap-3">
          <Link href="/teacher-resources">
            <ComicButton variant="accent" size="sm">
              ← Back to Teacher Resources
            </ComicButton>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ComicCard className="comic-shadow-xl space-y-4">
            <ComicTitle level={3} className="text-[var(--comic-primary)]">
              1. What is the worksheet about?
            </ComicTitle>
            <ComicText className="font-bold text-[var(--comic-dark)]">
              Paste a topic, a short reading, or a transcript. The same paper template is filled
              from whatever you put here.
            </ComicText>
            <div>
              <FieldLabel htmlFor="worksheet-source">Topic or transcript</FieldLabel>
              <textarea
                id="worksheet-source"
                value={source}
                onChange={(event) => setSource(event.target.value.slice(0, 8000))}
                className="comic-textarea w-full min-h-40"
                style={{ resize: 'vertical' }}
                placeholder="Example: A short conversation about a school trip, or the topic “daily routines”."
              />
              <ComicText className="mt-1 text-sm font-bold text-[var(--brand-medium-gray)]">
                {source.length.toLocaleString()} / 8,000
              </ComicText>
            </div>
            <div>
              <FieldLabel htmlFor="worksheet-level">Level</FieldLabel>
              <select
                id="worksheet-level"
                value={level}
                onChange={(event) => setLevel(event.target.value as WorksheetLevel)}
                className="comic-input w-full"
              >
                {VOCAB_LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </ComicCard>

          <ComicCard className="comic-shadow-xl space-y-4">
            <ComicTitle level={3} className="text-[var(--comic-secondary)]">
              2. Header
            </ComicTitle>
            <ComicText className="font-bold text-[var(--comic-dark)]">
              These lines print on every sheet. Leave the student name and ID empty when each
              student will write their own.
            </ComicText>
            <div>
              <FieldLabel htmlFor="worksheet-title">Worksheet title</FieldLabel>
              <input
                id="worksheet-title"
                value={header.title}
                onChange={(event) => updateHeader({ title: event.target.value })}
                className="comic-input w-full"
                placeholder="Leave blank and AI will name it"
                maxLength={80}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="worksheet-teacher">Teacher</FieldLabel>
                <input
                  id="worksheet-teacher"
                  value={header.teacherName}
                  onChange={(event) => updateHeader({ teacherName: event.target.value })}
                  className="comic-input w-full"
                  autoComplete="name"
                />
              </div>
              <div>
                <FieldLabel htmlFor="worksheet-student">Student</FieldLabel>
                <input
                  id="worksheet-student"
                  value={header.studentName}
                  onChange={(event) => updateHeader({ studentName: event.target.value })}
                  className="comic-input w-full"
                  placeholder="Blank line on the sheet"
                />
              </div>
              <div>
                <FieldLabel htmlFor="worksheet-class">Class</FieldLabel>
                <input
                  id="worksheet-class"
                  value={header.className}
                  onChange={(event) => updateHeader({ className: event.target.value })}
                  className="comic-input w-full"
                  placeholder="8A"
                />
              </div>
              <div>
                <FieldLabel htmlFor="worksheet-id">ID number</FieldLabel>
                <input
                  id="worksheet-id"
                  value={header.studentId}
                  onChange={(event) =>
                    updateHeader({ studentId: event.target.value.replace(/\D/g, '').slice(0, 5) })
                  }
                  className="comic-input w-full tracking-[0.3em]"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="5 digits"
                  maxLength={5}
                />
              </div>
              <div>
                <FieldLabel htmlFor="worksheet-date">Date</FieldLabel>
                <input
                  id="worksheet-date"
                  type="date"
                  value={header.date}
                  onChange={(event) => updateHeader({ date: event.target.value })}
                  className="comic-input w-full"
                />
              </div>
              <div>
                <FieldLabel htmlFor="worksheet-due">Due date</FieldLabel>
                <input
                  id="worksheet-due"
                  type="date"
                  value={header.dueDate}
                  onChange={(event) => updateHeader({ dueDate: event.target.value })}
                  className="comic-input w-full"
                />
                <ComicText className="mt-1 text-sm font-bold text-[var(--brand-medium-gray)]">
                  Optional. A blank due line still prints.
                </ComicText>
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="worksheet-directions">Directions</FieldLabel>
              <input
                id="worksheet-directions"
                value={header.instructions}
                onChange={(event) => updateHeader({ instructions: event.target.value })}
                className="comic-input w-full"
                placeholder="Leave blank and AI will write one line"
                maxLength={180}
              />
            </div>
          </ComicCard>
        </div>

        <ComicCard className="comic-shadow-xl space-y-4">
          <ComicTitle level={3} className="text-[var(--comic-primary)]">
            3. Exercises
          </ComicTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {WORKSHEET_EXERCISES.map((exercise) => {
              const choice = choices[exercise.type];
              return (
                <div
                  key={exercise.type}
                  className="flex items-center justify-between gap-3 border-4 border-[var(--comic-black)] bg-white p-3"
                >
                  <button
                    type="button"
                    aria-pressed={choice.on}
                    onClick={() => updateChoice(exercise.type, { on: !choice.on })}
                    className="min-w-0 text-left"
                  >
                    <span className="block font-black text-[var(--comic-dark)]">
                      <span
                        className={`mr-2 inline-flex h-5 w-5 items-center justify-center border-2 border-[var(--comic-black)] align-middle ${
                          choice.on ? 'bg-[var(--comic-primary)] text-white' : 'bg-white'
                        }`}
                        aria-hidden
                      >
                        {choice.on ? '✓' : ''}
                      </span>
                      {exercise.label}
                    </span>
                    <span className="mt-1 block text-sm font-bold text-[var(--brand-medium-gray)]">
                      {exercise.hint}
                    </span>
                  </button>
                  <label className="shrink-0 text-center">
                    <span className="block text-xs font-bold">Items</span>
                    <input
                      type="number"
                      min={3}
                      max={8}
                      disabled={!choice.on}
                      value={choice.count}
                      aria-label={`${exercise.label} item count`}
                      onChange={(event) =>
                        updateChoice(exercise.type, {
                          count: Math.max(3, Math.min(8, Number(event.target.value) || 3)),
                        })
                      }
                      className="comic-input mt-1 w-16 text-center disabled:opacity-40"
                    />
                  </label>
                </div>
              );
            })}
          </div>
          {error ? (
            <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
          ) : null}
          <ComicButton
            type="button"
            variant="primary"
            size="lg"
            disabled={loading}
            onClick={() => void handleCreate()}
          >
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden className="h-[1em] w-[1em]" />
              {loading ? 'Creating worksheet…' : 'Create with AI'}
            </span>
          </ComicButton>
        </ComicCard>
      </div>

      <div ref={previewRef} className="space-y-4">
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            Worksheet
          </ComicTitle>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 font-bold text-[var(--comic-dark)]">
              <input
                type="checkbox"
                checked={includeAnswerKey}
                onChange={(event) => setIncludeAnswerKey(event.target.checked)}
                disabled={sections.length === 0}
              />
              Include answer key when printing
            </label>
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={sections.length === 0}
              onClick={() => window.print()}
            >
              Print / Save PDF
            </ComicButton>
          </div>
        </div>
        <WorksheetTemplate document={documentSheet} includeAnswerKey={includeAnswerKey} />
      </div>
    </div>
  );
}
