'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import SentenceContestEditor from '../../../../components/sentence-contest/SentenceContestEditor';

function SentenceContestEditorPageContent() {
  const params = useParams();
  const id = String(params?.id || '');

  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources/sentence-contest">
          <ComicButton variant="accent" size="sm">
            ← All sentence contests
          </ComicButton>
        </Link>
      </div>
      {id ? <SentenceContestEditor activityId={id} /> : null}
    </section>
  );
}

export default function SentenceContestEditorPage() {
  return (
    <div className="sentence-contest-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <SentenceContestEditorPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
