'use client';

import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import StudentAssessment from '../../../components/listen-and-learn/StudentAssessment';

interface StudentPageProps {
  params: { assignmentId: string };
}

export default function ListenLearnStudentPage({ params }: StudentPageProps) {
  return (
    <div className="listen-and-learn-student min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-10 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-text-white mb-2">
          🎧 Listen &amp; Learn
        </ComicTitle>
        <ComicText className="comic-text-white font-bold">
          Short listening practice — listen, then choose the best answer.
        </ComicText>
      </section>
      <section className="max-w-4xl mx-auto py-10 px-4">
        <StudentAssessment assignmentId={params.assignmentId} />
      </section>
    </div>
  );
}
