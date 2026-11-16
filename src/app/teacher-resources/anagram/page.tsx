'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFont } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import {
  createAnagramActivityId,
  createEmptyAnagramWord,
  type AnagramActivity,
  type AnagramActivityListItem,
} from '@/lib/anagram/types';

function AnagramHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<AnagramActivityListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/anagram/activities', { cache: 'no-store' });
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
      const response = await fetch('/api/anagram/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true, title: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create activity');
      router.push(`/teacher-resources/anagram/${data.activity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError('');
    try {
      const loadResponse = await fetch(`/api/anagram/activities/${id}`, { cache: 'no-store' });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) throw new Error(loadData.error || 'Failed to load activity');
      const source = loadData.activity as AnagramActivity;
      const copy: AnagramActivity = {
        ...source,
        id: createAnagramActivityId(),
        title: `${source.title?.trim() || source.topic?.trim() || 'Untitled anagram'} (copy)`,
        updatedAt: new Date().toISOString(),
        words: (source.words || []).map((item) =>
          createEmptyAnagramWord({
            word: item.word,
            clue: item.clue,
            audioMode: item.audioMode,
            audioUrl: item.audioUrl,
            imageUrl: item.imageUrl,
          })
        ),
      };
      const saveResponse = await fetch('/api/anagram/activities', {
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
    if (!window.confirm(`Delete “${title || 'Untitled anagram'}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/anagram/activities/${id}`, { method: 'DELETE' });
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
          Anagram activity
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Build a word list by hand or with AI. Add a clue, spoken audio, and a picture for each
          word, then let students unscramble the letters.
        </ComicText>
        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={creating}
          onClick={() => void handleCreate()}
        >
          {creating ? 'Creating…' : '+ New anagram'}
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
          Your anagrams
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No anagrams yet. Click “New anagram” to start.
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
                    {item.title || 'Untitled anagram'}
                  </ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.level}
                    {item.topic ? ` · ${item.topic}` : ''} · {item.word_count} words
                    {item.timer_enabled ? ` · ${item.seconds_per_word}s each` : ''} ·{' '}
                    {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher-resources/anagram/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">
                      Edit
                    </ComicButton>
                  </Link>
                  <Link href={`/anagram/${item.id}`} target="_blank">
                    <ComicButton variant="primary" size="sm">
                      Play
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

export default function AnagramPage() {
  return (
    <div className="anagram-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-success py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faFont} aria-hidden className="h-[0.85em] w-[0.85em]" />
            Anagram
          </span>
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Interactive Games Pack — unscramble letters with optional clues, pictures, and a timer
        </ComicText>
      </section>
      <TeacherAuthGate>
        <AnagramHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
