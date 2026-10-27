'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import { refreshVocabDeckOptions } from '../../../components/presentation/VocabDeckLinkSelect';
import {
  createEmptyVocabCard,
  createVocabDeckId,
  type VocabDeck,
  type VocabDeckListItem,
} from '@/lib/vocabulary/types';

function VocabularyHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<VocabDeckListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/vocabulary/decks', { cache: 'no-store' });
    if (!response.ok) {
      setItems([]);
      setLoaded(true);
      return;
    }
    const data = await response.json();
    setItems(data.decks || []);
    setLoaded(true);
    refreshVocabDeckOptions();
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/vocabulary/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true, title: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create deck');
      refreshVocabDeckOptions();
      router.push(`/teacher-resources/vocabulary/${data.deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError('');
    try {
      const loadResponse = await fetch(`/api/vocabulary/decks/${id}`, { cache: 'no-store' });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) throw new Error(loadData.error || 'Failed to load deck');
      const source = loadData.deck as VocabDeck;
      const copy: VocabDeck = {
        ...source,
        id: createVocabDeckId(),
        title: `${source.title?.trim() || 'Untitled deck'} (copy)`,
        updatedAt: new Date().toISOString(),
        cards: (source.cards || []).map((card) =>
          createEmptyVocabCard({
            word: card.word,
            meaning: card.meaning,
            example: card.example,
            partOfSpeech: card.partOfSpeech,
            imageUrl: card.imageUrl,
          })
        ),
      };
      const saveResponse = await fetch('/api/vocabulary/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck: copy }),
      });
      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) throw new Error(saveData.error || 'Failed to duplicate deck');
      setMessage('Deck duplicated.');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    } finally {
      setDuplicatingId('');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title || 'Untitled deck'}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/vocabulary/decks/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Failed to delete');
      return;
    }
    setMessage('Deck deleted.');
    await loadList();
  }

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources">
          <ComicButton variant="accent" size="sm">
            ← Back to Teacher Resources
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl text-center space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Vocabulary flashcards
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Build a deck with a word, a simple meaning, and an optional picture. Open it on its own,
          or link it to a picture in a presentation so you can pre-teach the words.
        </ComicText>
        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={creating}
          onClick={() => void handleCreate()}
        >
          {creating ? 'Creating…' : '+ New deck'}
        </ComicButton>
        {message ? (
          <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
        ) : null}
        {error ? (
          <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
        ) : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Your decks
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No decks yet. Click “New deck” to start.
          </ComicText>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-4 border-[var(--comic-black)] bg-white p-4"
              >
                <div className="min-w-0 space-y-1">
                  <ComicText className="font-black truncate">
                    {item.title || 'Untitled deck'}
                  </ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.level}
                    {item.topic ? ` · ${item.topic}` : ''} · {item.card_count} cards ·{' '}
                    {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher-resources/vocabulary/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">
                      Edit
                    </ComicButton>
                  </Link>
                  <Link href={`/vocabulary/${item.id}`} target="_blank">
                    <ComicButton variant="primary" size="sm">
                      Practice
                    </ComicButton>
                  </Link>
                  <ComicButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={duplicatingId === item.id}
                    onClick={() => void handleDuplicate(item.id)}
                  >
                    {duplicatingId === item.id ? 'Duplicating…' : 'Duplicate'}
                  </ComicButton>
                  <ComicButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDelete(item.id, item.title)}
                  >
                    Delete
                  </ComicButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComicCard>
    </section>
  );
}

export default function VocabularyPage() {
  return (
    <div className="vocabulary-page presentation-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <VocabularyHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
