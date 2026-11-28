'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ComicText from '../ComicText';
import EditorInfo from './EditorInfo';
import type { SentenceContestListItem } from '@/lib/sentence-contest/types';

let cachedActivities: SentenceContestListItem[] | null = null;
let loadingActivities: Promise<SentenceContestListItem[]> | null = null;

function loadActivities(force = false): Promise<SentenceContestListItem[]> {
  if (!force && cachedActivities) return Promise.resolve(cachedActivities);
  if (!force && loadingActivities) return loadingActivities;
  loadingActivities = fetch('/api/sentence-contest/activities', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      cachedActivities = (data.activities || []) as SentenceContestListItem[];
      return cachedActivities;
    })
    .catch(() => [])
    .finally(() => {
      loadingActivities = null;
    });
  return loadingActivities;
}

export default function SentenceContestLinkSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (activityId: string) => void;
}) {
  const [activities, setActivities] = useState<SentenceContestListItem[]>(
    cachedActivities || []
  );
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current && cachedActivities) return;
    loaded.current = true;
    void loadActivities().then(setActivities);
  }, []);

  const known = activities.some((activity) => activity.id === value);

  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <span className="inline-flex items-center gap-2">
          <ComicText className="text-sm font-bold">Sentence contest</ComicText>
          <EditorInfo text="A Play button appears on the slide." />
        </span>
        <select
          className="comic-input w-full font-bold"
          value={value}
          onFocus={() => {
            void loadActivities(true).then(setActivities);
          }}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">No sentence contest</option>
          {value && !known ? <option value={value}>Linked activity</option> : null}
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.title || 'Sentence contest'}
            </option>
          ))}
        </select>
      </label>
      <Link
        href="/teacher-resources/sentence-contest"
        className="text-xs font-bold text-[var(--comic-secondary)] underline"
      >
        {activities.length ? 'Manage activities' : 'Create an activity'}
      </Link>
    </div>
  );
}
