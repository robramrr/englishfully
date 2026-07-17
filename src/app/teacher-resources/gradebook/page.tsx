'use client';

import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import GradebookHome from '../../../components/gradebook/GradebookHome';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';

export default function GradebookPage() {
  return (
    <div className="gradebook-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-primary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-text-white mb-4">
          📊 Gradebook
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Track Speak &amp; Submit and Listen &amp; Answer grades by class and semester.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-12 px-4 w-full">
          <GradebookHome />
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
