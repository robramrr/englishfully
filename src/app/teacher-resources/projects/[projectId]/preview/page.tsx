'use client';

import Link from 'next/link';
import ComicButton from '../../../../../components/ComicButton';
import StudentProjectFlow from '../../../../../components/projects/StudentProjectFlow';

interface PreviewPageProps {
  params: { projectId: string };
}

export default function ProjectPreviewPage({ params }: PreviewPageProps) {
  return (
    <div className="projects-preview-page min-h-screen bg-[var(--comic-light)]">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link href={`/teacher-resources/projects/${params.projectId}`}>
          <ComicButton variant="accent" size="sm">
            ← Back to editor
          </ComicButton>
        </Link>
      </div>
      <StudentProjectFlow projectId={params.projectId} preview />
    </div>
  );
}
