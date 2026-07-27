'use client';

import StudentGradeLookup from '../../../components/gradebook/StudentGradeLookup';

interface SchoolGradesPageProps {
  params: { schoolSlug: string };
}

export default function SchoolGradesPage({ params }: SchoolGradesPageProps) {
  return (
    <div className="gradebook-page min-h-screen bg-[var(--comic-light)]">
      <StudentGradeLookup schoolSlug={params.schoolSlug} showHero />
    </div>
  );
}
