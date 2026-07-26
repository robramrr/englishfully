'use client';

import { Suspense } from 'react';
import ComicText from '../../../../../components/ComicText';
import PrintGradebook from '../../../../../components/gradebook/PrintGradebook';
import TeacherAuthGate from '../../../../../components/speak-and-submit/TeacherAuthGate';

interface PrintPageProps {
  params: { classId: string };
}

export default function GradebookPrintPage({ params }: PrintPageProps) {
  return (
    <div className="gradebook-page min-h-screen bg-white">
      <TeacherAuthGate>
        <Suspense
          fallback={
            <div className="p-8 text-center">
              <ComicText className="font-bold">Loading printable gradebook…</ComicText>
            </div>
          }
        >
          <PrintGradebook classId={params.classId} />
        </Suspense>
      </TeacherAuthGate>
    </div>
  );
}
