'use client';

import { useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import SegmentAudioPlayer from './SegmentAudioPlayer';
import { formatTimestamp, parseTimestamp } from '@/lib/listen-and-learn/types';

export interface ClientLearnVocabulary {
  clientId: string;
  id?: string;
  word: string;
  definition: string;
  image_url: string;
  start_seconds: number;
  end_seconds: number;
  keep_word: boolean;
}

interface VocabularyReviewProps {
  assignmentId: string;
  audioUrl: string;
  vocabulary: ClientLearnVocabulary[];
  onChange: (vocabulary: ClientLearnVocabulary[]) => void;
  onPersistVocabulary?: (vocabulary: ClientLearnVocabulary[]) => void | Promise<void>;
  onGenerate: () => void;
  generating: boolean;
  canGenerate: boolean;
}

export default function VocabularyReview({
  assignmentId,
  audioUrl,
  vocabulary,
  onChange,
  onPersistVocabulary,
  onGenerate,
  generating,
  canGenerate,
}: VocabularyReviewProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  function updateItem(clientId: string, updates: Partial<ClientLearnVocabulary>) {
    const next = vocabulary.map((item) =>
      item.clientId === clientId ? { ...item, ...updates } : item
    );
    onChange(next);
    return next;
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
        image_url: '',
        start_seconds: 0,
        end_seconds: 0.8,
        keep_word: true,
      },
    ]);
  }

  async function handleGenerateImage(item: ClientLearnVocabulary) {
    if (!item.word.trim()) {
      setImageError('Enter the word before generating an image.');
      return;
    }
    setGeneratingImageId(item.clientId);
    setImageError('');
    try {
      const response = await fetch('/api/listen-and-learn/generate-vocabulary-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: assignmentId,
          word: item.word.trim(),
          definition: item.definition.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image generation failed');
      const next = updateItem(item.clientId, { image_url: String(data.image_url || '') });
      if (onPersistVocabulary) await onPersistVocabulary(next);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Image generation failed');
    } finally {
      setGeneratingImageId(null);
    }
  }

  async function handleUploadImage(item: ClientLearnVocabulary, file: File | null) {
    if (!file) return;
    setUploadingImageId(item.clientId);
    setImageError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignment_id', assignmentId);
      formData.append('word', item.word.trim() || 'word');
      const response = await fetch('/api/listen-and-learn/upload-vocabulary-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Image upload failed');
      const next = updateItem(item.clientId, { image_url: String(data.image_url || '') });
      if (onPersistVocabulary) await onPersistVocabulary(next);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImageId(null);
    }
  }

  const keptCount = vocabulary.filter((item) => item.keep_word).length;

  return (
    <div className="space-y-4">
      <ComicText className="text-[var(--comic-dark)] font-bold">
        Generate about 5 key vocabulary words from the transcript. Each word gets an audio clip from
        the recording plus a clear definition. Optionally add an AI image, upload a file, or paste an
        image URL. Keep, edit, remove, or add your own words.
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

      {imageError ? (
        <ComicText className="text-[var(--comic-danger)] font-bold">{imageError}</ComicText>
      ) : null}

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

              <div className="space-y-3 comic-border-thick rounded-lg p-3 bg-[var(--comic-light)]">
                <ComicText className="font-black">Vocabulary image (optional)</ComicText>
                <div className="flex flex-wrap gap-2">
                  <ComicButton
                    variant="secondary"
                    size="sm"
                    disabled={
                      generatingImageId === item.clientId ||
                      uploadingImageId === item.clientId ||
                      !item.word.trim()
                    }
                    onClick={() => void handleGenerateImage(item)}
                  >
                    {generatingImageId === item.clientId
                      ? 'Generating image…'
                      : 'Generate image'}
                  </ComicButton>
                  <ComicButton
                    variant="accent"
                    size="sm"
                    disabled={uploadingImageId === item.clientId || generatingImageId === item.clientId}
                    onClick={() => fileInputRefs.current[item.clientId]?.click()}
                  >
                    {uploadingImageId === item.clientId ? 'Uploading…' : 'Upload image'}
                  </ComicButton>
                  {item.image_url.trim() ? (
                    <ComicButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        const next = updateItem(item.clientId, { image_url: '' });
                        if (onPersistVocabulary) void onPersistVocabulary(next);
                      }}
                    >
                      Clear image
                    </ComicButton>
                  ) : null}
                </div>
                <input
                  ref={(element) => {
                    fileInputRefs.current[item.clientId] = element;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUploadImage(item, file);
                    event.target.value = '';
                  }}
                />
                <label className="space-y-1 block">
                  <ComicText className="font-black text-sm">Or paste image URL</ComicText>
                  <input
                    value={item.image_url}
                    onChange={(event) =>
                      updateItem(item.clientId, { image_url: event.target.value })
                    }
                    onBlur={(event) => {
                      const next = updateItem(item.clientId, {
                        image_url: event.target.value,
                      });
                      if (onPersistVocabulary) void onPersistVocabulary(next);
                    }}
                    className="w-full comic-border-thick rounded-md p-2 font-bold bg-white"
                    placeholder="https://..."
                  />
                </label>
                {item.image_url.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url.trim()}
                    alt={`${item.word || 'Vocabulary'} illustration`}
                    className="max-h-48 w-auto comic-border rounded-lg object-contain bg-white"
                  />
                ) : null}
              </div>

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
                    onBlur={(event) => {
                      const next = updateItem(item.clientId, {
                        start_seconds: parseTimestamp(event.target.value),
                      });
                      if (onPersistVocabulary) void onPersistVocabulary(next);
                    }}
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
                    onBlur={(event) => {
                      const next = updateItem(item.clientId, {
                        end_seconds: parseTimestamp(event.target.value),
                      });
                      if (onPersistVocabulary) void onPersistVocabulary(next);
                    }}
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
