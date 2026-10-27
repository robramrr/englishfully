'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import VocabDeckEditor from '../../../../components/vocabulary/VocabDeckEditor';

function VocabularyEditorPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/vocabulary">
          <ComicButton variant="accent" size="sm">
            ← All decks
          </ComicButton>
        </Link>
        <Link href="/teacher-resources/presentation">
          <ComicButton variant="secondary" size="sm">
            Presentations
          </ComicButton>
        </Link>
      </div>
      {id ? <VocabDeckEditor deckId={id} /> : null}
    </section>
  );
}

export default function VocabularyEditorPage() {
  return (
    <div className="vocabulary-page presentation-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <VocabularyEditorPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
