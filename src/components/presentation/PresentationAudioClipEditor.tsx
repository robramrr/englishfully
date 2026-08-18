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
import {
  createEmptyAudioTrack,
  getPresentationAudioTracks,
  PRESENTATION_CHOICE_LETTERS,
  withSyncedAudioTrackFields,
  type PresentationAudioTrack,
  type PresentationChoiceLetter,
  type PresentationSlide,
} from '@/lib/presentation/types';

interface PresentationAudioClipEditorProps {
  slide: PresentationSlide;
  onChange: (patch: Partial<PresentationSlide>) => void;
}

/**
 * Shared audio URL + multiple tracks (clips), each with its own correct letter.
 * Images stay shared on the slide.
 */
export default function PresentationAudioClipEditor({
  slide,
  onChange,
}: PresentationAudioClipEditorProps) {
  const tracks = getPresentationAudioTracks(slide);
  const [activeTrackId, setActiveTrackId] = useState(tracks[0]?.id || '');
  const [segments, setSegments] = useState<TranscriptSegmentDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeTrack =
    tracks.find((track) => track.id === activeTrackId) || tracks[0] || createEmptyAudioTrack();

  function commitTracks(nextTracks: PresentationAudioTrack[]) {
    onChange(withSyncedAudioTrackFields({ audioTracks: nextTracks }));
  }

  function updateActiveTrack(patch: Partial<PresentationAudioTrack>) {
    const next = tracks.map((track) =>
      track.id === activeTrack.id ? { ...track, ...patch } : track
    );
    commitTracks(next);
  }

  function handleAddTrack() {
    const nextTrack = createEmptyAudioTrack();
    commitTracks([...tracks, nextTrack]);
    setActiveTrackId(nextTrack.id);
    setMessage('Added another track. Pick a clip and set its correct answer.');
  }

  function handleRemoveTrack(trackId: string) {
    if (tracks.length <= 1) return;
    const next = tracks.filter((track) => track.id !== trackId);
    commitTracks(next);
    setActiveTrackId(next[0]?.id || '');
  }

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
        `Created ${nextSegments.length} clip${nextSegments.length === 1 ? '' : 's'}. Assign one to the selected track below.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
    } finally {
      setBusy(false);
    }
  }

  function selectSegment(segment: TranscriptSegmentDraft) {
    updateActiveTrack({
      startSeconds: Number(segment.start_seconds) || 0,
      endSeconds: Number(segment.end_seconds) || 5,
      clipText: String(segment.sentence_text || ''),
    });
  }

  const selectedKey = `${activeTrack.startSeconds}-${activeTrack.endSeconds}`;

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
      <div>
        <ComicText className="font-black">Audio tracks</ComicText>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          One shared audio URL and the same A–D images. Add more tracks when several clips use
          those pictures (each track has its own correct letter).
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
        <ComicButton type="button" variant="accent" size="sm" onClick={handleAddTrack}>
          + Add track
        </ComicButton>
      </div>

      {error ? (
        <ComicText className="text-sm font-bold text-[var(--comic-danger)]">{error}</ComicText>
      ) : null}
      {message ? (
        <ComicText className="text-sm font-bold text-[var(--comic-success)]">{message}</ComicText>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tracks.map((track, index) => {
          const active = track.id === activeTrack.id;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => setActiveTrackId(track.id)}
              className={[
                'border-2 border-[var(--comic-black)] px-3 py-1 text-sm font-black',
                active
                  ? 'bg-[var(--comic-secondary)] text-white'
                  : 'bg-white text-[var(--comic-dark)]',
              ].join(' ')}
            >
              Track {index + 1}
              {track.correctChoice ? ` · ${track.correctChoice}` : ''}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 rounded-md border-2 border-[var(--comic-black)] bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ComicText className="font-black">
            Editing track {Math.max(1, tracks.findIndex((t) => t.id === activeTrack.id) + 1)}
          </ComicText>
          {tracks.length > 1 ? (
            <ComicButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleRemoveTrack(activeTrack.id)}
            >
              Remove track
            </ComicButton>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Clip start</ComicText>
            <input
              className="comic-input w-full"
              value={formatTimestamp(activeTrack.startSeconds)}
              onChange={(event) =>
                updateActiveTrack({ startSeconds: parseTimestamp(event.target.value) })
              }
              placeholder="0:00.0"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Clip end</ComicText>
            <input
              className="comic-input w-full"
              value={formatTimestamp(activeTrack.endSeconds)}
              onChange={(event) =>
                updateActiveTrack({ endSeconds: parseTimestamp(event.target.value) })
              }
              placeholder="0:05.0"
            />
          </label>
        </div>

        {activeTrack.clipText ? (
          <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
            Selected clip: {activeTrack.clipText}
          </ComicText>
        ) : null}

        <div className="space-y-2">
          <ComicText className="text-sm font-bold">Correct answer for this track</ComicText>
          <div className="flex flex-wrap gap-3">
            {PRESENTATION_CHOICE_LETTERS.map((letter) => (
              <label key={letter} className="inline-flex items-center gap-2 font-bold">
                <input
                  type="radio"
                  name={`correct-choice-${slide.id}-${activeTrack.id}`}
                  checked={activeTrack.correctChoice === letter}
                  onChange={() =>
                    updateActiveTrack({ correctChoice: letter as PresentationChoiceLetter })
                  }
                />
                {letter}
              </label>
            ))}
          </div>
        </div>

        {slide.audioUrl.trim() ? (
          <div>
            <ComicText className="mb-2 text-sm font-black">Preview this track</ComicText>
            <SegmentAudioPlayer
              audioUrl={slide.audioUrl}
              startSeconds={activeTrack.startSeconds}
              endSeconds={activeTrack.endSeconds}
              compact
              label="Play clip"
            />
          </div>
        ) : null}
      </div>

      {segments.length > 0 ? (
        <div className="space-y-2">
          <ComicText className="text-sm font-black">
            Pick a clip for track{' '}
            {Math.max(1, tracks.findIndex((t) => t.id === activeTrack.id) + 1)}
          </ComicText>
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
                    name={`audio-clip-${slide.id}-${activeTrack.id}`}
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
