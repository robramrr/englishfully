'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import type { VocabDeckListItem } from '@/lib/vocabulary/types';

let cachedDecks: VocabDeckListItem[] | null = null;
let loadingDecks: Promise<VocabDeckListItem[]> | null = null;

function loadDecks(force = false): Promise<VocabDeckListItem[]> {
  if (!force && cachedDecks) return Promise.resolve(cachedDecks);
  if (!force && loadingDecks) return loadingDecks;
  loadingDecks = fetch('/api/vocabulary/decks', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      cachedDecks = (data.decks || []) as VocabDeckListItem[];
      return cachedDecks;
    })
    .catch(() => [])
    .finally(() => {
      loadingDecks = null;
    });
  return loadingDecks;
}

export function refreshVocabDeckOptions() {
  cachedDecks = null;
}

export default function VocabDeckLinkSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (deckId: string) => void;
}) {
  const [decks, setDecks] = useState<VocabDeckListItem[]>(cachedDecks || []);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current && cachedDecks) return;
    loaded.current = true;
    void loadDecks().then(setDecks);
  }, []);

  const known = decks.some((deck) => deck.id === value);

  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <ComicText className="text-sm font-bold">Pre-teach vocabulary</ComicText>
        <select
          className="comic-input w-full font-bold"
          value={value}
          onFocus={() => {
            void loadDecks(true).then(setDecks);
          }}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">No vocabulary deck</option>
          {value && !known ? <option value={value}>Linked deck</option> : null}
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.title || 'Untitled deck'} ({deck.card_count} cards)
            </option>
          ))}
        </select>
      </label>
      <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
        {value
          ? 'This picture gets a Vocab button in the presentation so you can flip through the words first.'
          : 'Link a deck when you want to pre-teach these words from the picture.'}{' '}
        <Link href="/teacher-resources/vocabulary" className="text-[var(--comic-secondary)] underline">
          {decks.length ? 'Manage decks' : 'Create a deck'}
        </Link>
      </ComicText>
    </div>
  );
}
