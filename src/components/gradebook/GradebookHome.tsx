'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type {
  GradebookClassSummary,
  GradebookSemester,
  GradebookSettings,
} from '@/lib/gradebook/types';
import { formatPercent } from '@/lib/gradebook/types';

export default function GradebookHome() {
  const [settings, setSettings] = useState<GradebookSettings | null>(null);
  const [classes, setClasses] = useState<GradebookClassSummary[]>([]);
  const [semester, setSemester] = useState<GradebookSemester>(1);
  const [schoolYear, setSchoolYear] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async (nextSemester?: GradebookSemester, nextYear?: string) => {
    const params = new URLSearchParams();
    if (nextSemester) params.set('semester', String(nextSemester));
    if (nextYear) params.set('school_year', nextYear);
    const response = await fetch(`/api/gradebook/overview?${params.toString()}`);
    if (!response.ok) {
      setError('Failed to load gradebook.');
      setLoaded(true);
      return;
    }
    const data = await response.json();
    setSettings(data.settings);
    setClasses(data.classes || []);
    setSemester(data.settings.active_semester);
    setSchoolYear(data.settings.school_year);
    setError('');
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleSaveSettings() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/gradebook/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_year: schoolYear,
          active_semester: semester,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');
      await loadOverview(data.settings.active_semester, data.settings.school_year);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSemesterChange(next: GradebookSemester) {
    setSemester(next);
    setLoaded(false);
    await loadOverview(next, schoolYear);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Link href="/teacher-resources">
          <ComicButton variant="accent" size="sm">
            ← Back to Teacher Resources
          </ComicButton>
        </Link>
        <Link href="/teacher-resources/speak-and-submit">
          <ComicButton variant="secondary" size="sm">
            Speak &amp; Submit classes
          </ComicButton>
        </Link>
      </div>

      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
          Semester Settings
        </ComicTitle>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <ComicText className="font-bold mb-1 text-sm">School Year</ComicText>
            <input
              className="w-full comic-input"
              value={schoolYear}
              onChange={(event) => setSchoolYear(event.target.value)}
              placeholder="2025-2026"
            />
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Semester</ComicText>
            <div className="flex gap-2">
              <ComicButton
                type="button"
                variant={semester === 1 ? 'primary' : 'accent'}
                size="sm"
                onClick={() => void handleSemesterChange(1)}
              >
                Semester 1
              </ComicButton>
              <ComicButton
                type="button"
                variant={semester === 2 ? 'primary' : 'accent'}
                size="sm"
                onClick={() => void handleSemesterChange(2)}
              >
                Semester 2
              </ComicButton>
            </div>
          </div>
          <div>
            <ComicButton
              type="button"
              variant="success"
              size="md"
              disabled={saving}
              onClick={() => void handleSaveSettings()}
            >
              {saving ? 'Saving…' : 'Save Semester Settings'}
            </ComicButton>
          </div>
        </div>
        {settings ? (
          <ComicText className="text-sm mt-4 text-[var(--comic-dark)]">
            Viewing {settings.school_year} · Semester {settings.active_semester}
          </ComicText>
        ) : null}
        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold mt-4">{error}</ComicText>
        ) : null}
      </ComicCard>

      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-2 text-[var(--comic-secondary)]">
          Classes
        </ComicTitle>
        <ComicText className="mb-6 text-[var(--comic-dark)]">
          Classes come from your Speak &amp; Submit settings. Open a class to enter grades for Speak
          &amp; Submit or Listen &amp; Answer tasks.
        </ComicText>

        {!loaded ? (
          <ComicText className="font-bold">Loading classes…</ComicText>
        ) : classes.length === 0 ? (
          <div className="space-y-4">
            <ComicText className="font-bold text-[var(--comic-dark)]">
              No classes found. Add classes in Speak &amp; Submit settings first.
            </ComicText>
            <Link href="/teacher-resources/speak-and-submit">
              <ComicButton variant="secondary" size="sm">
                Open Speak &amp; Submit Settings
              </ComicButton>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {classes.map((classItem) => (
              <ComicCard key={classItem.id} className="comic-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <ComicTitle level={4} className="!mb-1 text-[var(--comic-primary)]">
                      {classItem.label}
                    </ComicTitle>
                    <ComicText className="text-sm">
                      {classItem.graded_seat_count}/{classItem.seat_count} students graded ·{' '}
                      {classItem.entry_count} grade entries
                    </ComicText>
                    <ComicText className="text-sm mt-1">
                      Running total:{' '}
                      {formatPercent(
                        classItem.total_points_earned,
                        classItem.total_points_possible
                      )}
                    </ComicText>
                  </div>
                  <Link
                    href={`/teacher-resources/gradebook/${classItem.id}?semester=${semester}&school_year=${encodeURIComponent(schoolYear)}`}
                  >
                    <ComicButton variant="primary" size="sm">
                      Open
                    </ComicButton>
                  </Link>
                </div>
              </ComicCard>
            ))}
          </div>
        )}
      </ComicCard>
    </div>
  );
}
