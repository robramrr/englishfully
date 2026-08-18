'use client';

import { useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SegmentAudioPlayer from '../listen-and-learn/SegmentAudioPlayer';
import {
  formatTimestamp,
  parseTimestamp,
  type TranscriptSegmentDraft,
} from '@/lib/listen-and-learn/types';
import type { PresentationSlide } from '@/lib/presentation/types';

interface PresentationAudioClipEditorProps {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
}

/**
 * Reuses Listen & Learn transcript API + SegmentAudioPlayer for clip picking.
 */
export default function PresentationAudioClipEditor({
  slide,
  onChange,
}: PresentationAudioClipEditorProps) {
  const [segments, setSegments] = useState<TranscriptSegmentDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleTranscribe() {
    if (!slide.audioUrl.trim()) {
      setError('Enter an audio URL before auto-transcribing.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/listen-and-learn/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_url: slide.audioUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process transcript');

      const nextSegments = (data.segments || []) as TranscriptSegmentDraft[];
      setSegments(nextSegments);
      onChange({
        audioTranscript: String(data.transcript || ''),
      });
      setMessage(
        `Created ${nextSegments.length} clip${nextSegments.length === 1 ? '' : 's'}. Pick one below.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
    } finally {
      setBusy(false);
    }
  }

  function selectSegment(segment: TranscriptSegmentDraft) {
    onChange({
      audioStartSeconds: Number(segment.start_seconds) || 0,
      audioEndSeconds: Number(segment.end_seconds) || 5,
      audioClipText: String(segment.sentence_text || ''),
    });
  }

  const selectedKey = `${slide.audioStartSeconds}-${slide.audioEndSeconds}`;

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div>
        <ComicText className="font-black">Audio clip</ComicText>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Same flow as Listen &amp; Learn: paste an audio URL, auto-transcribe, then pick one
          segment to play on the slide.
        </ComicText>
      </div>

      <label className="block space-y-1">
        <ComicText className="text-sm font-bold">Audio URL</ComicText>
        <input
          className="comic-input w-full"
          value={slide.audioUrl}
          onChange={(event) => onChange({ audioUrl: event.target.value.trim() })}
          placeholder="https://…"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy || !slide.audioUrl.trim()}
          onClick={() => void handleTranscribe()}
        >
          {busy ? 'Transcribing…' : 'Auto-transcribe & make clips'}
        </ComicButton>
      </div>

      {error ? (
        <ComicText className="text-sm font-bold text-[var(--comic-danger)]">{error}</ComicText>
      ) : null}
      {message ? (
        <ComicText className="text-sm font-bold text-[var(--comic-success)]">{message}</ComicText>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Clip start</ComicText>
          <input
            className="comic-input w-full"
            value={formatTimestamp(slide.audioStartSeconds)}
            onChange={(event) =>
              onChange({ audioStartSeconds: parseTimestamp(event.target.value) })
            }
            placeholder="0:00.0"
          />
        </label>
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Clip end</ComicText>
          <input
            className="comic-input w-full"
            value={formatTimestamp(slide.audioEndSeconds)}
            onChange={(event) =>
              onChange({ audioEndSeconds: parseTimestamp(event.target.value) })
            }
            placeholder="0:05.0"
          />
        </label>
      </div>

      {slide.audioClipText ? (
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Selected clip: {slide.audioClipText}
        </ComicText>
      ) : null}

      {slide.audioUrl.trim() ? (
        <div className="rounded-md border-2 border-[var(--comic-black)] bg-white p-3">
          <ComicText className="mb-2 text-sm font-black">Preview selected clip</ComicText>
          <SegmentAudioPlayer
            audioUrl={slide.audioUrl}
            startSeconds={slide.audioStartSeconds}
            endSeconds={slide.audioEndSeconds}
            compact
            label="Play clip"
          />
        </div>
      ) : null}

      {segments.length > 0 ? (
        <div className="space-y-2">
          <ComicText className="text-sm font-black">Pick a clip</ComicText>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border-2 border-[var(--comic-black)] bg-white p-2">
            {segments.map((segment, index) => {
              const key = `${segment.start_seconds}-${segment.end_seconds}`;
              const active = key === selectedKey;
              return (
                <label
                  key={`${index}-${key}`}
                  className={[
                    'flex cursor-pointer items-start gap-2 rounded-md border-2 p-2',
                    active
                      ? 'border-[var(--comic-primary)] bg-[var(--comic-primary)]/10'
                      : 'border-[var(--comic-black)]/30',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name={`audio-clip-${slide.id}`}
                    className="mt-1"
                    checked={active}
                    onChange={() => selectSegment(segment)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[var(--comic-dark)]">
                      {segment.sentence_text || `Clip ${index + 1}`}
                    </span>
                    <span className="block text-xs font-bold text-[var(--comic-dark)]/70">
                      {formatTimestamp(segment.start_seconds)} →{' '}
                      {formatTimestamp(segment.end_seconds)}
                    </span>
                    {slide.audioUrl.trim() ? (
                      <div className="mt-1">
                        <SegmentAudioPlayer
                          audioUrl={slide.audioUrl}
                          startSeconds={segment.start_seconds}
                          endSeconds={segment.end_seconds}
                          compact
                          label="Preview"
                        />
                      </div>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {slide.audioTranscript.trim() ? (
        <label className="block space-y-1">
          <ComicText className="text-sm font-bold">Transcript (reference)</ComicText>
          <textarea
            className="comic-textarea w-full min-h-[80px]"
            value={slide.audioTranscript}
            onChange={(event) => onChange({ audioTranscript: event.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}
