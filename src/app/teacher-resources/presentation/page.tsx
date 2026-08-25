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
import type { PresentationDeck, PresentationListItem } from '@/lib/presentation/types';
import { createDeckId, createSlideId } from '@/lib/presentation/types';
import {
  clearLegacyPresentationDraft,
  loadLegacyPresentationDraft,
} from '@/lib/presentation/storage';
import { getPresentationUrl } from '@/lib/presentation/qr';

function PresentationHomeContent() {
  const router = useRouter();
  const [items, setItems] = useState<PresentationListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadList = useCallback(async () => {
    const response = await fetch('/api/presentation/decks', { cache: 'no-store' });
    if (!response.ok) {
      setItems([]);
      setLoaded(true);
      return;
    }
    const data = await response.json();
    setItems(data.presentations || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // One-time: import old single local draft into the library
  useEffect(() => {
    const legacy = loadLegacyPresentationDraft();
    if (!legacy || !legacy.slides.length) return;
    void (async () => {
      try {
        const response = await fetch('/api/presentation/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deck: { ...legacy, status: legacy.status || 'draft' },
          }),
        });
        if (response.ok) {
          clearLegacyPresentationDraft();
          setMessage('Imported your previous presentation draft into the list.');
          await loadList();
        }
      } catch {
        // ignore
      }
    })();
  }, [loadList]);

  async function handleCreate() {
    setCreating(true);
    setError('');
    try {
      const response = await fetch('/api/presentation/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: true, title: 'Untitled presentation' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create presentation');
      router.push(`/teacher-resources/presentation/${data.presentation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create presentation');
      setCreating(false);
    }
  }

  async function handleDuplicate(id: string) {
    setDuplicatingId(id);
    setError('');
    try {
      const loadResponse = await fetch(`/api/presentation/decks/${id}`, {
        cache: 'no-store',
      });
      const loadData = await loadResponse.json().catch(() => ({}));
      if (!loadResponse.ok) {
        throw new Error(loadData.error || 'Failed to load presentation');
      }
      const source = loadData.presentation as PresentationDeck;
      const copy: PresentationDeck = {
        ...source,
        id: createDeckId(),
        title: `${source.title?.trim() || 'Untitled presentation'} (copy)`,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        slides: (source.slides || []).map((slide) => ({
          ...slide,
          id: createSlideId(),
          bullets: [...(slide.bullets || [])],
          choiceImages: [...(slide.choiceImages || [])],
          tableHeaders: [...(slide.tableHeaders || [])],
          tableRows: (slide.tableRows || []).map((row) => [...row]),
          audioTracks: (slide.audioTracks || []).map((track) => ({ ...track })),
          describeWords: (slide.describeWords || []).map((word) => ({ ...word })),
          matchPairs: (slide.matchPairs || []).map((pair) => ({ ...pair })),
        })),
      };
      const saveResponse = await fetch('/api/presentation/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck: copy }),
      });
      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to duplicate presentation');
      }
      setMessage('Presentation duplicated.');
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    } finally {
      setDuplicatingId('');
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title || 'Untitled'}”? This cannot be undone.`)) {
      return;
    }
    const response = await fetch(`/api/presentation/decks/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Failed to delete');
      return;
    }
    setMessage('Presentation deleted.');
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
          Presentations
        </ComicTitle>
        <ComicText className="font-bold text-[var(--comic-dark)]">
          Create classroom slide decks, publish for a share link + QR, and download PDF or
          PowerPoint.
        </ComicText>
        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={creating}
          onClick={() => void handleCreate()}
        >
          {creating ? 'Creating…' : '+ New presentation'}
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
          Your presentations
        </ComicTitle>
        {!loaded ? (
          <ComicText className="font-bold">Loading…</ComicText>
        ) : items.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No presentations yet. Click “New presentation” to start.
          </ComicText>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-4 border-[var(--comic-black)] bg-white p-4 comic-shadow-sm"
              >
                <div className="min-w-0 space-y-1">
                  <ComicText className="font-black truncate">
                    {item.title || 'Untitled presentation'}
                  </ComicText>
                  <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
                    {item.status === 'published' ? 'Published' : 'Draft'} · {item.slide_count}{' '}
                    slides · {new Date(item.updated_at).toLocaleString()}
                  </ComicText>
                  {item.status === 'published' ? (
                    <a
                      href={getPresentationUrl(item.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold underline break-all text-[var(--comic-secondary)]"
                    >
                      {getPresentationUrl(item.id)}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher-resources/presentation/${item.id}`}>
                    <ComicButton variant="secondary" size="sm">
                      Edit
                    </ComicButton>
                  </Link>
                  {item.status === 'published' ? (
                    <Link href={`/presentation/${item.id}`} target="_blank">
                      <ComicButton variant="primary" size="sm">
                        Open link
                      </ComicButton>
                    </Link>
                  ) : null}
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

export default function PresentationPage() {
  return (
    <div className="presentation-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <PresentationHomeContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
