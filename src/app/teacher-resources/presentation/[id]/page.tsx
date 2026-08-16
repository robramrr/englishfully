'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import Footer from '../../../../components/Footer';
import PresentationEditor from '../../../../components/presentation/PresentationEditor';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';

function PresentationEditorPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/presentation">
          <ComicButton variant="accent" size="sm">
            ← All presentations
          </ComicButton>
        </Link>
        <Link href="/teacher-resources">
          <ComicButton variant="secondary" size="sm">
            Teacher Resources
          </ComicButton>
        </Link>
      </div>
      {id ? <PresentationEditor presentationId={id} /> : null}
    </section>
  );
}

export default function PresentationEditorPage() {
  return (
    <div className="presentation-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <PresentationEditorPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
