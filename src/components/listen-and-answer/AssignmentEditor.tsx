'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import ListeningPartEditor, { type ClientListeningPart } from './ListeningPartEditor';
import LivePrintPreview from './LivePrintPreview';
import TotalTimeFields from './TotalTimeFields';
import { useAutoSave } from './useAutoSave';
import type {
  ListenAssignmentWithParts,
  SaveAssignmentPayload,
  TimeUnit,
} from '@/lib/listen-and-answer/types';
import { createEmptyPart } from '@/lib/listen-and-answer/types';

interface AssignmentEditorProps {
  assignmentId: string;
  initialAssignment: ListenAssignmentWithParts;
}

function toClientParts(assignment: ListenAssignmentWithParts): ClientListeningPart[] {
  return assignment.parts.map((part) => ({
    clientId: part.id,
    id: part.id,
    title: part.title,
    audio_url: part.audio_url,
    thumbnail_url: part.thumbnail_url,
    additional_thumbnail_enabled: part.additional_thumbnail_enabled ?? false,
    additional_thumbnail_url: part.additional_thumbnail_url ?? '',
    qr_enabled: part.qr_enabled,
    transcript: part.transcript,
    transcript_source: part.transcript_source,
    question_framework: part.question_framework,
    cefr_levels: part.cefr_levels,
    instructions: part.instructions ?? '',
    total_questions: part.total_questions ?? '',
    time_amount: part.time_amount ?? '',
    time_unit: part.time_unit ?? 'minutes',
    questions: part.questions.map((question) => ({
      clientId: question.id,
      id: question.id,
      question_type: question.question_type,
      question_text: question.question_text,
      choices: question.choices,
      correct_answer: question.correct_answer,
      keep_question: question.keep_question,
      is_ai_generated: question.is_ai_generated,
      ai_part: question.ai_part,
      show_question_type: question.show_question_type ?? false,
    })),
  }));
}

function buildPayload(
  teacherName: string,
  title: string,
  className: string,
  dueDate: string,
  points: string,
  instructions: string,
  totalQuestions: string,
  timeAmount: string,
  timeUnit: TimeUnit,
  includeAnswerKey: boolean,
  includeScantronSheet: boolean,
  includeStudentInfoLine: boolean,
  status: 'draft' | 'published',
  parts: ClientListeningPart[]
): SaveAssignmentPayload {
  return {
    teacher_name: teacherName,
    title,
    class_name: className,
    due_date: dueDate || null,
    points,
    include_answer_key: includeAnswerKey,
    include_scantron_sheet: includeScantronSheet,
    include_student_info_line: includeStudentInfoLine,
    instructions,
    total_questions: totalQuestions,
    time_amount: timeAmount,
    time_unit: timeUnit,
    status,
    parts: parts.map((part) => ({
      id: part.id,
      title: part.title,
      audio_url: part.audio_url,
      thumbnail_url: part.thumbnail_url,
      additional_thumbnail_enabled: part.additional_thumbnail_enabled ?? false,
      additional_thumbnail_url: part.additional_thumbnail_url ?? '',
      qr_enabled: part.qr_enabled,
      transcript: part.transcript,
      transcript_source: part.transcript_source,
      question_framework: part.question_framework,
      cefr_levels: part.cefr_levels,
      instructions: part.instructions,
      total_questions: part.total_questions,
      time_amount: part.time_amount,
      time_unit: part.time_unit,
      questions: part.questions.map((question) => ({
        id: question.id,
        question_type: question.question_type,
        question_text: question.question_text,
        choices: question.choices,
        correct_answer: question.correct_answer,
        keep_question: question.keep_question,
        is_ai_generated: question.is_ai_generated,
        ai_part: question.ai_part,
        show_question_type: question.show_question_type,
      })),
    })),
  };
}

