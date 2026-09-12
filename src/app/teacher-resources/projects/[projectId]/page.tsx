'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ComicButton from '../../../../components/ComicButton';
import ComicCard from '../../../../components/ComicCard';
import ComicText from '../../../../components/ComicText';
import ComicTitle from '../../../../components/ComicTitle';
import Footer from '../../../../components/Footer';
import TeacherAuthGate from '../../../../components/speak-and-submit/TeacherAuthGate';
import ProjectEditor from '../../../../components/projects/ProjectEditor';
import ProjectSubmissionsTable from '../../../../components/projects/ProjectSubmissionsTable';
import { formatProjectHeaderMeta, type ProjectWithComponents } from '@/lib/projects/types';

interface ProjectDetailPageProps {
  params: { projectId: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${params.projectId}`, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!data.project) {
          setError(data.error || 'Project not found');
          return;
        }
        setProject(data.project);
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false));
  }, [params.projectId]);

  async function handleDelete() {
    if (!window.confirm('Delete this project and all student submissions? This cannot be undone.')) {
      return;
    }
    const response = await fetch(`/api/projects/${params.projectId}`, { method: 'DELETE' });
    if (response.ok) {
      router.push('/teacher-resources/projects');
      return;
    }
    setError('Failed to delete project.');
  }

  return (
    <div className="projects-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-16 px-4 space-y-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher-resources/projects">
              <ComicButton variant="accent" size="sm">
                ← All projects
              </ComicButton>
            </Link>
            <ComicButton variant="danger" size="sm" onClick={() => void handleDelete()}>
              Delete project
            </ComicButton>
          </div>

          {loading ? (
            <ComicText className="text-[var(--comic-dark)] font-bold">Loading project…</ComicText>
          ) : error ? (
            <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
          ) : project ? (
            <>
              <ComicCard className="comic-shadow-xl">
                <ComicTitle level={2} className="mb-2 text-[var(--comic-primary)]">
                  {project.title}
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)] font-bold">
                  {formatProjectHeaderMeta(project) || 'Add a short class label'}
                </ComicText>
                {project.description ? (
                  <ComicText className="text-[var(--comic-dark)] mt-3">{project.description}</ComicText>
                ) : null}
              </ComicCard>

              <ProjectEditor project={project} onProjectChange={setProject} />
              <ProjectSubmissionsTable project={project} />
            </>
          ) : null}
        </section>
      </TeacherAuthGate>
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
