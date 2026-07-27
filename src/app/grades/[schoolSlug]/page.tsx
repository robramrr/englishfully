'use client';

import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import StudentGradeLookup from '../../../components/gradebook/StudentGradeLookup';

interface SchoolGradesPageProps {
  params: { schoolSlug: string };
}

export default function SchoolGradesPage({ params }: SchoolGradesPageProps) {
  return (
    <div className="gradebook-page min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-10 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-text-white mb-2">
          📊 Check My Grades
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Look up your current gradebook total with your student number and roll number.
        </ComicText>
      </section>
      <section className="max-w-3xl mx-auto py-10 px-4">
        <StudentGradeLookup schoolSlug={params.schoolSlug} />
      </section>
    </div>
  );
}
