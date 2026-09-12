'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { SpeakClassOption } from '@/lib/speak-and-submit/types';
import { sortSpeakClassOptions } from '@/lib/speak-and-submit/types';

export default function CreateProjectForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [className, setClassName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [worksheetEnabled, setWorksheetEnabled] = useState(true);
  const [artworkEnabled, setArtworkEnabled] = useState(true);
  const [speakingEnabled, setSpeakingEnabled] = useState(true);
  const [classes, setClasses] = useState<SpeakClassOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/speak-and-submit/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const next = sortSpeakClassOptions((data.config?.classes || []) as SpeakClassOption[]);
        setClasses(next);
        if (next.length > 0) setClassName(next[0].label);
      })
      .catch(() => {
        // Class dropdown is optional if settings have not been configured yet.
      });
  }, []);

  async function handleCreate() {
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          class_name: className,
          due_date: dueDate || null,
          worksheet_enabled: worksheetEnabled,
          artwork_enabled: artworkEnabled,
          speaking_enabled: speakingEnabled,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }
      router.push(`/teacher-resources/projects/${data.project.id}`);
    } catch {
      setError('Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ComicCard className="comic-shadow-xl">
      <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
        + Create Project
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] mb-6">
        Combine a worksheet, artwork, and speaking into one classroom project.
      </ComicText>

      <div className="space-y-4">
        <input
          className="w-full comic-input"
          placeholder="Project title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="w-full comic-textarea min-h-28"
          placeholder="Short description / instructions"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="grid md:grid-cols-2 gap-4">
          {classes.length > 0 ? (
            <select
              className="w-full comic-input"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="w-full comic-input"
              placeholder="Class (e.g. M4/1)"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            />
          )}
          <input
            type="date"
            className="w-full comic-input"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="comic-border bg-white rounded-lg p-3 font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={worksheetEnabled}
              onChange={(event) => setWorksheetEnabled(event.target.checked)}
            />
            Worksheet
          </label>
          <label className="comic-border bg-white rounded-lg p-3 font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={artworkEnabled}
              onChange={(event) => setArtworkEnabled(event.target.checked)}
            />
            Artwork
          </label>
          <label className="comic-border bg-white rounded-lg p-3 font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={speakingEnabled}
              onChange={(event) => setSpeakingEnabled(event.target.checked)}
            />
            Speaking
          </label>
        </div>

        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        ) : null}

        <ComicButton variant="primary" onClick={handleCreate} disabled={saving}>
          {saving ? 'Creating…' : 'Create draft project'}
        </ComicButton>
      </div>
    </ComicCard>
  );
}
