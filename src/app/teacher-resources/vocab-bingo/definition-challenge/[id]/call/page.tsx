'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../../../components/ComicButton';
import Footer from '../../../../../../components/Footer';
import TeacherAuthGate from '../../../../../../components/speak-and-submit/TeacherAuthGate';
import DefinitionChallengeCaller from '../../../../../../components/definition-challenge/DefinitionChallengeCaller';

function CallerContent() {
  const params = useParams();
  const id = String(params?.id || '');
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-3 print:hidden">
        <Link href={`/teacher-resources/vocab-bingo/definition-challenge/${id}`}>
          <ComicButton variant="accent" size="sm">
            ← Edit challenge
          </ComicButton>
        </Link>
      </div>
      {id ? <DefinitionChallengeCaller activityId={id} /> : null}
    </section>
  );
}

export default function DefinitionChallengeCallPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <CallerContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
