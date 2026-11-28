'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import SentenceContestShare from '../../../components/sentence-contest/SentenceContestShare';
import {
  createSentenceContestId,
  type SentenceContestActivity,
  type SentenceContestListItem,
} from '@/lib/sentence-contest/types';

function SentenceContestHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<SentenceContestListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/sentence-contest/activities', { cache: 'no-store' });
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
      const response = await fetch('/api/sentence-contest/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true, title: '' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create activity');
      router.push(`/teacher-resources/sentence-contest/${data.activity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError('');
    try {
      const loadResponse = await fetch(`/api/sentence-contest/activities/${id}`, {
        cache: 'no-store',
      });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) throw new Error(loadData.error || 'Failed to load activity');
      const source = loadData.activity as SentenceContestActivity;
      const copy: SentenceContestActivity = {
        ...source,
        id: createSentenceContestId(),
        title: `${source.title?.trim() || 'Sentence contest'} (copy)`,
        updatedAt: new Date().toISOString(),
      };
      const saveResponse = await fetch('/api/sentence-contest/activities', {
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
    if (!window.confirm(`Delete “${title || 'Sentence contest'}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/sentence-contest/activities/${id}`, { method: 'DELETE' });
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
          Sentence contest
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Set a prompt and how the AI should pick a winner. On the play screen, add sentences
          and award the best one. Target grammar is highlighted in yellow.
        </ComicText>
        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={creating}
          onClick={() => void handleCreate()}
        >
          {creating ? 'Creating…' : '+ New sentence contest'}
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
          Your sentence contests
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No sentence contests yet. Click “New sentence contest” to start.
          </ComicText>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="space-y-3 border-4 border-[var(--comic-black)] bg-white p-4"
              >
                <div className="space-y-1">
                  <ComicText className="font-black">
                    {item.title || 'Sentence contest'}
                  </ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.prompt ? `${item.prompt} · ` : ''}
                    {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/teacher-resources/sentence-contest/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">
                      Edit
                    </ComicButton>
                  </Link>
                  <Link href={`/sentence-contest/${item.id}`} target="_blank">
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
                  <SentenceContestShare activityId={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </ComicCard>
    </section>
  );
}

export default function SentenceContestPage() {
  return (
    <div className="sentence-contest-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-success py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faPen} aria-hidden className="h-[0.85em] w-[0.85em]" />
            Sentence contest
          </span>
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Interactive Games Pack — write sentences, highlight the target grammar, and award a winner
        </ComicText>
      </section>
      <TeacherAuthGate>
        <SentenceContestHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
