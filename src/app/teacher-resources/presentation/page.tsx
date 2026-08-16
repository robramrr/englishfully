'use client';

import Link from 'next/link';
import ComicButton from '../../../components/ComicButton';
import Footer from '../../../components/Footer';
import PresentationEditor from '../../../components/presentation/PresentationEditor';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';

function PresentationPageContent() {
  return (
    <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources">
          <ComicButton variant="accent" size="sm">
            ← Back to Teacher Resources
          </ComicButton>
        </Link>
      </div>
      <PresentationEditor />
    </section>
  );
}

export default function PresentationPage() {
  return (
    <div className="presentation-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <PresentationPageContent />
      </TeacherAuthGate>
      <Footer />
    </div>
  );
}
