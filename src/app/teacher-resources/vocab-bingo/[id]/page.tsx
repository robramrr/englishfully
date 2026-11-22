'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import VocabBingoEditor from '../../../../components/vocab-bingo/VocabBingoEditor';

function VocabBingoEditorPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/vocab-bingo">
          <ComicButton variant="accent" size="sm">
            ← All bingo activities
          </ComicButton>
        </Link>
      </div>
      {id ? <VocabBingoEditor activityId={id} /> : null}
    </section>
  );
}

export default function VocabBingoEditorPage() {
  return (
    <div className="vocab-bingo-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <VocabBingoEditorPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
