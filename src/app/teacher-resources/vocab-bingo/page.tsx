'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCells } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import {
  createBingoActivityId,
  createEmptyBingoDistractor,
  createEmptyBingoWord,
  type VocabBingoActivity,
  type VocabBingoListItem,
} from '@/lib/vocab-bingo/types';

function VocabBingoHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<VocabBingoListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/vocab-bingo/activities', { cache: 'no-store' });
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
      const response = await fetch('/api/vocab-bingo/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true, title: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create activity');
      router.push(`/teacher-resources/vocab-bingo/${data.activity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError('');
    try {
      const loadResponse = await fetch(`/api/vocab-bingo/activities/${id}`, { cache: 'no-store' });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) throw new Error(loadData.error || 'Failed to load activity');
      const source = loadData.activity as VocabBingoActivity;
      const copy: VocabBingoActivity = {
        ...source,
        id: createBingoActivityId(),
        title: `${source.title?.trim() || source.topic?.trim() || 'Vocabulary Bingo'} (copy)`,
        updatedAt: new Date().toISOString(),
        words: (source.words || []).map((item) =>
          createEmptyBingoWord({ word: item.word, definition: item.definition })
        ),
        distractors: (source.distractors || []).map((item) =>
          createEmptyBingoDistractor({ word: item.word })
        ),
      };
      const saveResponse = await fetch('/api/vocab-bingo/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: copy }),
      });
      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) throw new Error(saveData.error || 'Failed to duplicate activity');
      setMessage('Activity duplicated.');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    } finally {
      setDuplicatingId('');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title || 'Vocabulary Bingo'}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/vocab-bingo/activities/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Failed to delete');
      return;
    }
    setMessage('Activity deleted.');
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
          Vocabulary Bingo
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Pick a topic and level. AI writes the words and the definitions you read aloud. Students
          get a bingo card and cross out the word they hear described.
        </ComicText>
        <ComicButton type="button" variant="primary" size="md" disabled={creating} onClick={() => void handleCreate()}>
          {creating ? 'Creating…' : '+ New bingo'}
        </ComicButton>
        <Link href="/teacher-resources/vocab-bingo/definition-challenge">
          <ComicButton variant="secondary" size="md">
            Definition Challenge
          </ComicButton>
        </Link>
        {message ? <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText> : null}
        {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl space-y-4">
        <ComicTitle level={3} className="text-[var(--comic-secondary)]">
          Your bingo activities
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No bingo activities yet. Click “New bingo” to start.
          </ComicText>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-4 border-[var(--comic-black)] bg-white p-4"
              >
                <div className="min-w-0 space-y-1">
                  <ComicText className="font-black truncate">{item.title}</ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.level}
                    {item.topic ? ` · ${item.topic}` : ''} · {item.word_count} words · {item.grid_size}×
                    {item.grid_size} · {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher-resources/vocab-bingo/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">Edit</ComicButton>
                  </Link>
                  <Link href={`/teacher-resources/vocab-bingo/${item.id}/call`}>
                    <ComicButton variant="success" size="sm">Call</ComicButton>
                  </Link>
                  <Link href={`/teacher-resources/vocab-bingo/${item.id}/grids`}>
                    <ComicButton variant="primary" size="sm">Print grids</ComicButton>
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

export default function VocabBingoPage() {
  return (
    <div className="vocab-bingo-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-success py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faTableCells} aria-hidden className="h-[0.85em] w-[0.85em]" />
            Vocabulary Bingo
          </span>
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          A listening game. You read the clue. Students find the word and cross it out.
        </ComicText>
      </section>
      <TeacherAuthGate>
        <VocabBingoHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
