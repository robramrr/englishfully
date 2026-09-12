'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../../../components/ComicButton';
import ComicCard from '../../../components/ComicCard';
import ComicText from '../../../components/ComicText';
import ComicTitle from '../../../components/ComicTitle';
import Footer from '../../../components/Footer';
import TeacherAuthGate from '../../../components/speak-and-submit/TeacherAuthGate';
import CreateProjectForm from '../../../components/projects/CreateProjectForm';
import ProjectList from '../../../components/projects/ProjectList';
import type { ProjectListItem } from '@/lib/projects/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadProjects = useCallback(async () => {
    const response = await fetch('/api/projects', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    setProjects(data.projects || []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="projects-page flex flex-col min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-16 px-4 comic-pattern-dots text-center">
        <ComicTitle level={1} className="comic-title-no-shadow comic-text-white mb-4">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faFolderOpen} aria-hidden className="h-[0.85em] w-[0.85em]" />
            Projects
          </span>
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold max-w-3xl mx-auto">
          Combine a worksheet, artwork, and speaking into one student project.
        </ComicText>
      </section>

      <TeacherAuthGate>
        <section className="max-w-6xl mx-auto py-16 px-4 space-y-10">
          <div className="flex flex-wrap gap-3">
            <Link href="/teacher-resources">
              <ComicButton variant="accent" size="sm">
                ← Back to Teacher Resources
              </ComicButton>
            </Link>
          </div>

          <CreateProjectForm />

          {loaded ? (
            <ProjectList projects={projects} onRefresh={loadProjects} />
          ) : (
            <ComicCard className="comic-shadow-xl text-center">
              <ComicText className="text-[var(--comic-dark)] font-bold">Loading projects…</ComicText>
            </ComicCard>
          )}
        </section>
      </TeacherAuthGate>

      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
