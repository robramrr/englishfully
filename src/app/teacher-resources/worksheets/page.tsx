'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePen } from '@fortawesome/free-solid-svg-icons';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import WorksheetBuilder from '../../../components/worksheets/WorksheetBuilder';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';

export default function WorksheetsPage() {
  return (
    <div className="worksheet-print-root flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <section className="comic-bg-secondary py-14 px-4 text-center print:hidden">
          <ComicTitle level={1} className="comic-text-white mb-3">
            <span className="inline-flex items-center justify-center gap-3">
              <FontAwesomeIcon icon={faFilePen} aria-hidden className="h-[0.85em] w-[0.85em]" />
              Worksheet Generator
            </span>
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
            Paste a topic or a transcript, tick the exercises you want, and print from the same
            worksheet template.
          </ComicText>
        </section>
        <WorksheetBuilder />
      </TeacherAuthGate>
      <div className="flex-grow print:hidden" />
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
