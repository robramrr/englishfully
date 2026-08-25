'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SlideCanvas from './SlideCanvas';
import PresentationPreview from './PresentationPreview';
import PresentationShareBar from './PresentationShareBar';
import SlideTextStyleControls from './SlideTextStyleControls';
import PresentationAudioClipEditor from './PresentationAudioClipEditor';
import { structurePastedContent, cleanSlideText } from '@/lib/presentation/parsePaste';
import {
  clearPresentationDraftById,
  loadPresentationDraftById,
  savePresentationDraftById,
} from '@/lib/presentation/storage';
import {
  createEmptyAudioTrack,
  createEmptyDeck,
  createEmptyDescribeWord,
  createEmptyMatchPair,
  createEmptySlide,
  createEmptyTableHeaders,
  createEmptyTableRows,
  createSlideId,
  MAX_MATCH_PAIRS,
  normalizeBulletsKeepGaps,
  normalizeDeck,
  PRESENTATION_CHOICE_LETTERS,
  type PresentationDeck,
  type PresentationDescribeWord,
  type PresentationSlide,
  type PresentationSlideLayout,
} from '@/lib/presentation/types';

const LAYOUT_OPTIONS: { value: PresentationSlideLayout; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'content', label: 'Text + image' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'image', label: 'Image focus' },
  { value: 'audio_image', label: 'Audio + image' },
  { value: 'describe_image', label: 'Describe + image' },
  { value: 'match_text_image', label: 'Match text → image' },
];

function updateSlide(
  deck: PresentationDeck,
  slideId: string,
  patch: Partial<PresentationSlide>
): PresentationDeck {
  return {
    ...deck,
    slides: deck.slides.map((slide) =>
      slide.id === slideId ? { ...slide, ...patch } : slide
    ),
  };
}

interface PresentationEditorProps {
  presentationId: string;
}

