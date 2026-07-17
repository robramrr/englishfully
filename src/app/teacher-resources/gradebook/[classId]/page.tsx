'use client';

import { Suspense } from 'react';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import ClassGradebook from '../../../../components/gradebook/ClassGradebook';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';

interface ClassPageProps {
  params: { classId: string };
}

export default function GradebookClassPage({ params }: ClassPageProps) {
  return (
    <div className="gradebook-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-12 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-text-white mb-2">
          📊 Class Gradebook
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Enter scores one student at a time. Online Speak submissions are marked for reference.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-12 px-4 w-full">
          <Suspense
            fallback={
              <ComicText className="font-bold text-center">Loading class gradebook…</ComicText>
            }
          >
            <ClassGradebook classId={params.classId} />
          </Suspense>
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
