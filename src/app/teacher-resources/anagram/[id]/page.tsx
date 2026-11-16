'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import AnagramEditor from '../../../../components/anagram/AnagramEditor';

function AnagramEditorPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/anagram">
          <ComicButton variant="accent" size="sm">
            ← All anagrams
          </ComicButton>
        </Link>
      </div>
      {id ? <AnagramEditor activityId={id} /> : null}
    </section>
  );
}

export default function AnagramEditorPage() {
  return (
    <div className="anagram-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <AnagramEditorPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
