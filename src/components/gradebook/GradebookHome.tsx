'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { formatPercent, normalizeGradesSlug } from '@/lib/gradebook/types';

export default function GradebookHome() {
  const [settings, setSettings] = useState<GradebookSettings | null>(null);
  const [classes, setClasses] = useState<GradebookClassSummary[]>([]);
  const [semester, setSemester] = useState<GradebookSemester>(1);
  const [schoolYear, setSchoolYear] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gradesSlug, setGradesSlug] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const studentGradesPath = useMemo(() => {
    const slug = normalizeGradesSlug(gradesSlug || settings?.grades_slug || '');
    return slug ? `/grades/${slug}` : '';
  }, [gradesSlug, settings?.grades_slug]);

  const loadOverview = useCallback(async (nextSemester?: GradebookSemester, nextYear?: string) => {
    const params = new URLSearchParams();
    if (nextSemester) params.set('semester', String(nextSemester));
    if (nextYear) params.set('school_year', nextYear);
    const response = await fetch(`/api/gradebook/overview?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      setError('Failed to load gradebook.');
      setLoaded(true);
      return;
    }
    const data = await response.json();
    const nextSettings = data.settings as GradebookSettings;
    setSettings(nextSettings);
    setClasses(data.classes || []);
    setSemester(nextSettings.active_semester);
    setSchoolYear(nextSettings.school_year || '');
    setSchoolName(nextSettings.school_name || '');
    setGradesSlug(nextSettings.grades_slug || '');
    setError('');
    setLoaded(true);
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleSaveSettings() {
    setSaving(true);
    setError('');
    setSaveMessage('');
    try {
      const response = await fetch('/api/gradebook/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_year: schoolYear,
          active_semester: semester,
          school_name: schoolName,
          grades_slug: gradesSlug,
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');

      const saved = data.settings as GradebookSettings;
      // Apply the saved values immediately so the form cannot snap back to stale data.
      setSettings(saved);
      setSemester(saved.active_semester);
      setSchoolYear(saved.school_year || '');
      setSchoolName(saved.school_name || '');
      setGradesSlug(saved.grades_slug || '');
      setSaveMessage(
        `Saved. Students see “${saved.school_name || 'Check My Grades'}” at /grades/${saved.grades_slug || '…'}.`
      );
      await loadOverview(saved.active_semester, saved.school_year);
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
        {studentGradesPath ? (
          <Link href={studentGradesPath} target="_blank">
            <ComicButton variant="warning" size="sm">
              Open student grades page
            </ComicButton>
          </Link>
        ) : null}
      </div>

      <ComicCard className="comic-shadow-xl">
        <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
          Semester Settings
        </ComicTitle>
        <div className="grid md:grid-cols-2 gap-4 items-end mb-4">
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
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-end mb-4">
          <div>
            <ComicText className="font-bold mb-1 text-sm">School name (shown to students)</ComicText>
            <input
              className="w-full comic-input"
              value={schoolName}
              onChange={(event) => {
                setSchoolName(event.target.value);
                setSaveMessage('');
              }}
              placeholder="Englishfully Academy"
              maxLength={120}
            />
            <ComicText className="text-xs mt-1 text-[var(--comic-dark)]">
              This name appears on the student grades page (max 120 characters).
            </ComicText>
          </div>
          <div>
            <ComicText className="font-bold mb-1 text-sm">Grades page link name</ComicText>
            <div className="flex items-center gap-2">
              <ComicText className="font-bold text-sm shrink-0">/grades/</ComicText>
              <input
                className="w-full comic-input"
                value={gradesSlug}
                onChange={(event) => {
                  setGradesSlug(normalizeGradesSlug(event.target.value));
                  setSaveMessage('');
                }}
                placeholder="englishfully"
              />
            </div>
            <ComicText className="text-xs mt-1 text-[var(--comic-dark)]">
              Letters, numbers, and hyphens only. Students use this link — not /grades alone.
            </ComicText>
          </div>
        </div>

        {studentGradesPath ? (
          <ComicText className="font-bold mb-4 break-all">
            Student link:{' '}
            <Link href={studentGradesPath} className="underline font-black" target="_blank">
              {studentGradesPath}
            </Link>
          </ComicText>
        ) : (
          <ComicText className="font-bold mb-4 text-[var(--comic-dark)]">
            Set a grades page link name above so students can open /grades/your-school.
          </ComicText>
        )}

        <ComicButton
          type="button"
          variant="success"
          size="md"
          disabled={saving}
          onClick={() => void handleSaveSettings()}
        >
          {saving ? 'Saving…' : 'Save Gradebook Settings'}
        </ComicButton>

        {settings ? (
          <ComicText className="text-sm mt-4 text-[var(--comic-dark)]">
            Viewing {settings.school_year} · Semester {settings.active_semester}
            {settings.school_name ? ` · School name: ${settings.school_name}` : ''}
          </ComicText>
        ) : null}
        {saveMessage ? (
          <ComicText className="text-[var(--comic-success)] font-bold mt-4">{saveMessage}</ComicText>
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
          Classes come from your Speak &amp; Submit settings. Open a class to enter grades and set
          each student’s 5-digit roll number.
          {studentGradesPath ? (
            <>
              {' '}
              Students check grades at{' '}
              <Link href={studentGradesPath} className="underline font-black">
                {studentGradesPath}
              </Link>
              .
            </>
          ) : (
            <> Set your grades page link name above first.</>
          )}
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
