'use client';

import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import { formatTimestamp, parseTimestamp } from '@/lib/listen-and-learn/types';

export interface ClientLearnVocabulary {
  clientId: string;
  id?: string;
  word: string;
  definition: string;
  start_seconds: number;
  end_seconds: number;
  keep_word: boolean;
}

interface VocabularyReviewProps {
  audioUrl: string;
  vocabulary: ClientLearnVocabulary[];
  onChange: (vocabulary: ClientLearnVocabulary[]) => void;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
}

export default function VocabularyReview({
  audioUrl,
  vocabulary,
  onChange,
  onGenerate,
  generating,
  canGenerate,
}: VocabularyReviewProps) {
  function updateItem(clientId: string, updates: Partial<ClientLearnVocabulary>) {
    onChange(
      vocabulary.map((item) => (item.clientId === clientId ? { ...item, ...updates } : item))
    );
  }

  function removeItem(clientId: string) {
    onChange(vocabulary.filter((item) => item.clientId !== clientId));
  }

  function addManualWord() {
    onChange([
      ...vocabulary,
      {
        clientId: crypto.randomUUID(),
        word: '',
        definition: '',
        start_seconds: 0,
        end_seconds: 0.8,
        keep_word: true,
      },
    ]);
  }

  const keptCount = vocabulary.filter((item) => item.keep_word).length;

  return (
    <div className="space-y-4">
      <ComicText className="text-[var(--comic-dark)] font-bold">
        Generate about 5 key vocabulary words from the transcript. Each word gets an audio clip from
        the recording plus a clear definition. Keep, edit, remove, or add your own words.
      </ComicText>

      <div className="flex flex-wrap gap-2">
        <ComicButton
          variant="secondary"
          size="sm"
          disabled={generating || !canGenerate}
          onClick={onGenerate}
        >
          {generating ? 'Generating vocabulary…' : 'Generate 5 vocabulary words'}
        </ComicButton>
        <ComicButton variant="accent" size="sm" onClick={addManualWord}>
          + Add word manually
        </ComicButton>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)] self-center">
          {keptCount} word{keptCount === 1 ? '' : 's'} kept
        </ComicText>
      </div>

      {vocabulary.length === 0 ? (
        <ComicText className="text-[var(--comic-dark)] font-bold">
          No vocabulary words yet. Generate from the transcript or add words manually.
        </ComicText>
      ) : (
        <div className="space-y-4">
          {vocabulary.map((item, index) => (
            <div
              key={item.clientId}
              className="comic-border-thick rounded-lg p-4 bg-white space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ComicText className="font-black text-[var(--comic-primary)]">
                  Word {index + 1}
                </ComicText>
                <div className="flex flex-wrap gap-3 items-center">
                  <label className="flex items-center gap-2 font-bold">
                    <input
                      type="checkbox"
                      checked={item.keep_word}
                      onChange={(event) =>
                        updateItem(item.clientId, { keep_word: event.target.checked })
                      }
                    />
                    Keep word
                  </label>
                  <ComicButton
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(item.clientId)}
                  >
                    Remove
                  </ComicButton>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <ComicText className="font-black">Word</ComicText>
                  <input
                    value={item.word}
                    onChange={(event) => updateItem(item.clientId, { word: event.target.value })}
                    className="w-full comic-border-thick rounded-md p-3 font-bold"
                    placeholder="e.g. recycle"
                  />
                </label>
                <div className="space-y-1">
                  <ComicText className="font-black">Audio clip</ComicText>
                  {audioUrl.trim() && item.end_seconds > item.start_seconds ? (
                    <SegmentAudioPlayer
                      audioUrl={audioUrl}
                      startSeconds={item.start_seconds}
                      endSeconds={item.end_seconds}
                      maxReplays={null}
                      label="▶ Play word"
                      compact
                    />
                  ) : (
                    <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                      Set start/end times to preview the clip.
                    </ComicText>
                  )}
                </div>
              </div>

              <label className="space-y-1 block">
                <ComicText className="font-black">Definition</ComicText>
                <textarea
                  value={item.definition}
                  onChange={(event) =>
                    updateItem(item.clientId, { definition: event.target.value })
                  }
                  rows={2}
                  className="w-full comic-border-thick rounded-md p-3 font-bold"
                  placeholder="Clear, simple definition for students"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                <label className="space-y-1">
                  <ComicText className="font-black text-sm">Start</ComicText>
                  <input
                    type="text"
                    value={formatTimestamp(item.start_seconds)}
                    onChange={(event) =>
                      updateItem(item.clientId, {
                        start_seconds: parseTimestamp(event.target.value),
                      })
                    }
                    className="w-full comic-border-thick rounded-md p-2 font-bold"
                  />
                </label>
                <label className="space-y-1">
                  <ComicText className="font-black text-sm">End</ComicText>
                  <input
                    type="text"
                    value={formatTimestamp(item.end_seconds)}
                    onChange={(event) =>
                      updateItem(item.clientId, {
                        end_seconds: parseTimestamp(event.target.value),
                      })
                    }
                    className="w-full comic-border-thick rounded-md p-2 font-bold"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
