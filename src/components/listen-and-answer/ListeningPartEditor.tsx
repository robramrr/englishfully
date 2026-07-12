'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import DragHandle from './DragHandle';
import QuestionEditor from './QuestionEditor';
import type {
  CefrLevel,
  SaveListeningPartPayload,
  SaveQuestionPayload,
  TranscriptSource,
} from '@/lib/listen-and-answer/types';
import {
  CEFR_LEVELS,
  DEFAULT_QUESTION_FRAMEWORK,
  createEmptyQuestion,
} from '@/lib/listen-and-answer/types';

export interface ClientListeningPart extends SaveListeningPartPayload {
  clientId: string;
  questions: Array<SaveQuestionPayload & { clientId: string }>;
}

interface ListeningPartEditorProps {
  part: ClientListeningPart;
  index: number;
  onChange: (clientId: string, updates: Partial<ClientListeningPart>) => void;
  onDelete: (clientId: string) => void;
  onDragStart: (clientId: string) => void;
  onDragOver: (event: React.DragEvent, clientId: string) => void;
  onDrop: (clientId: string) => void;
}

export default function ListeningPartEditor({
  part,
  index,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
}: ListeningPartEditorProps) {
  const [generatingTranscript, setGeneratingTranscript] = useState(false);
  const [generatingPart, setGeneratingPart] = useState<'A' | 'B' | null>(null);
  const [error, setError] = useState('');
  const [qrPreview, setQrPreview] = useState('');

  useEffect(() => {
    if (!part.qr_enabled || !part.audio_url.trim()) {
      setQrPreview('');
      return;
    }
    void import('qrcode').then((QRCode) =>
      QRCode.toDataURL(part.audio_url.trim(), {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 140,
        color: { dark: '#001a48', light: '#ffffff' },
      }).then(setQrPreview)
    );
  }, [part.audio_url, part.qr_enabled]);

  function updateQuestion(clientId: string, updates: Partial<SaveQuestionPayload>) {
    onChange(part.clientId, {
      questions: part.questions.map((question) =>
        question.clientId === clientId ? { ...question, ...updates } : question
      ),
    });
  }

  function deleteQuestion(clientId: string) {
    onChange(part.clientId, {
      questions: part.questions.filter((question) => question.clientId !== clientId),
    });
  }

  function addManualQuestion() {
    const next = createEmptyQuestion(part.questions.length);
    onChange(part.clientId, {
      questions: [
        ...part.questions,
        { ...next, clientId: crypto.randomUUID() },
      ],
    });
  }

  let dragQuestionId: string | null = null;

  function handleQuestionDragStart(clientId: string) {
    dragQuestionId = clientId;
  }

  function handleQuestionDragOver(event: React.DragEvent, clientId: string) {
    event.preventDefault();
    if (!dragQuestionId || dragQuestionId === clientId) return;
    const items = [...part.questions];
    const fromIndex = items.findIndex((q) => q.clientId === dragQuestionId);
    const toIndex = items.findIndex((q) => q.clientId === clientId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    onChange(part.clientId, { questions: items });
  }

  function handleQuestionDrop(clientId: string) {
    handleQuestionDragOver({ preventDefault: () => {} } as React.DragEvent, clientId);
    dragQuestionId = null;
  }

  async function handleGenerateTranscript() {
    if (!part.audio_url.trim()) {
      setError('Enter an audio URL before generating a transcript.');
      return;
    }
    setGeneratingTranscript(true);
    setError('');
    try {
      const response = await fetch('/api/listen-and-answer/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: part.audio_url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Transcript generation failed');
      onChange(part.clientId, { transcript: data.transcript, transcript_source: 'auto' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcript generation failed');
    } finally {
      setGeneratingTranscript(false);
    }
  }

  async function handleGenerateQuestions(aiPart: 'A' | 'B') {
    if (!part.transcript.trim()) {
      setError('Add or generate a transcript before creating AI questions.');
      return;
    }
    setGeneratingPart(aiPart);
    setError('');
    try {
      const response = await fetch('/api/listen-and-answer/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: part.transcript,
          framework: part.question_framework,
          cefr_levels: part.cefr_levels,
          part: aiPart,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Question generation failed');

      const generated = (data.questions as SaveQuestionPayload[]).map((question) => ({
        ...question,
        keep_question: true,
        is_ai_generated: true,
        ai_part: aiPart,
        clientId: crypto.randomUUID(),
      }));

      onChange(part.clientId, {
        questions: [...part.questions, ...generated],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Question generation failed');
    } finally {
      setGeneratingPart(null);
    }
  }

  function toggleCefr(level: CefrLevel) {
    const hasLevel = part.cefr_levels.includes(level);
    const nextLevels = hasLevel
      ? part.cefr_levels.filter((item) => item !== level)
      : [...part.cefr_levels, level];
    onChange(part.clientId, { cefr_levels: nextLevels });
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(part.clientId)}
      onDragOver={(event) => onDragOver(event, part.clientId)}
      onDrop={() => onDrop(part.clientId)}
    >
    <ComicCard className="comic-shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-grow">
          <DragHandle label="Drag to reorder listening part" />
          <div className="flex-grow">
            <ComicText className="font-bold mb-1 text-sm">Listening Part Title</ComicText>
            <input
              className="w-full comic-input"
              value={part.title}
              onChange={(event) => onChange(part.clientId, { title: event.target.value })}
              placeholder={`Part ${index + 1}`}
            />
          </div>
        </div>
        <ComicButton type="button" variant="danger" size="sm" onClick={() => onDelete(part.clientId)}>
          Remove Part
        </ComicButton>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div>
          <ComicText className="font-bold mb-1 text-sm">Audio URL</ComicText>
          <input
            className="w-full comic-input"
            value={part.audio_url}
            onChange={(event) => onChange(part.clientId, { audio_url: event.target.value })}
            placeholder="https://..."
          />
        </div>
        <div>
          <ComicText className="font-bold mb-1 text-sm">Thumbnail URL</ComicText>
          <input
            className="w-full comic-input"
            value={part.thumbnail_url}
            onChange={(event) => onChange(part.clientId, { thumbnail_url: event.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {part.thumbnail_url.trim() ? (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={part.thumbnail_url}
            alt="Listening thumbnail preview"
            className="max-h-40 comic-border rounded-lg object-cover"
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2 mb-6 font-bold text-[var(--comic-dark)]">
        <input
          type="checkbox"
          checked={part.qr_enabled}
          onChange={(event) => onChange(part.clientId, { qr_enabled: event.target.checked })}
        />
        Generate QR code from Audio URL on printed worksheet
      </label>

      {part.qr_enabled && qrPreview ? (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrPreview} alt="Audio QR preview" width={140} height={140} />
        </div>
      ) : null}

      <div className="mb-8 space-y-4">
        <ComicTitle level={4} className="text-[var(--comic-secondary)]">
          Transcript
        </ComicTitle>
        <ComicText className="text-sm text-[var(--comic-dark)]">
          Create or edit the transcript before generating AI questions. This transcript is the single source of truth.
        </ComicText>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange(part.clientId, { transcript_source: 'auto' })}
            className={`comic-border rounded-lg px-4 py-3 text-left font-bold ${
              part.transcript_source === 'auto'
                ? 'comic-bg-secondary comic-text-white'
                : 'bg-white text-[var(--comic-dark)]'
            }`}
          >
            ○ Generate automatically
          </button>
          <button
            type="button"
            onClick={() => onChange(part.clientId, { transcript_source: 'manual' })}
            className={`comic-border rounded-lg px-4 py-3 text-left font-bold ${
              part.transcript_source === 'manual'
                ? 'comic-bg-secondary comic-text-white'
                : 'bg-white text-[var(--comic-dark)]'
            }`}
          >
            ○ Enter transcript manually
          </button>
        </div>

        {part.transcript_source === 'auto' ? (
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={generatingTranscript}
            onClick={handleGenerateTranscript}
          >
            {generatingTranscript ? 'Generating transcript…' : 'Generate Transcript'}
          </ComicButton>
        ) : null}

        <textarea
          className="w-full comic-input min-h-[160px]"
          value={part.transcript}
          onChange={(event) => onChange(part.clientId, { transcript: event.target.value })}
          placeholder="Paste or edit the transcript here"
        />
      </div>

      <div className="mb-8 space-y-4">
        <ComicTitle level={4} className="text-[var(--comic-primary)]">
          AI Question Generation Settings
        </ComicTitle>

        <div>
          <ComicText className="font-bold mb-1 text-sm">Question Framework</ComicText>
          <input
            className="w-full comic-input"
            value={part.question_framework}
            onChange={(event) =>
              onChange(part.clientId, { question_framework: event.target.value })
            }
            placeholder={DEFAULT_QUESTION_FRAMEWORK}
          />
        </div>

        <div>
          <ComicText className="font-bold mb-2 text-sm">Difficulty (CEFR)</ComicText>
          <div className="flex flex-wrap gap-3">
            {CEFR_LEVELS.map((level) => (
              <label key={level} className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
                <input
                  type="checkbox"
                  checked={part.cefr_levels.includes(level)}
                  onChange={() => toggleCefr(level)}
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <ComicButton
            type="button"
            variant="primary"
            size="sm"
            disabled={generatingPart !== null}
            onClick={() => handleGenerateQuestions('A')}
          >
            {generatingPart === 'A' ? 'Generating…' : 'Generate 5 Main Idea Questions'}
          </ComicButton>
          <ComicButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={generatingPart !== null}
            onClick={() => handleGenerateQuestions('B')}
          >
            {generatingPart === 'B' ? 'Generating…' : 'Generate 5 Detail Questions'}
          </ComicButton>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <ComicTitle level={4} className="text-[var(--comic-accent)]">
            Questions
          </ComicTitle>
          <ComicButton type="button" variant="accent" size="sm" onClick={addManualQuestion}>
            + Add Question
          </ComicButton>
        </div>

        {part.questions.length === 0 ? (
          <ComicText className="text-sm italic text-[var(--comic-dark)]">
            No questions yet. Add manual questions or generate Part A / Part B with AI.
          </ComicText>
        ) : (
          <div className="space-y-4">
            {part.questions.map((question, questionIndex) => (
              <QuestionEditor
                key={question.clientId}
                question={question}
                index={questionIndex}
                onChange={updateQuestion}
                onDelete={deleteQuestion}
                onDragStart={handleQuestionDragStart}
                onDragOver={handleQuestionDragOver}
                onDrop={handleQuestionDrop}
              />
            ))}
          </div>
        )}
      </div>

      {error ? <ComicText className="text-[var(--comic-danger)] font-bold mt-4">{error}</ComicText> : null}
    </ComicCard>
    </div>
  );
}
