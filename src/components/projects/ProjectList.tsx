'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import {
  PROJECT_STATUS_LABELS,
  formatProjectDueDate,
  type ProjectListItem,
} from '@/lib/projects/types';

interface ProjectListProps {
  projects: ProjectListItem[];
  onRefresh: () => void;
}

export default function ProjectList({ projects, onRefresh }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
          <span className="inline-flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faFolderOpen} aria-hidden className="h-[0.85em] w-[0.85em]" />
            No projects yet
          </span>
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Create your first classroom project above.
        </ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="space-y-6">
      <ComicTitle level={3} className="text-[var(--comic-secondary)]">
        Projects
      </ComicTitle>
      <div className="grid md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const due = formatProjectDueDate(project.due_date);
          const total = project.student_count || project.completed_count + project.in_progress_count;
          return (
            <ComicCard key={project.id} className="comic-shadow-xl flex flex-col">
              <ComicTitle level={4} className="mb-2 text-[var(--comic-primary)]">
                {project.title}
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-1">
                {project.class_name || 'No class'}
                {due ? ` · Due ${due}` : ''}
              </ComicText>
              <ComicText className="text-[var(--comic-dark)] mb-2">
                {project.completed_count}/{total || 0} submitted
                {project.in_progress_count > 0 ? ` · ${project.in_progress_count} in progress` : ''}
              </ComicText>
              <ComicText className="text-sm text-[var(--comic-secondary)] font-bold mb-4">
                {PROJECT_STATUS_LABELS[project.status]}
              </ComicText>
              <div className="mt-auto">
                <Link href={`/teacher-resources/projects/${project.id}`}>
                  <ComicButton variant="secondary" size="sm" className="w-full">
                    Open Project
                  </ComicButton>
                </Link>
              </div>
            </ComicCard>
          );
        })}
      </div>
      <div className="text-center">
        <ComicButton variant="accent" size="sm" onClick={onRefresh}>
          Refresh project list
        </ComicButton>
      </div>
    </div>
  );
}
