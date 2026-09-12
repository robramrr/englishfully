'use client';

import StudentProjectFlow from '@/components/projects/StudentProjectFlow';

interface StudentProjectPageProps {
  params: { projectId: string };
}

export default function StudentProjectPage({ params }: StudentProjectPageProps) {
  return <StudentProjectFlow projectId={params.projectId} />;
}