export default function AssignmentEditor({
  assignmentId,
  initialAssignment,
}: AssignmentEditorProps) {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState(initialAssignment.teacher_name);
  const [title, setTitle] = useState(initialAssignment.title);
  const [className, setClassName] = useState(initialAssignment.class_name);
  const [dueDate, setDueDate] = useState(initialAssignment.due_date ?? '');
  const [points, setPoints] = useState(initialAssignment.points ?? '');
  const [instructions, setInstructions] = useState(initialAssignment.instructions ?? '');
  const [totalQuestions, setTotalQuestions] = useState(initialAssignment.total_questions ?? '');
  const [timeAmount, setTimeAmount] = useState(initialAssignment.time_amount ?? '');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialAssignment.time_unit ?? 'minutes');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(initialAssignment.include_answer_key);
  const [includeScantronSheet, setIncludeScantronSheet] = useState(
    initialAssignment.include_scantron_sheet ?? false
  );
  const [includeStudentInfoLine, setIncludeStudentInfoLine] = useState(
    initialAssignment.include_student_info_line ?? false
  );
  const [parts, setParts] = useState<ClientListeningPart[]>(() => toClientParts(initialAssignment));
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const savedPartCountRef = useRef(initialAssignment.parts.length);
  const savedQuestionCountRef = useRef(
    initialAssignment.parts.reduce((sum, part) => sum + part.questions.length, 0)
  );

  const payload = useMemo(
    () =>
      buildPayload(
        teacherName,
        title,
        className,
        dueDate,
        points,
        instructions,
        totalQuestions,
        timeAmount,
        timeUnit,
        includeAnswerKey,
        includeScantronSheet,
        includeStudentInfoLine,
        'draft',
        parts
      ),
    [
      teacherName,
      title,
      className,
      dueDate,
      points,
      instructions,
      totalQuestions,
      timeAmount,
      timeUnit,
      includeAnswerKey,
      includeScantronSheet,
      includeStudentInfoLine,
      parts,
    ]
  );

  const saveAssignment = useCallback(
    async (data: SaveAssignmentPayload, status: 'draft' | 'published' = 'draft') => {
      const response = await fetch(`/api/listen-and-answer/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save assignment');
      }
      setParts(toClientParts(result.assignment));
      savedPartCountRef.current = result.assignment.parts.length;
      savedQuestionCountRef.current = result.assignment.parts.reduce(
        (sum: number, part: { questions: unknown[] }) => sum + part.questions.length,
        0
      );
      setSaveMessage(status === 'published' ? 'Assignment updated.' : 'Draft saved.');
      setError('');
    },
    [assignmentId]
  );

  const saveAssignmentDraft = useCallback(
    async (data: SaveAssignmentPayload) => {
      const incomingPartCount = data.parts.length;
      const incomingQuestionCount = data.parts.reduce(
        (sum, part) => sum + part.questions.length,
        0
      );

      if (savedPartCountRef.current > 0 && incomingPartCount === 0) {
        setError('Auto-save blocked to protect your assignment: no listening parts to save.');
        return;
      }

      if (savedQuestionCountRef.current > 0 && incomingQuestionCount === 0) {
        setError('Auto-save blocked to protect your assignment: no questions to save.');
        return;
      }

      try {
        await saveAssignment(data, 'draft');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auto-save failed');
      }
    },
    [saveAssignment]
  );

  useAutoSave(payload, saveAssignmentDraft, autoSaveEnabled);

  useEffect(() => {
    fetch('/api/speak-and-submit/settings')
      .then((response) => response.json())
      .then((data) => {
        if (!teacherName && typeof data.teacher_name === 'string' && data.teacher_name.trim()) {
          setTeacherName(data.teacher_name.trim());
        }
      })
      .catch(() => {});
  }, [teacherName]);

  let dragPartId: string | null = null;

  function updatePart(clientId: string, updates: Partial<ClientListeningPart>) {
    setParts((current) =>
      current.map((part) => (part.clientId === clientId ? { ...part, ...updates } : part))
    );
    setSaveMessage('');
  }

  function deletePart(clientId: string) {
    setParts((current) => current.filter((part) => part.clientId !== clientId));
  }

  function addPart() {
    const next = createEmptyPart(parts.length);
    setParts((current) => [
      ...current,
      {
        ...next,
        clientId: crypto.randomUUID(),
        questions: [],
      },
    ]);
  }

  function handlePartDragStart(clientId: string) {
    dragPartId = clientId;
  }

  function handlePartDragOver(event: React.DragEvent, clientId: string) {
    event.preventDefault();
    if (!dragPartId || dragPartId === clientId) return;
    setParts((current) => {
      const items = [...current];
      const fromIndex = items.findIndex((part) => part.clientId === dragPartId);
      const toIndex = items.findIndex((part) => part.clientId === clientId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return items;
    });
  }

  function handlePartDrop(clientId: string) {
    handlePartDragOver({ preventDefault: () => {} } as React.DragEvent, clientId);
    dragPartId = null;
  }

  async function handleManualSave(status: 'draft' | 'published') {
    setSaving(true);
    setError('');
    try {
      await saveAssignment(payload, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        `/api/listen-and-answer/assignments/${assignmentId}/duplicate`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to duplicate assignment');
      router.push(`/teacher-resources/listen-and-answer/${data.assignment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate assignment');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this assignment permanently?')) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/listen-and-answer/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete assignment');
      router.push('/teacher-resources/listen-and-answer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assignment');
    } finally {
      setSaving(false);
    }
  }

  const previewAssignment: ListenAssignmentWithParts = {
    ...initialAssignment,
    teacher_name: teacherName,
    title,
    class_name: className,
    due_date: dueDate || null,
    points,
    include_answer_key: includeAnswerKey,
    include_scantron_sheet: includeScantronSheet,
    include_student_info_line: includeStudentInfoLine,
    instructions,
    total_questions: totalQuestions,
    time_amount: timeAmount,
    time_unit: timeUnit,
    parts: payload.parts.map((part, partIndex) => ({
      id: part.id || `preview-part-${partIndex}`,
      assignment_id: assignmentId,
      sort_order: partIndex,
      title: part.title,
      audio_url: part.audio_url,
      thumbnail_url: part.thumbnail_url,
      additional_thumbnail_enabled: part.additional_thumbnail_enabled ?? false,
      additional_thumbnail_url: part.additional_thumbnail_url ?? '',
      qr_enabled: part.qr_enabled,
      transcript: part.transcript,
      transcript_source: part.transcript_source,
      question_framework: part.question_framework,
      cefr_levels: part.cefr_levels,
      instructions: part.instructions,
      total_questions: part.total_questions,
      time_amount: part.time_amount,
      time_unit: part.time_unit,
      questions: part.questions.map((question, questionIndex) => ({
        id: question.id || `preview-q-${partIndex}-${questionIndex}`,
        part_id: part.id || `preview-part-${partIndex}`,
        sort_order: questionIndex,
        question_type: question.question_type,
        question_text: question.question_text,
        choices: question.choices,
        correct_answer: question.correct_answer,
        keep_question: question.keep_question,
        is_ai_generated: question.is_ai_generated,
        ai_part: question.ai_part,
        show_question_type: question.show_question_type,
      })),
    })),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/listen-and-answer">
          <ComicButton variant="accent" size="sm">
            ← Back to Listen &amp; Answer
          </ComicButton>
        </Link>
        <Link href={`/teacher-resources/listen-and-answer/${assignmentId}/print`}>
          <ComicButton variant="warning" size="sm">
            Open Print View
          </ComicButton>
        </Link>
        <ComicButton variant="accent" size="sm" onClick={() => setShowPreview((value) => !value)}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </ComicButton>
      </div>

      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
          Assignment Settings
        </ComicTitle>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <ComicText className="font-bold mb-1 text-sm">Teacher Name</ComicText>
            <input
              className="w-full comic-input"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              placeholder="Ms. Johnson"
            />
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Task Title</ComicText>
            <input
              className="w-full comic-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Listening Assignment"
            />
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Class Name / Number</ComicText>
            <input
              className="w-full comic-input"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="4/10"
            />
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Due Date</ComicText>
            <input
              type="date"
              className="w-full comic-input"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Points</ComicText>
            <input
              className="w-full comic-input"
              value={points}
              onChange={(event) => setPoints(event.target.value)}
              placeholder="10"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-4">
          <ComicText className="font-bold mb-1 text-sm">Instructions</ComicText>
          <textarea
            className="w-full comic-input min-h-[80px]"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Instructions for the entire assignment"
          />
        </div>

        <div className="mt-4">
          <TotalTimeFields
            totalQuestions={totalQuestions}
            timeAmount={timeAmount}
            timeUnit={timeUnit}
            onTotalQuestionsChange={setTotalQuestions}
            onTimeAmountChange={setTimeAmount}
            onTimeUnitChange={setTimeUnit}
          />
        </div>

        <label className="flex items-center gap-2 mt-6 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={includeAnswerKey}
            onChange={(event) => setIncludeAnswerKey(event.target.checked)}
          />
          Create Answer Key (prints on a separate page)
        </label>

        <label className="flex items-center gap-2 mt-3 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={includeScantronSheet}
            onChange={(event) => setIncludeScantronSheet(event.target.checked)}
          />
          Create Scantron Answer Sheet (prints on a separate page; includes Name / Student # / Date)
        </label>

        <label className="flex items-center gap-2 mt-3 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={includeStudentInfoLine}
            onChange={(event) => setIncludeStudentInfoLine(event.target.checked)}
          />
          Show Name / Student # / Date line on worksheet
        </label>
      </ComicCard>

      <div className="space-y-6">
        {parts.map((part, index) => (
          <ListeningPartEditor
            key={part.clientId}
            part={part}
            index={index}
            onChange={updatePart}
            onDelete={deletePart}
            onDragStart={handlePartDragStart}
            onDragOver={handlePartDragOver}
            onDrop={handlePartDrop}
          />
        ))}
      </div>

      <ComicButton type="button" variant="primary" size="md" onClick={addPart}>
        + Add Listening Part
      </ComicButton>

      <ComicCard className="comic-shadow-xl">
        <div className="flex flex-wrap gap-3">
          <ComicButton
            type="button"
            variant="secondary"
            size="md"
            disabled={saving}
            onClick={() => handleManualSave('draft')}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </ComicButton>
          <ComicButton
            type="button"
            variant="success"
            size="md"
            disabled={saving}
            onClick={() => handleManualSave('published')}
          >
            Update Assignment
          </ComicButton>
          <ComicButton type="button" variant="accent" size="md" disabled={saving} onClick={handleDuplicate}>
            Duplicate Assignment
          </ComicButton>
          <ComicButton type="button" variant="danger" size="md" disabled={saving} onClick={handleDelete}>
            Delete Assignment
          </ComicButton>
        </div>
        <label className="flex items-center gap-2 mt-4 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(event) => setAutoSaveEnabled(event.target.checked)}
          />
          Auto-save every few seconds
        </label>
        {saveMessage ? (
          <ComicText className="text-[var(--comic-success)] font-bold mt-4">{saveMessage}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold mt-4">{error}</ComicText>
        ) : null}
      </ComicCard>

      {showPreview ? <LivePrintPreview assignment={previewAssignment} /> : null}
    </div>
  );
}
