'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SlideCanvas from './SlideCanvas';
import PresentationPreview from './PresentationPreview';
import PresentationShareBar from './PresentationShareBar';
import { structurePastedContent, cleanSlideText } from '@/lib/presentation/parsePaste';
import {
  clearPresentationDraftById,
  loadPresentationDraftById,
  savePresentationDraftById,
} from '@/lib/presentation/storage';
import {
  createEmptyDeck,
  createEmptySlide,
  normalizeDeck,
  type PresentationDeck,
  type PresentationSlide,
  type PresentationSlideLayout,
} from '@/lib/presentation/types';

const LAYOUT_OPTIONS: { value: PresentationSlideLayout; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'content', label: 'Text + image' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'image', label: 'Image focus' },
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

  function handleMoveSlide(slideId: string, direction: -1 | 1) {
    const index = deck.slides.findIndex((slide) => slide.id === slideId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= deck.slides.length) return;
    const next = [...deck.slides];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setDeck((prev) => ({ ...prev, slides: next }));
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
      <PresentationShareBar
        deck={deck}
        onDeckSaved={(saved) => {
          setDeck(saved);
          setMessage('Presentation saved for sharing.');
        }}
      />

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
            Present fullscreen
          </ComicButton>
          <ComicButton type="button" variant="accent" size="sm" onClick={() => handleAddSlide('content')}>
            + Add slide
          </ComicButton>
          <ComicButton type="button" variant="warning" size="sm" onClick={handleReset}>
            Clear draft
          </ComicButton>
        </div>
        {message ? (
          <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
        ) : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-3">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Paste &amp; structure
        </ComicTitle>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Paste lesson notes. Separate slides with a blank line, <code>---</code>, or lines like
          <code> Slide 2:</code> / <code># Heading</code>. Bullets and image URLs are detected
          automatically and cleaned into the comic theme.
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

                <label className="block space-y-1">
                  <ComicText className="text-sm font-bold">
                    {selected.layout === 'title' ? 'Title' : 'Slide title'}
                  </ComicText>
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
                </label>

                <label className="block space-y-1">
                  <ComicText className="text-sm font-bold">
                    {selected.layout === 'title'
                      ? 'Subtitle'
                      : selected.layout === 'content'
                        ? 'Definition / explanation'
                        : 'Text'}
                  </ComicText>
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
                </label>

                {(selected.layout === 'content' ||
                  selected.layout === 'image' ||
                  selected.layout === 'bullets') && (
                  <label className="block space-y-1">
                    <ComicText className="text-sm font-bold">Bullets (one per line)</ComicText>
                    <textarea
                      className="comic-textarea w-full min-h-[100px]"
                      value={selected.bullets.join('\n')}
                      onChange={(event) =>
                        setDeck((prev) =>
                          updateSlide(prev, selected.id, {
                            // Keep blank lines while typing so Enter can start the next bullet
                            bullets: event.target.value.split(/\r?\n/),
                          })
                        )
                      }
                      onBlur={() =>
                        setDeck((prev) =>
                          updateSlide(prev, selected.id, {
                            bullets: (
                              prev.slides.find((slide) => slide.id === selected.id)?.bullets || []
                            )
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        )
                      }
                      onKeyDown={(event) => event.stopPropagation()}
                      placeholder={'- I wake up at 6.\n- I eat breakfast.'}
                    />
                  </label>
                )}

                {(selected.layout === 'content' || selected.layout === 'image') && (
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
                )}

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
