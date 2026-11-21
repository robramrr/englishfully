'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ComicText from '../ComicText';
import type { AnagramActivityListItem } from '@/lib/anagram/types';

let cachedActivities: AnagramActivityListItem[] | null = null;
let loadingActivities: Promise<AnagramActivityListItem[]> | null = null;

function loadActivities(force = false): Promise<AnagramActivityListItem[]> {
  if (!force && cachedActivities) return Promise.resolve(cachedActivities);
  if (!force && loadingActivities) return loadingActivities;
  loadingActivities = fetch('/api/anagram/activities', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      cachedActivities = (data.activities || []) as AnagramActivityListItem[];
      return cachedActivities;
    })
    .catch(() => [])
    .finally(() => {
      loadingActivities = null;
    });
  return loadingActivities;
}

export default function AnagramActivityLinkSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (activityId: string) => void;
}) {
  const [activities, setActivities] = useState<AnagramActivityListItem[]>(
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
        <ComicText className="text-sm font-bold">Anagram</ComicText>
        <select
          className="comic-input w-full font-bold"
          value={value}
          onFocus={() => {
            void loadActivities(true).then(setActivities);
          }}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">No anagram</option>
          {value && !known ? <option value={value}>Linked activity</option> : null}
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.title || activity.topic || 'Untitled activity'} ({activity.word_count}{' '}
              {activity.word_count === 1 ? 'word' : 'words'})
            </option>
          ))}
        </select>
      </label>
      <ComicText className="text-xs font-bold text-[var(--comic-dark)]">
        {value
          ? 'A Play button fills the text side of this slide. Choose No anagram to remove it.'
          : 'Nothing is added until you choose an activity here.'}{' '}
        <Link href="/teacher-resources/anagram" className="text-[var(--comic-secondary)] underline">
          {activities.length ? 'Manage activities' : 'Create an activity'}
        </Link>
      </ComicText>
    </div>
  );
}