export default function PresentationEditor({ presentationId }: PresentationEditorProps) {
  const [deck, setDeck] = useState<PresentationDeck>(() =>
    createEmptyDeck()
  );
  const [selectedId, setSelectedId] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState<'off' | 'panel' | 'fullscreen'>('off');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [describeAnalyzing, setDescribeAnalyzing] = useState(false);
  const [newDescribeWord, setNewDescribeWord] = useState('');
  const [newDescribeMatches, setNewDescribeMatches] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/presentation/decks/${presentationId}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (cancelled) return;
        if (response.ok && data.presentation) {
          const loaded = normalizeDeck(data.presentation);
          setDeck(loaded);
          setSelectedId(loaded.slides[0]?.id || '');
          savePresentationDraftById(loaded);
        } else {
          const local = loadPresentationDraftById(presentationId);
          if (local) {
            setDeck(local);
            setSelectedId(local.slides[0]?.id || '');
          } else {
            setError(data.error || 'Presentation not found');
          }
        }
      } catch {
        if (cancelled) return;
        const local = loadPresentationDraftById(presentationId);
        if (local) {
          setDeck(local);
          setSelectedId(local.slides[0]?.id || '');
        } else {
          setError('Failed to load presentation');
        }
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [presentationId]);

  useEffect(() => {
    if (!hydrated || !deck.id) return;
    savePresentationDraftById(deck);
  }, [deck, hydrated]);

  const selected =
    deck.slides.find((slide) => slide.id === selectedId) || deck.slides[0] || null;

  const selectedIndex = useMemo(() => {
    if (!selected) return 0;
    return Math.max(
      0,
      deck.slides.findIndex((slide) => slide.id === selected.id)
    );
  }, [deck.slides, selected]);

  const [contentImageSlots, setContentImageSlots] = useState(1);

  useEffect(() => {
    if (!selected || selected.layout !== 'content') {
      setContentImageSlots(1);
      return;
    }
    const filled = [selected.imageUrl, selected.imageUrl2, selected.imageUrl3].filter((url) =>
      String(url ?? '').trim()
    ).length;
    setContentImageSlots(Math.max(1, filled));
  }, [selected?.id, selected?.layout]);

  function handleStructurePaste() {
    const next = structurePastedContent(pasteText);
    setDeck((prev) =>
      normalizeDeck({
        ...next,
        id: prev.id,
        brandLabel: prev.brandLabel,
        status: prev.status,
      })
    );
    setSelectedId(next.slides[0]?.id || '');
    setMessage(`Structured into ${next.slides.length} clean slides.`);
    setPasteText('');
  }

  function handleAddSlide(layout: PresentationSlideLayout = 'content') {
    const slide = createEmptySlide(layout);
    setDeck((prev) => ({ ...prev, slides: [...prev.slides, slide] }));
    setSelectedId(slide.id);
  }

  function handleRemoveSlide(slideId: string) {
    if (deck.slides.length <= 1) {
      setMessage('Keep at least one slide.');
      return;
    }
    const nextSlides = deck.slides.filter((slide) => slide.id !== slideId);
    setDeck((prev) => ({ ...prev, slides: nextSlides }));
    setSelectedId(nextSlides[Math.max(0, selectedIndex - 1)]?.id || nextSlides[0].id);
  }

  function handleDuplicateSlide(slideId: string) {
    const index = deck.slides.findIndex((slide) => slide.id === slideId);
    if (index < 0) return;
    const source = deck.slides[index];
    const copy: PresentationSlide = {
      ...source,
      id: createSlideId(),
      bullets: [...source.bullets],
      choiceImages: [...source.choiceImages],
      audioTracks: source.audioTracks.map((track) =>
        createEmptyAudioTrack({ ...track, id: undefined })
      ),
      describeWords: source.describeWords.map((word) =>
        createEmptyDescribeWord({ text: word.text, matches: word.matches })
      ),
      matchPairs: (source.matchPairs || []).map((pair) =>
        createEmptyMatchPair({ word: pair.word, imageUrl: pair.imageUrl })
      ),
    };
    const next = [...deck.slides];
    next.splice(index + 1, 0, copy);
    setDeck((prev) => ({ ...prev, slides: next }));
    setSelectedId(copy.id);
  }

  function handleMoveSlide(slideId: string, direction: -1 | 1) {
    const index = deck.slides.findIndex((slide) => slide.id === slideId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= deck.slides.length) return;
    const next = [...deck.slides];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setDeck((prev) => ({ ...prev, slides: next }));
  }

  async function handleAnalyzeDescribeImage() {
    if (!selected?.imageUrl.trim()) {
      setError('Paste an image URL first.');
      return;
    }
    setDescribeAnalyzing(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/presentation/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: selected.imageUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }
      const matches = Array.isArray(data.matches) ? data.matches : [];
      const distractors = Array.isArray(data.distractors) ? data.distractors : [];
      const describeWords: PresentationDescribeWord[] = [
        ...matches.map((text: unknown) =>
          createEmptyDescribeWord({ text: String(text ?? ''), matches: true })
        ),
        ...distractors.map((text: unknown) =>
          createEmptyDescribeWord({ text: String(text ?? ''), matches: false })
        ),
      ].filter((word) => word.text);
      setDeck((prev) => updateSlide(prev, selected.id, { describeWords }));
      setMessage(
        `Added ${describeWords.filter((w) => w.matches).length} matches and ${
          describeWords.filter((w) => !w.matches).length
        } distractors.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setDescribeAnalyzing(false);
    }
  }

  function handleAddDescribeWord() {
    if (!selected) return;
    const text = newDescribeWord.trim();
    if (!text) return;
    const next = [
      ...selected.describeWords,
      createEmptyDescribeWord({ text, matches: newDescribeMatches }),
    ];
    setDeck((prev) => updateSlide(prev, selected.id, { describeWords: next }));
    setNewDescribeWord('');
  }

  function handleReset() {
    if (!window.confirm('Reset this presentation to a blank draft?')) return;
    const empty = normalizeDeck({
      ...createEmptyDeck(),
      id: presentationId,
      status: deck.status,
    });
    clearPresentationDraftById(presentationId);
    setDeck(empty);
    setSelectedId(empty.slides[0].id);
    setMessage('Presentation reset locally — save or publish to update the server.');
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/presentation/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck: { ...deck, status: deck.status || 'draft' },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setDeck(data.presentation as PresentationDeck);
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/presentation/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck, publish: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish');
      setDeck(data.presentation as PresentationDeck);
      setMessage('Published. Share the link or QR above.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSaving(false);
    }
  }

  function openPreview(mode: 'panel' | 'fullscreen') {
    setPreviewIndex(selectedIndex);
    setPreviewMode(mode);
  }

  if (loading) {
    return <ComicText className="font-bold">Loading presentation…</ComicText>;
  }

  if (error && !deck.slides.length) {
    return (
      <ComicCard className="comic-shadow-xl space-y-3">
        <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
      </ComicCard>
    );
  }

  if (previewMode === 'fullscreen') {
    return (
      <PresentationPreview
        deck={deck}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewMode('off')}
        fullscreen
        onGrammarTextChange={(slideId, grammarText) =>
          setDeck((prev) => updateSlide(prev, slideId, { grammarText }))
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Presentation
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Build classroom slides with the Englishfully look. Paste notes to auto-structure them,
          edit each slide, then preview like a PowerPoint deck.
        </ComicText>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Banner title</ComicText>
            <input
              className="comic-input w-full"
              value={deck.brandLabel}
              onChange={(event) =>
                setDeck((prev) => ({ ...prev, brandLabel: event.target.value }))
              }
              placeholder="Englishfully"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Presentation title</ComicText>
            <input
              className="comic-input w-full"
              value={deck.title}
              onChange={(event) => {
                const title = event.target.value;
                setDeck((prev) => {
                  const slides = [...prev.slides];
                  if (slides[0]?.layout === 'title') {
                    slides[0] = { ...slides[0], title };
                  }
                  return { ...prev, title, slides };
                });
              }}
              placeholder="Unit 3: Daily routines"
            />
          </label>
          <label className="block space-y-1">
            <ComicText className="text-sm font-bold">Subtitle</ComicText>
            <input
              className="comic-input w-full"
              value={deck.subtitle}
              onChange={(event) => {
                const subtitle = event.target.value;
                setDeck((prev) => {
                  const slides = [...prev.slides];
                  if (slides[0]?.layout === 'title') {
                    slides[0] = { ...slides[0], body: subtitle };
                  }
                  return { ...prev, subtitle, slides };
                });
              }}
              placeholder="Listen, speak, and practice"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <ComicButton type="button" variant="secondary" size="sm" onClick={() => openPreview('panel')}>
            Preview
          </ComicButton>
          <ComicButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openPreview('fullscreen')}
          >
            Fullscreen
          </ComicButton>
          <ComicButton type="button" variant="warning" size="sm" onClick={handleReset}>
            Clear
          </ComicButton>
          <ComicButton
            type="button"
            variant="accent"
            size="sm"
            disabled={saving}
            onClick={() => void handleSaveDraft()}
          >
            {saving ? 'Saving…' : 'Save'}
          </ComicButton>
          <ComicButton
            type="button"
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={() => void handlePublish()}
          >
            {saving ? 'Publishing…' : 'Publish'}
          </ComicButton>
        </div>
        {message ? (
          <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </ComicCard>

      <PresentationShareBar
        deck={deck}
        onDeckSaved={(saved) => {
          setDeck(saved);
          setMessage('Presentation saved for sharing.');
        }}
      />

      <ComicCard className="comic-shadow-xl space-y-3">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Paste &amp; structure
        </ComicTitle>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Paste lesson notes. Separate slides with a blank line, <code>---</code>, or lines like
          <code> Slide 2:</code> / <code># Heading</code>. Bullets and image URLs are detected
          automatically.
        </ComicText>
        <textarea
          className="comic-textarea w-full min-h-[140px]"
          value={pasteText}
          onChange={(event) => setPasteText(event.target.value)}
          placeholder={`Unit 3: Daily Routines\nMorning habits for A2 learners\n\n---\n\nWarm-up\nWhat do you do every morning?\nhttps://example.com/morning.jpg\n\n---\n\nKey phrases\n- I wake up at 6.\n- I brush my teeth.\n- I eat breakfast.`}
        />
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={!pasteText.trim()}
          onClick={handleStructurePaste}
        >
          Structure into slides
        </ComicButton>
      </ComicCard>

      {previewMode === 'panel' ? (
        <ComicCard className="comic-shadow-xl">
          <PresentationPreview
            deck={deck}
            index={previewIndex}
            onIndexChange={setPreviewIndex}
            onClose={() => setPreviewMode('off')}
            onGrammarTextChange={(slideId, grammarText) =>
              setDeck((prev) => updateSlide(prev, slideId, { grammarText }))
            }
          />
        </ComicCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ComicCard className="comic-shadow-xl space-y-3 h-fit">
          <ComicText className="font-black">Slides</ComicText>
          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {deck.slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setSelectedId(slide.id)}
                className={[
                  'w-full text-left border-4 border-[var(--comic-black)] p-2 comic-shadow-sm transition',
                  slide.id === selected?.id
                    ? 'bg-[var(--comic-secondary)] text-white'
                    : 'bg-white hover:brightness-95',
                ].join(' ')}
              >
                <div className="text-xs font-bold opacity-80">
                  {index + 1}. {LAYOUT_OPTIONS.find((item) => item.value === slide.layout)?.label}
                </div>
                <div className="font-bold truncate">
                  {slide.title || (index === 0 ? deck.title : 'Untitled')}
                </div>
              </button>
            ))}
          </div>
          <ComicButton
            type="button"
            variant="accent"
            size="sm"
            className="w-full"
            onClick={() => handleAddSlide('content')}
          >
            + Add slide
          </ComicButton>
        </ComicCard>

        <div className="space-y-6 min-w-0">
          {selected ? (
            <>
              <ComicCard className="comic-shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ComicTitle level={3} className="text-[var(--comic-secondary)]">
                    Edit slide {selectedIndex + 1}
                  </ComicTitle>
                  <div className="flex flex-wrap gap-2">
                    <ComicButton
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => handleMoveSlide(selected.id, -1)}
                      disabled={selectedIndex === 0}
                    >
                      ↑
                    </ComicButton>
                    <ComicButton
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => handleMoveSlide(selected.id, 1)}
                      disabled={selectedIndex >= deck.slides.length - 1}
                    >
                      ↓
                    </ComicButton>
                    <ComicButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDuplicateSlide(selected.id)}
                    >
                      Duplicate
                    </ComicButton>
                    <ComicButton
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveSlide(selected.id)}
                    >
                      Delete
                    </ComicButton>
                  </div>
                </div>

                <label className="block space-y-1">
                  <ComicText className="text-sm font-bold">Layout</ComicText>
                  <select
                    className="comic-input w-full"
                    value={selected.layout}
                    onChange={(event) =>
                      setDeck((prev) =>
                        updateSlide(prev, selected.id, {
                          layout: event.target.value as PresentationSlideLayout,
                        })
                      )
                    }
                  >
                    {LAYOUT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="block space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ComicText className="text-sm font-bold">
                      {selected.layout === 'title' ? 'Title' : 'Slide title'}
                    </ComicText>
                    <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                      <span className="text-sm">{selected.showTitle ? 'On' : 'Off'}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-9 accent-[var(--comic-primary)]"
                        checked={selected.showTitle}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              showTitle: event.target.checked,
                            })
                          )
                        }
                      />
                    </label>
                  </div>
                  <input
                    className="comic-input w-full"
                    value={selected.title}
                    onChange={(event) => {
                      const title = event.target.value;
                      setDeck((prev) => {
                        let next = updateSlide(prev, selected.id, { title });
                        if (selected.layout === 'title' || selectedIndex === 0) {
                          next = { ...next, title };
                        }
                        return next;
                      });
                    }}
                    placeholder="Slide heading"
                  />
                </div>

                <div className="block space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ComicText className="text-sm font-bold">
                      {selected.layout === 'title'
                        ? 'Subtitle'
                        : selected.layout === 'content'
                          ? 'Definition / explanation'
                          : selected.layout === 'audio_image' ||
                              selected.layout === 'describe_image' ||
                              selected.layout === 'match_text_image'
                            ? 'Prompt (optional)'
                            : 'Text'}
                    </ComicText>
                    <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                      <span className="text-sm">{selected.showBody ? 'On' : 'Off'}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-9 accent-[var(--comic-primary)]"
                        checked={selected.showBody}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              showBody: event.target.checked,
                            })
                          )
                        }
                      />
                    </label>
                  </div>
                  <textarea
                    className="comic-textarea w-full min-h-[120px]"
                    value={selected.body}
                    onChange={(event) => {
                      const body = event.target.value;
                      setDeck((prev) => {
                        let next = updateSlide(prev, selected.id, { body });
                        if (selected.layout === 'title' || selectedIndex === 0) {
                          next = { ...next, subtitle: body };
                        }
                        return next;
                      });
                    }}
                    onBlur={() =>
                      setDeck((prev) =>
                        updateSlide(prev, selected.id, {
                          body: cleanSlideText(selected.body),
                        })
                      )
                    }
                    placeholder={
                      selected.layout === 'title'
                        ? 'Short subtitle for the opening slide'
                        : selected.layout === 'content'
                          ? 'e.g. Possessive adjectives show who something belongs to (my, your, his…).'
                          : 'Main text for this slide'
                    }
                  />
                  <SlideTextStyleControls
                    fontSize={selected.bodyFontSize}
                    color={selected.bodyColor}
                    onFontSizeChange={(bodyFontSize) =>
                      setDeck((prev) => updateSlide(prev, selected.id, { bodyFontSize }))
                    }
                    onColorChange={(bodyColor) =>
                      setDeck((prev) => updateSlide(prev, selected.id, { bodyColor }))
                    }
                  />
                </div>

                {(selected.layout === 'content' ||
                  selected.layout === 'image' ||
                  selected.layout === 'bullets') && (
                  <div className="block space-y-1">
                    <ComicText className="text-sm font-bold">Bullets (one per line)</ComicText>
                    <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
                      Leave a blank line before or between points for extra spacing.
                    </ComicText>
                    <textarea
                      className="comic-textarea w-full min-h-[100px]"
                      value={selected.bullets.join('\n')}
                      onChange={(event) =>
                        setDeck((prev) =>
                          updateSlide(prev, selected.id, {
                            // Keep blank lines so Enter Enter adds spacing between bullets
                            bullets: event.target.value.split(/\r?\n/),
                          })
                        )
                      }
                      onBlur={() =>
                        setDeck((prev) =>
                          updateSlide(prev, selected.id, {
                            bullets: normalizeBulletsKeepGaps(
                              prev.slides.find((slide) => slide.id === selected.id)?.bullets || []
                            ),
                          })
                        )
                      }
                      onKeyDown={(event) => event.stopPropagation()}
                      placeholder={
                        '- I wake up at 6.\n\n- I eat breakfast.'
                      }
                    />
                    <SlideTextStyleControls
                      fontSize={selected.bulletsFontSize}
                      color={selected.bulletsColor}
                      onFontSizeChange={(bulletsFontSize) =>
                        setDeck((prev) => updateSlide(prev, selected.id, { bulletsFontSize }))
                      }
                      onColorChange={(bulletsColor) =>
                        setDeck((prev) => updateSlide(prev, selected.id, { bulletsColor }))
                      }
                    />
                  </div>
                )}

                {(selected.layout === 'content' || selected.layout === 'image') && (
                  <div className="space-y-3">
                    {selected.layout === 'image' ? (
                      <>
                        <label className="block space-y-1">
                          <ComicText className="text-sm font-bold">Image URL</ComicText>
                          <input
                            className="comic-input w-full"
                            value={selected.imageUrl}
                            onChange={(event) =>
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, {
                                  imageUrl: event.target.value.trim(),
                                })
                              )
                            }
                            placeholder="https://…"
                          />
                        </label>
                        <label className="block space-y-1">
                          <ComicText className="text-sm font-bold">Image alt text</ComicText>
                          <input
                            className="comic-input w-full"
                            value={selected.imageAlt}
                            onChange={(event) =>
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, {
                                  imageAlt: event.target.value,
                                })
                              )
                            }
                            placeholder="Describe the image"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        {(
                          [
                            {
                              index: 1,
                              urlKey: 'imageUrl' as const,
                              altKey: 'imageAlt' as const,
                              url: selected.imageUrl,
                              alt: selected.imageAlt,
                            },
                            {
                              index: 2,
                              urlKey: 'imageUrl2' as const,
                              altKey: 'imageAlt2' as const,
                              url: selected.imageUrl2,
                              alt: selected.imageAlt2,
                            },
                            {
                              index: 3,
                              urlKey: 'imageUrl3' as const,
                              altKey: 'imageAlt3' as const,
                              url: selected.imageUrl3,
                              alt: selected.imageAlt3,
                            },
                          ] as const
                        )
                          .slice(0, contentImageSlots)
                          .map((slot) => (
                            <div
                              key={slot.index}
                              className="space-y-2 border-4 border-[var(--comic-black)]/20 bg-[var(--comic-light)]/30 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <ComicText className="text-sm font-black">
                                  Image {slot.index}
                                </ComicText>
                                {slot.index > 1 ? (
                                  <button
                                    type="button"
                                    className="text-sm font-bold text-[var(--comic-primary)] underline-offset-2 hover:underline"
                                    onClick={() => {
                                      const urls = [
                                        selected.imageUrl,
                                        selected.imageUrl2,
                                        selected.imageUrl3,
                                      ];
                                      const alts = [
                                        selected.imageAlt,
                                        selected.imageAlt2,
                                        selected.imageAlt3,
                                      ];
                                      urls.splice(slot.index - 1, 1);
                                      alts.splice(slot.index - 1, 1);
                                      while (urls.length < 3) urls.push('');
                                      while (alts.length < 3) alts.push('');
                                      setDeck((prev) =>
                                        updateSlide(prev, selected.id, {
                                          imageUrl: urls[0] || '',
                                          imageAlt: alts[0] || '',
                                          imageUrl2: urls[1] || '',
                                          imageAlt2: alts[1] || '',
                                          imageUrl3: urls[2] || '',
                                          imageAlt3: alts[2] || '',
                                        })
                                      );
                                      setContentImageSlots((count) => Math.max(1, count - 1));
                                    }}
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                              <label className="block space-y-1">
                                <ComicText className="text-sm font-bold">Image URL</ComicText>
                                <input
                                  className="comic-input w-full"
                                  value={slot.url}
                                  onChange={(event) =>
                                    setDeck((prev) =>
                                      updateSlide(prev, selected.id, {
                                        [slot.urlKey]: event.target.value.trim(),
                                      })
                                    )
                                  }
                                  placeholder="https://…"
                                />
                              </label>
                              <label className="block space-y-1">
                                <ComicText className="text-sm font-bold">Image alt text</ComicText>
                                <input
                                  className="comic-input w-full"
                                  value={slot.alt}
                                  onChange={(event) =>
                                    setDeck((prev) =>
                                      updateSlide(prev, selected.id, {
                                        [slot.altKey]: event.target.value,
                                      })
                                    )
                                  }
                                  placeholder="Describe the image"
                                />
                              </label>
                            </div>
                          ))}
                        {contentImageSlots < 3 ? (
                          <ComicButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setContentImageSlots((count) => Math.min(3, count + 1))
                            }
                          >
                            + Add image
                          </ComicButton>
                        ) : null}
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          One image sits beside the text. Two or three sit in a row below.
                        </ComicText>
                      </>
                    )}
                  </div>
                )}

                {selected.layout === 'content' ? (
                  <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <ComicText className="font-black">Table</ComicText>
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          Optional table on the left, directly under the definition.
                        </ComicText>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                        <span className="text-sm">
                          {selected.tableEnabled ? 'On' : 'Off'}
                        </span>
                        <input
                          type="checkbox"
                          className="h-5 w-9 accent-[var(--comic-primary)]"
                          checked={selected.tableEnabled}
                          onChange={(event) =>
                            setDeck((prev) =>
                              updateSlide(prev, selected.id, {
                                tableEnabled: event.target.checked,
                                ...(event.target.checked &&
                                selected.tableHeaders.every((cell) => !cell.trim())
                                  ? {
                                      tableHeaders: createEmptyTableHeaders(2),
                                      tableRows: createEmptyTableRows(2, 2),
                                    }
                                  : {}),
                              })
                            )
                          }
                        />
                      </label>
                    </div>
                    {selected.tableEnabled ? (
                      <div className="space-y-3">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[280px] border-collapse border-2 border-[var(--comic-black)] bg-white">
                            <thead>
                              <tr className="bg-[#d0d0d0]">
                                {selected.tableHeaders.map((cell, colIndex) => (
                                  <th key={`th-${colIndex}`} className="border border-[var(--comic-black)] p-1">
                                    <input
                                      className="comic-input w-full min-w-[5rem] text-sm font-black"
                                      value={cell}
                                      onChange={(event) => {
                                        const next = [...selected.tableHeaders];
                                        next[colIndex] = event.target.value;
                                        setDeck((prev) =>
                                          updateSlide(prev, selected.id, {
                                            tableHeaders: next,
                                          })
                                        );
                                      }}
                                      placeholder={`Heading ${colIndex + 1}`}
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selected.tableRows.map((row, rowIndex) => (
                                <tr key={`tr-${rowIndex}`}>
                                  {selected.tableHeaders.map((_, colIndex) => (
                                    <td
                                      key={`td-${rowIndex}-${colIndex}`}
                                      className="border border-[var(--comic-black)] p-1"
                                    >
                                      <input
                                        className="comic-input w-full min-w-[5rem] text-sm"
                                        value={row[colIndex] ?? ''}
                                        onChange={(event) => {
                                          const nextRows = selected.tableRows.map((item) => [
                                            ...item,
                                          ]);
                                          while (nextRows[rowIndex].length < selected.tableHeaders.length) {
                                            nextRows[rowIndex].push('');
                                          }
                                          nextRows[rowIndex][colIndex] = event.target.value;
                                          setDeck((prev) =>
                                            updateSlide(prev, selected.id, {
                                              tableRows: nextRows,
                                            })
                                          );
                                        }}
                                        placeholder="…"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <ComicButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const cols = selected.tableHeaders.length;
                              if (selected.tableRows.length >= 12) return;
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, {
                                  tableRows: [
                                    ...selected.tableRows,
                                    createEmptyTableHeaders(cols),
                                  ],
                                })
                              );
                            }}
                          >
                            + Row
                          </ComicButton>
                          <ComicButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              if (selected.tableHeaders.length >= 6) return;
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, {
                                  tableHeaders: [...selected.tableHeaders, ''],
                                  tableRows: selected.tableRows.map((row) => [...row, '']),
                                })
                              );
                            }}
                          >
                            + Column
                          </ComicButton>
                          {selected.tableRows.length > 1 ? (
                            <ComicButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setDeck((prev) =>
                                  updateSlide(prev, selected.id, {
                                    tableRows: selected.tableRows.slice(0, -1),
                                  })
                                )
                              }
                            >
                              − Row
                            </ComicButton>
                          ) : null}
                          {selected.tableHeaders.length > 1 ? (
                            <ComicButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setDeck((prev) =>
                                  updateSlide(prev, selected.id, {
                                    tableHeaders: selected.tableHeaders.slice(0, -1),
                                    tableRows: selected.tableRows.map((row) =>
                                      row.slice(0, -1)
                                    ),
                                  })
                                )
                              }
                            >
                              − Column
                            </ComicButton>
                          ) : null}
                        </div>
                        <SlideTextStyleControls
                          fontSize={selected.tableFontSize}
                          color={selected.tableColor}
                          onFontSizeChange={(tableFontSize) =>
                            setDeck((prev) =>
                              updateSlide(prev, selected.id, { tableFontSize })
                            )
                          }
                          onColorChange={(tableColor) =>
                            setDeck((prev) =>
                              updateSlide(prev, selected.id, { tableColor })
                            )
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {selected.layout === 'audio_image' ? (
                  <div className="space-y-4">
                    <PresentationAudioClipEditor
                      slide={selected}
                      onChange={(patch) =>
                        setDeck((prev) => updateSlide(prev, selected.id, patch))
                      }
                    />
                    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                      <div>
                        <ComicText className="font-black">Choice images (A–D)</ComicText>
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          Shared across every track on this slide. Set each track’s correct letter
                          in the audio section above.
                        </ComicText>
                      </div>
                      {PRESENTATION_CHOICE_LETTERS.map((letter, index) => (
                        <label key={letter} className="block space-y-1">
                          <ComicText className="text-sm font-bold">Image {letter}</ComicText>
                          <input
                            className="comic-input w-full"
                            value={selected.choiceImages[index] || ''}
                            onChange={(event) => {
                              const next = [...selected.choiceImages];
                              while (next.length < 4) next.push('');
                              next[index] = event.target.value.trim();
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, { choiceImages: next.slice(0, 4) })
                              );
                            }}
                            placeholder="https://…"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selected.layout === 'describe_image' ? (
                  <div className="space-y-4">
                    <label className="block space-y-1">
                      <ComicText className="text-sm font-bold">Image URL</ComicText>
                      <input
                        className="comic-input w-full"
                        value={selected.imageUrl}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              imageUrl: event.target.value.trim(),
                            })
                          )
                        }
                        placeholder="https://…"
                      />
                    </label>
                    <label className="block space-y-1">
                      <ComicText className="text-sm font-bold">Image alt text</ComicText>
                      <input
                        className="comic-input w-full"
                        value={selected.imageAlt}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              imageAlt: event.target.value,
                            })
                          )
                        }
                        placeholder="Describe the image"
                      />
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <ComicButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={describeAnalyzing || !selected.imageUrl.trim()}
                        onClick={() => void handleAnalyzeDescribeImage()}
                      >
                        {describeAnalyzing ? 'Analyzing…' : 'Analyze image'}
                      </ComicButton>
                      <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                        Suggests matches + distractors from the picture (replaces the word bank).
                      </ComicText>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-1">
                        <ComicText className="text-sm font-bold">Words needed to finish</ComicText>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          className="comic-input w-full"
                          value={selected.describeWordsNeeded}
                          onChange={(event) =>
                            setDeck((prev) =>
                              updateSlide(prev, selected.id, {
                                describeWordsNeeded: Math.max(
                                  1,
                                  Math.min(50, Number(event.target.value) || 1)
                                ),
                              })
                            )
                          }
                        />
                      </label>
                      <ComicText className="self-end text-sm font-bold text-[var(--comic-dark)]">
                        Use the slide Timer section below for a countdown (locks picks when time
                        runs out).
                      </ComicText>
                    </div>

                    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                      <div>
                        <ComicText className="font-black">Word bank</ComicText>
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          Green tags = match the image. Red tags = distractors. Toggle Match on
                          each word.
                        </ComicText>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="min-w-[12rem] flex-1 space-y-1">
                          <ComicText className="text-sm font-bold">Add word</ComicText>
                          <input
                            className="comic-input w-full"
                            value={newDescribeWord}
                            onChange={(event) => setNewDescribeWord(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddDescribeWord();
                              }
                            }}
                            placeholder="noun or adjective"
                          />
                        </label>
                        <label className="inline-flex items-center gap-2 pb-2 font-bold">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-[var(--comic-primary)]"
                            checked={newDescribeMatches}
                            onChange={(event) => setNewDescribeMatches(event.target.checked)}
                          />
                          <span className="text-sm">Match</span>
                        </label>
                        <ComicButton
                          type="button"
                          variant="accent"
                          size="sm"
                          onClick={handleAddDescribeWord}
                        >
                          Add
                        </ComicButton>
                      </div>
                      {selected.describeWords.length === 0 ? (
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]/60">
                          No words yet — Analyze or add them manually.
                        </ComicText>
                      ) : (
                        <ul className="space-y-2">
                          {selected.describeWords.map((word) => (
                            <li
                              key={word.id}
                              className="flex flex-wrap items-center gap-2 rounded-md border-2 border-[var(--comic-black)] bg-white px-2 py-1.5"
                            >
                              <input
                                className="comic-input min-w-[8rem] flex-1"
                                value={word.text}
                                onChange={(event) => {
                                  const text = event.target.value;
                                  setDeck((prev) =>
                                    updateSlide(prev, selected.id, {
                                      describeWords: selected.describeWords.map((item) =>
                                        item.id === word.id ? { ...item, text } : item
                                      ),
                                    })
                                  );
                                }}
                              />
                              <label className="inline-flex items-center gap-1.5 font-bold text-sm">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-[#15803d]"
                                  checked={word.matches}
                                  onChange={(event) =>
                                    setDeck((prev) =>
                                      updateSlide(prev, selected.id, {
                                        describeWords: selected.describeWords.map((item) =>
                                          item.id === word.id
                                            ? { ...item, matches: event.target.checked }
                                            : item
                                        ),
                                      })
                                    )
                                  }
                                />
                                Match
                              </label>
                              <span
                                className="rounded px-2 py-0.5 text-xs font-black text-white"
                                style={{
                                  backgroundColor: word.matches ? '#15803d' : '#ea1225',
                                }}
                              >
                                {word.matches ? 'green' : 'red'}
                              </span>
                              <ComicButton
                                type="button"
                                variant="accent"
                                size="sm"
                                onClick={() =>
                                  setDeck((prev) =>
                                    updateSlide(prev, selected.id, {
                                      describeWords: selected.describeWords.filter(
                                        (item) => item.id !== word.id
                                      ),
                                    })
                                  )
                                }
                              >
                                Remove
                              </ComicButton>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : null}

                {selected.layout === 'match_text_image' ? (
                  <div className="space-y-4">
                    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                      <div>
                        <ComicText className="font-black">
                          Match pairs ({selected.matchPairs.length}/{MAX_MATCH_PAIRS})
                        </ComicText>
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          Add a vocabulary word and its image URL on the same row — that locks the
                          match. On the slide, words appear on top and images below (shuffled).
                          Students tap a word, then the matching picture.
                        </ComicText>
                      </div>

                      <div className="space-y-3">
                        {selected.matchPairs.map((pair, index) => (
                          <div
                            key={pair.id}
                            className="space-y-2 border-4 border-[var(--comic-black)] bg-white p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <ComicText className="text-sm font-black">
                                Pair {index + 1}
                              </ComicText>
                              <ComicButton
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  setDeck((prev) =>
                                    updateSlide(prev, selected.id, {
                                      matchPairs: selected.matchPairs.filter(
                                        (item) => item.id !== pair.id
                                      ),
                                    })
                                  )
                                }
                              >
                                Remove
                              </ComicButton>
                            </div>
                            <label className="block space-y-1">
                              <ComicText className="text-sm font-bold">Vocabulary word</ComicText>
                              <input
                                className="comic-input w-full"
                                value={pair.word}
                                onChange={(event) => {
                                  const word = event.target.value;
                                  setDeck((prev) =>
                                    updateSlide(prev, selected.id, {
                                      matchPairs: selected.matchPairs.map((item) =>
                                        item.id === pair.id ? { ...item, word } : item
                                      ),
                                    })
                                  );
                                }}
                                placeholder="e.g. apple"
                              />
                            </label>
                            <label className="block space-y-1">
                              <ComicText className="text-sm font-bold">Image URL</ComicText>
                              <input
                                className="comic-input w-full"
                                value={pair.imageUrl}
                                onChange={(event) => {
                                  const imageUrl = event.target.value.trim();
                                  setDeck((prev) =>
                                    updateSlide(prev, selected.id, {
                                      matchPairs: selected.matchPairs.map((item) =>
                                        item.id === pair.id ? { ...item, imageUrl } : item
                                      ),
                                    })
                                  );
                                }}
                                placeholder="https://…"
                              />
                            </label>
                            {pair.imageUrl.trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pair.imageUrl}
                                alt={pair.word || `Pair ${index + 1}`}
                                className="h-20 w-20 border-4 border-[var(--comic-black)] object-cover"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <ComicButton
                        type="button"
                        variant="accent"
                        size="sm"
                        disabled={selected.matchPairs.length >= MAX_MATCH_PAIRS}
                        onClick={() =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              matchPairs: [
                                ...selected.matchPairs,
                                createEmptyMatchPair(),
                              ].slice(0, MAX_MATCH_PAIRS),
                            })
                          )
                        }
                      >
                        + Add pair
                      </ComicButton>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <ComicText className="font-black">Slide timer</ComicText>
                      <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                        Optional countdown for this slide only (think time, speak time, etc.).
                        Works with any layout. Start it while presenting.
                      </ComicText>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                      <span className="text-sm">{selected.timerEnabled ? 'On' : 'Off'}</span>
                      <input
                        type="checkbox"
                        className="h-5 w-9 accent-[var(--comic-primary)]"
                        checked={selected.timerEnabled}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              timerEnabled: event.target.checked,
                            })
                          )
                        }
                      />
                    </label>
                  </div>
                  {selected.timerEnabled ? (
                    <label className="block max-w-xs space-y-1">
                      <ComicText className="text-sm font-bold">Seconds</ComicText>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        className="comic-input w-full"
                        value={selected.timerSeconds}
                        onChange={(event) =>
                          setDeck((prev) =>
                            updateSlide(prev, selected.id, {
                              timerSeconds: Math.max(
                                5,
                                Math.min(600, Number(event.target.value) || 60)
                              ),
                            })
                          )
                        }
                        placeholder="25, 60…"
                      />
                    </label>
                  ) : null}
                </div>

                {selected.layout === 'content' ? (
                  <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-light)]/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <ComicText className="font-black">Grammar highlighter</ComicText>
                        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                          Keeps your definition above. Adds one separate practice text box on
                          the slide — type or paste examples; after a full stop, target grammar
                          highlights yellow in that box only.
                        </ComicText>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                        <span className="text-sm">
                          {selected.grammarHighlighterEnabled ? 'On' : 'Off'}
                        </span>
                        <input
                          type="checkbox"
                          className="h-5 w-9 accent-[var(--comic-primary)]"
                          checked={selected.grammarHighlighterEnabled}
                          onChange={(event) =>
                            setDeck((prev) =>
                              updateSlide(prev, selected.id, {
                                grammarHighlighterEnabled: event.target.checked,
                              })
                            )
                          }
                        />
                      </label>
                    </div>
                    {selected.grammarHighlighterEnabled ? (
                      <div className="space-y-3">
                        <label className="block space-y-1">
                          <ComicText className="text-sm font-bold">Target grammar</ComicText>
                          <input
                            className="comic-input w-full"
                            value={selected.grammarTarget}
                            onChange={(event) =>
                              setDeck((prev) =>
                                updateSlide(prev, selected.id, {
                                  grammarTarget: event.target.value,
                                })
                              )
                            }
                            placeholder="e.g. Possessive Adjectives"
                          />
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <ComicText className="text-sm font-bold">Custom placeholder</ComicText>
                            <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
                              Override “Example...” with a form/reminder (line breaks allowed).
                            </ComicText>
                          </div>
                          <label className="inline-flex cursor-pointer items-center gap-2 font-bold">
                            <span className="text-sm">
                              {selected.grammarCustomPlaceholderEnabled ? 'On' : 'Off'}
                            </span>
                            <input
                              type="checkbox"
                              className="h-5 w-9 accent-[var(--comic-primary)]"
                              checked={selected.grammarCustomPlaceholderEnabled}
                              onChange={(event) =>
                                setDeck((prev) =>
                                  updateSlide(prev, selected.id, {
                                    grammarCustomPlaceholderEnabled: event.target.checked,
                                  })
                                )
                              }
                            />
                          </label>
                        </div>
                        {selected.grammarCustomPlaceholderEnabled ? (
                          <label className="block space-y-1">
                            <ComicText className="text-sm font-bold">
                              Placeholder text
                            </ComicText>
                            <textarea
                              className="comic-textarea w-full min-h-[100px]"
                              value={selected.grammarPlaceholder}
                              onChange={(event) =>
                                setDeck((prev) =>
                                  updateSlide(prev, selected.id, {
                                    grammarPlaceholder: event.target.value,
                                  })
                                )
                              }
                              onKeyDown={(event) => event.stopPropagation()}
                              placeholder={
                                'Subject + Adverb + Adjective\nSubject + Verb + Object'
                              }
                            />
                          </label>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </ComicCard>

              <div>
                <ComicText className="mb-2 font-black">Live slide</ComicText>
                <SlideCanvas
                  slide={selected}
                  deck={deck}
                  slideNumber={selectedIndex + 1}
                  totalSlides={deck.slides.length}
                  showImageSlot
                  liveEditable={
                    selected.layout === 'content' && selected.grammarHighlighterEnabled
                  }
                  onGrammarTextChange={
                    selected.layout === 'content' && selected.grammarHighlighterEnabled
                      ? (grammarText) =>
                          setDeck((prev) => updateSlide(prev, selected.id, { grammarText }))
                      : undefined
                  }
                />
              </div>
            </>
          ) : (
            <ComicCard className="comic-shadow-xl">
              <ComicText className="font-bold">Add a slide to get started.</ComicText>
            </ComicCard>
          )}
        </div>
      </div>
    </div>
  );
}
