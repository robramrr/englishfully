'use client';

import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';

export default function PitchDeckAccess() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate
        description="Enter your teacher password to view the pitch deck."
        refreshOnSuccess
      >
        {null}
      </TeacherAuthGate>
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
