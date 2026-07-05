'use client';

import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { SpeakTask, TaskType } from '@/lib/speak-and-submit/types';

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  single_sentence: 'Single Sentence',
  sentence_set: 'Multiple Sentences',
  vocab_list: 'Vocabulary List',
  prompt: 'Open Prompt',
};

interface TaskListProps {
  tasks: SpeakTask[];
  onRefresh: () => void;
}

export default function TaskList({ tasks, onRefresh }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <ComicCard className="comic-shadow-xl text-center">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
          📭 No tasks yet
        </ComicTitle>
        <ComicText className="text-[var(--comic-dark)] font-bold">
          Create your first speaking homework task above.
        </ComicText>
      </ComicCard>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {tasks.map((task) => (
        <ComicCard key={task.id} className="comic-shadow-xl flex flex-col">
          <ComicTitle level={4} className="mb-2 text-[var(--comic-primary)]">
            {task.title}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-1">
            Class: {task.class_name}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4">
            {TASK_TYPE_LABELS[task.task_type]}
          </ComicText>
          <div className="mt-auto flex flex-col gap-3">
            <Link href={`/teacher-resources/speak-and-submit/${task.id}`}>
              <ComicButton variant="secondary" size="sm" className="w-full">
                View task & submissions
              </ComicButton>
            </Link>
            <Link href={`/teacher-resources/speak-and-submit/${task.id}/print`}>
              <ComicButton variant="warning" size="sm" className="w-full">
                Printable handout
              </ComicButton>
            </Link>
          </div>
        </ComicCard>
      ))}
      <div className="md:col-span-2 text-center">
        <ComicButton variant="accent" size="sm" onClick={onRefresh}>
          Refresh task list
        </ComicButton>
      </div>
    </div>
  );
}
