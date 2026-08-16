'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import ComicButton from '@/components/ComicButton';
import ComicText from '@/components/ComicText';
import PresentationPreview from '@/components/presentation/PresentationPreview';
import {
  createEmptyDeck,
  normalizeDeck,
  type PresentationDeck,
} from '@/lib/presentation/types';

export default function PublicPresentationPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [presenting, setPresenting] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const response = await fetch(`/api/presentation/decks/${id}`, {
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Presentation not found');
        }
        setDeck(normalizeDeck(data.presentation));
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
        setDeck(null);
      } finally {
        setLoaded(true);
      }
    })();
  }, [id]);

  const liveDeck = useMemo(() => deck || createEmptyDeck(), [deck]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--comic-light)]">
        <ComicText className="font-bold">Loading presentation…</ComicText>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--comic-light)] px-4">
        <ComicText className="font-bold text-[var(--comic-danger)]">
          {error || 'Presentation not found'}
        </ComicText>
      </div>
    );
  }

  if (presenting) {
    return (
      <PresentationPreview
        deck={liveDeck}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setPresenting(false)}
        fullscreen
        onGrammarTextChange={(slideId, grammarText) =>
          setDeck((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              slides: prev.slides.map((slide) =>
                slide.id === slideId ? { ...slide, grammarText } : slide
              ),
            };
          })
        }
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--comic-light)] px-4">
      <ComicText className="font-black text-2xl text-[var(--comic-secondary)]">
        {deck.title || 'Presentation'}
      </ComicText>
      <ComicButton type="button" variant="primary" size="md" onClick={() => setPresenting(true)}>
        Present
      </ComicButton>
    </div>
  );
}
