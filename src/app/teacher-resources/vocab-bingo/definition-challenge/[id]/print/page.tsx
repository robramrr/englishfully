'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../../../components/ComicButton';
import ComicText from '../../../../../../components/ComicText';
import Footer from '../../../../../../components/Footer';
import TeacherAuthGate from '../../../../../../components/speak-and-submit/TeacherAuthGate';
import DefinitionChallengeSheets from '../../../../../../components/definition-challenge/DefinitionChallengeSheets';
import {
  normalizeChallengeActivity,
  type DefinitionChallengeActivity,
} from '@/lib/definition-challenge/types';

function PrintContent() {
  const params = useParams();
  const id = String(params?.id || '');
  const [activity, setActivity] = useState<DefinitionChallengeActivity | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void fetch(`/api/definition-challenge/activities/${id}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Failed to load the challenge');
        return normalizeChallengeActivity(data.activity);
      })
      .then((loaded) => {
        if (!cancelled) setActivity(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load the challenge');
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="print:hidden">
        <Link href={`/teacher-resources/vocab-bingo/definition-challenge/${id}`}>
          <ComicButton variant="accent" size="sm">
            ← Edit challenge
          </ComicButton>
        </Link>
      </div>
      {error ? <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText> : null}
      {!activity && !error ? <ComicText className="font-bold">Loading the worksheet…</ComicText> : null}
      {activity ? <DefinitionChallengeSheets activity={activity} /> : null}
    </section>
  );
}

export default function DefinitionChallengePrintPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <PrintContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
