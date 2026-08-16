'use client';

import { useEffect, useMemo, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import SlideCanvas from './SlideCanvas';
import PresentationPreview from './PresentationPreview';
import { structurePastedContent, cleanSlideText } from '@/lib/presentation/parsePaste';
import {
  clearPresentationDraft,
  loadPresentationDraft,
  savePresentationDraft,
} from '@/lib/presentation/storage';
import {
  createEmptyDeck,
  createEmptySlide,
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

export default function PresentationEditor() {
  const [deck, setDeck] = useState<PresentationDeck>(() => createEmptyDeck());
  const [selectedId, setSelectedId] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');
  const [previewMode, setPreviewMode] = useState<'off' | 'panel' | 'fullscreen'>('off');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadPresentationDraft();
    setDeck(saved);
    setSelectedId(saved.slides[0]?.id || '');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePresentationDraft(deck);
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
    setDeck(next);
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
    if (!window.confirm('Clear this presentation draft?')) return;
    const empty = createEmptyDeck();
    clearPresentationDraft();
    setDeck(empty);
    setSelectedId(empty.slides[0].id);
    setMessage('Draft cleared.');
  }

  function openPreview(mode: 'panel' | 'fullscreen') {
    setPreviewIndex(selectedIndex);
    setPreviewMode(mode);
  }

  if (previewMode === 'fullscreen') {
    return (
      <PresentationPreview
        deck={deck}
        index={previewIndex}
        onIndexChange={setPreviewIndex}
        onClose={() => setPreviewMode('off')}
        fullscreen
        onSlideBodyChange={(slideId, body) =>
          setDeck((prev) => updateSlide(prev, slideId, { body }))
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

        <div className="grid gap-4 md:grid-cols-2">
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
            onSlideBodyChange={(slideId, body) =>
              setDeck((prev) => updateSlide(prev, slideId, { body }))
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

                {selected.layout === 'title' || !selected.grammarHighlighterEnabled ? (
                  <label className="block space-y-1">
                    <ComicText className="text-sm font-bold">
                      {selected.layout === 'title' ? 'Subtitle' : 'Text'}
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
                          : 'Main text for this slide'
                      }
                    />
                  </label>
                ) : (
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    Text box is on the live slide below — type there (highlights after a full
                    stop). Your existing text stays until you edit it.
                  </ComicText>
                )}

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
                            bullets: event.target.value
                              .split(/\r?\n/)
                              .map((line) => line.trim())
                              .filter(Boolean),
                          })
                        )
                      }
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
                          Turns on one text box on the slide. Type or paste there; after a full
                          stop, target grammar lights up yellow in that same box (no second field).
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
                      <label className="block space-y-1">
                        <ComicText className="text-sm font-bold">
                          Target grammar
                        </ComicText>
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
                  onBodyChange={
                    selected.layout === 'content' && selected.grammarHighlighterEnabled
                      ? (body) => setDeck((prev) => updateSlide(prev, selected.id, { body }))
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
