'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ComicButton from '../../../../components/ComicButton';
import ComicCard from '../../../../components/ComicCard';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import {
  createChallengeActivityId,
  createEmptyChallengeWord,
  type DefinitionChallengeActivity,
  type DefinitionChallengeListItem,
} from '@/lib/definition-challenge/types';

function DefinitionChallengeHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<DefinitionChallengeListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/definition-challenge/activities', { cache: 'no-store' });
    if (!response.ok) {
      setItems([]);
      setLoaded(true);
      return;
    }
    const data = await response.json();
    setItems(data.activities || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/definition-challenge/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create the challenge');
      router.push(`/teacher-resources/vocab-bingo/definition-challenge/${data.activity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the challenge');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setError('');
    try {
      const loadResponse = await fetch(`/api/definition-challenge/activities/${id}`, { cache: 'no-store' });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) throw new Error(loadData.error || 'Failed to load the challenge');
      const source = loadData.activity as DefinitionChallengeActivity;
      const idMap = new Map<string, string>();
      const words = (source.words || []).map((item) => {
        const copy = createEmptyChallengeWord({ word: item.word, definition: item.definition });
        idMap.set(item.id, copy.id);
        return copy;
      });
      const copy: DefinitionChallengeActivity = {
        ...source,
        id: createChallengeActivityId(),
        title: `${source.title?.trim() || source.topic?.trim() || 'Definition Challenge'} (copy)`,
        updatedAt: new Date().toISOString(),
        words,
        gridWordIds: (source.gridWordIds || []).map((item) => idMap.get(item) || item),
        callWordIds: (source.callWordIds || []).map((item) => idMap.get(item) || item),
      };
      const saveResponse = await fetch('/api/definition-challenge/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: copy }),
      });
      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) throw new Error(saveData.error || 'Failed to duplicate');
      setMessage('Challenge duplicated.');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title || 'Definition Challenge'}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/definition-challenge/activities/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Failed to delete');
      return;
    }
    setMessage('Challenge deleted.');
    await loadList();
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-16">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/vocab-bingo">
          <ComicButton variant="accent" size="sm">
            ← Vocabulary Bingo
          </ComicButton>
        </Link>
      </div>
      <ComicCard className="comic-shadow-xl space-y-4 text-center">
        <ComicTitle level={3} className="text-[var(--comic-primary)]">
          Definition Challenge
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Every student gets the same word grid. You read definitions. They cross out the matching words.
        </ComicText>
        <ComicButton type="button" variant="primary" size="md" disabled={creating} onClick={() => void handleCreate()}>
          {creating ? 'Creating…' : '+ New challenge'}
        </ComicButton>
        {message ? <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText> : null}
        {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      </ComicCard>
      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Your challenges
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No challenges yet. Click “New challenge” to start.
          </ComicText>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-4 border-[var(--comic-black)] bg-white p-4"
              >
                <div className="min-w-0 space-y-1">
                  <ComicText className="truncate font-black">{item.title}</ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.level}
                    {item.topic ? ` · ${item.topic}` : ''} · {item.word_count} words · {item.grid_count} on the grid ·{' '}
                    {item.game_length} definitions · {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher-resources/vocab-bingo/definition-challenge/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">
                      Edit
                    </ComicButton>
                  </Link>
                  <Link href={`/teacher-resources/vocab-bingo/definition-challenge/${item.id}/call`}>
                    <ComicButton variant="success" size="sm">
                      Teach
                    </ComicButton>
                  </Link>
                  <Link href={`/teacher-resources/vocab-bingo/definition-challenge/${item.id}/print`}>
                    <ComicButton variant="primary" size="sm">
                      Print
                    </ComicButton>
                  </Link>
                  <ComicButton type="button" variant="secondary" size="sm" onClick={() => void handleDuplicate(item.id)}>
                    Duplicate
                  </ComicButton>
                  <ComicButton type="button" variant="danger" size="sm" onClick={() => void handleDelete(item.id, item.title)}>
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

export default function DefinitionChallengePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--comic-light)]">
      <section className="comic-bg-success comic-pattern-dots px-4 py-16 text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          Definition Challenge
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white mx-auto max-w-3xl font-bold">
          One worksheet for the whole class. You read the clue. Students cross out the word.
        </ComicText>
      </section>
      <TeacherAuthGate>
        <DefinitionChallengeHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
