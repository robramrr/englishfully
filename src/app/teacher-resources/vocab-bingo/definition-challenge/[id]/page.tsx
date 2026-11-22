'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../../components/ComicButton';
import Footer from '../../../../../components/Footer';
import TeacherAuthGate from '../../../../../components/speak-and-submit/TeacherAuthGate';
import DefinitionChallengeEditor from '../../../../../components/definition-challenge/DefinitionChallengeEditor';

function EditorContent() {
  const params = useParams();
  const id = String(params?.id || '');
  return (
    <section className="mx-auto max-w-6xl space-y-8 px-4 py-16">
      <Link href="/teacher-resources/vocab-bingo/definition-challenge">
        <ComicButton variant="accent" size="sm">
          ← All challenges
        </ComicButton>
      </Link>
      {id ? <DefinitionChallengeEditor activityId={id} /> : null}
    </section>
  );
}

export default function DefinitionChallengeEditorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <EditorContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
