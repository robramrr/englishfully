'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../../components/ComicButton';
import Footer from '../../../../../components/Footer';
import TeacherAuthGate from '../../../../../components/speak-and-submit/TeacherAuthGate';
import VocabBingoCaller from '../../../../../components/vocab-bingo/VocabBingoCaller';

function VocabBingoCallPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-3">
        <Link href={`/teacher-resources/vocab-bingo/${id}`}>
          <ComicButton variant="accent" size="sm">
            ← Edit activity
          </ComicButton>
        </Link>
        <Link href={`/teacher-resources/vocab-bingo/${id}/grids`}>
          <ComicButton variant="secondary" size="sm">
            Student grids
          </ComicButton>
        </Link>
      </div>
      {id ? <VocabBingoCaller activityId={id} /> : null}
    </section>
  );
}

export default function VocabBingoCallPage() {
  return (
    <div className="vocab-bingo-page flex min-h-screen flex-col bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <VocabBingoCallPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
