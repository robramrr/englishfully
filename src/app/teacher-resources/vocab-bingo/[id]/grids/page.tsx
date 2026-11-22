'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../../components/ComicButton';
import ComicText from '../../../../../components/ComicText';
import Footer from '../../../../../components/Footer';
import TeacherAuthGate from '../../../../../components/speak-and-submit/TeacherAuthGate';
import VocabBingoGrids from '../../../../../components/vocab-bingo/VocabBingoGrids';
import { normalizeBingoActivity, type VocabBingoActivity } from '@/lib/vocab-bingo/types';

function VocabBingoGridsPageContent() {
  const params = useParams();
  const id = String(params?.id || '');
  const [activity, setActivity] = useState<VocabBingoActivity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void fetch(`/api/vocab-bingo/activities/${id}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load activity');
        return normalizeBingoActivity(data.activity);
      })
      .then((loaded) => {
        if (!cancelled) setActivity(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load activity');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="bingo-print-toolbar flex flex-wrap gap-3">
        <Link href={`/teacher-resources/vocab-bingo/${id}`}>
          <ComicButton variant="accent" size="sm">
            ← Edit activity
          </ComicButton>
        </Link>
      </div>
      {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      {!activity && !error ? <ComicText className="font-bold">Loading…</ComicText> : null}
      {activity ? <VocabBingoGrids activity={activity} /> : null}
    </section>
  );
}

export default function VocabBingoGridsPage() {
  return (
    <div className="vocab-bingo-page flex min-h-screen flex-col bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <VocabBingoGridsPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
