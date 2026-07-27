'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type {
  GradebookClassSummary,
  GradebookRollClaim,
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
  const [rollLookupOpen, setRollLookupOpen] = useState(false);
  const [claims, setClaims] = useState<GradebookRollClaim[]>([]);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [clearingClaims, setClearingClaims] = useState(false);
  const [savingClaimKey, setSavingClaimKey] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const loadGenerationRef = useRef(0);
  const schoolNameRef = useRef(schoolName);
  const gradesSlugRef = useRef(gradesSlug);
  const rollLookupOpenRef = useRef(rollLookupOpen);
  schoolNameRef.current = schoolName;
  gradesSlugRef.current = gradesSlug;
  rollLookupOpenRef.current = rollLookupOpen;

  const studentGradesPath = useMemo(() => {
    const slug = normalizeGradesSlug(gradesSlug || settings?.grades_slug || '');
    return slug ? `/grades/${slug}` : '';
  }, [gradesSlug, settings?.grades_slug]);

  const claimSummaries = useMemo(() => {
    const bySeat = new Map<
      string,
      {
        class_id: string;
        class_label: string;
        student_number: string;
        latest_roll: string;
        latest_at: string;
        rolls: string[];
        conflict: boolean;
      }
    >();
    for (const claim of claims) {
      const key = `${claim.class_id}::${claim.student_number}`;
      const existing = bySeat.get(key);
      if (!existing) {
        bySeat.set(key, {
          class_id: claim.class_id,
          class_label: claim.class_label,
          student_number: claim.student_number,
          latest_roll: claim.claimed_roll,
          latest_at: claim.created_at,
          rolls: [claim.claimed_roll],
          conflict: false,
        });
        continue;
      }
      if (!existing.rolls.includes(claim.claimed_roll)) {
        existing.rolls.push(claim.claimed_roll);
        existing.conflict = existing.rolls.length > 1;
      }
    }
    return Array.from(bySeat.values()).sort((a, b) => {
      const classCmp = a.class_label.localeCompare(b.class_label, undefined, {
        sensitivity: 'base',
      });
      if (classCmp !== 0) return classCmp;
      return a.student_number.localeCompare(b.student_number, undefined, { numeric: true });
    });
  }, [claims]);

  const loadClaims = useCallback(async () => {
    const response = await fetch('/api/gradebook/roll-claims', { cache: 'no-store' });
    if (!response.ok) {
      setClaimsLoaded(true);
      return;
    }
    const data = await response.json();
    setClaims((data.claims || []) as GradebookRollClaim[]);
    setClaimsLoaded(true);
  }, []);

  const loadOverview = useCallback(
    async (
      nextSemester?: GradebookSemester,
      nextYear?: string,
      options?: { preserveDisplayFields?: boolean }
    ) => {
      const generation = ++loadGenerationRef.current;
      const params = new URLSearchParams();
      if (nextSemester) params.set('semester', String(nextSemester));
      if (nextYear) params.set('school_year', nextYear);
      const response = await fetch(`/api/gradebook/overview?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        if (generation !== loadGenerationRef.current) return;
        setError('Failed to load gradebook.');
        setLoaded(true);
        return;
      }
      const data = await response.json();
      if (generation !== loadGenerationRef.current) return;

      const nextSettings = data.settings as GradebookSettings;
      setSettings(nextSettings);
      setClasses(data.classes || []);
      setSemester(nextSettings.active_semester);
      setSchoolYear(nextSettings.school_year || '');
      if (!options?.preserveDisplayFields) {
        setSchoolName(nextSettings.school_name || '');
        setGradesSlug(nextSettings.grades_slug || '');
        setRollLookupOpen(Boolean(nextSettings.roll_lookup_open));
      }
      setError('');
      setLoaded(true);
    },
    []
  );

  useEffect(() => {
    void loadOverview();
    void loadClaims();
  }, [loadOverview, loadClaims]);

  async function handleSaveSettings() {
    setSaving(true);
    setError('');
    setSaveMessage('');
    // Bump generation so any in-flight overview fetch cannot overwrite this save.
    loadGenerationRef.current += 1;
    const nameToSave = schoolNameRef.current.trim();
    const slugToSave = gradesSlugRef.current;
    const openToSave = rollLookupOpenRef.current;
    try {
      const response = await fetch('/api/gradebook/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_year: schoolYear,
          active_semester: semester,
          school_name: nameToSave,
          grades_slug: slugToSave,
          roll_lookup_open: openToSave,
        }),
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');

      const saved = data.settings as GradebookSettings;
      setSettings(saved);
      setSemester(saved.active_semester);
      setSchoolYear(saved.school_year || '');
      setSchoolName(saved.school_name || nameToSave);
      setGradesSlug(saved.grades_slug || slugToSave);
      setRollLookupOpen(Boolean(saved.roll_lookup_open));

      // Confirm what the student API actually returns (same source as /grades/spk).
      let liveStudentName = saved.school_name || nameToSave;
      const liveSlug = saved.grades_slug || slugToSave;
      if (liveSlug) {
        try {
          const live = await fetch(
            `/api/grades/${encodeURIComponent(liveSlug)}/classes?_=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (live.ok) {
            const liveData = await live.json();
            liveStudentName = String(liveData.school_name || liveStudentName);
          }
        } catch {
          // ignore live check failures
        }
      }

      setSaveMessage(
        saved.roll_lookup_open
          ? `Saved. Temporary open lookup is ON. Students see “${liveStudentName || 'Check My Grades'}” at /grades/${liveSlug || '…'}.`
          : `Saved. Students see “${liveStudentName || 'Check My Grades'}” at /grades/${liveSlug || '…'}. Roll lookup is locked (strict).`
      );
      // Refresh class cards only — keep the display fields we just saved.
      await loadOverview(saved.active_semester, saved.school_year, {
        preserveDisplayFields: true,
      });
      await loadClaims();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleClearClaims() {
    if (!window.confirm('Clear the claimed roll number log? This does not change roster rolls you already saved.')) {
      return;
    }
    setClearingClaims(true);
    setError('');
    try {
      const response = await fetch('/api/gradebook/roll-claims', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to clear log');
      setClaims([]);
      setSaveMessage('Claimed roll log cleared.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear log');
    } finally {
      setClearingClaims(false);
    }
  }

  async function handleSaveClaimToRoster(claim: {
    class_id: string;
    class_label: string;
    student_number: string;
    latest_roll: string;
  }) {
    const key = `${claim.class_id}::${claim.student_number}`;
    setSavingClaimKey(key);
    setError('');
    try {
      const response = await fetch('/api/gradebook/roster', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: claim.class_id,
          class_label: claim.class_label,
          student_number: claim.student_number,
          roll_number: claim.latest_roll,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save roll to roster');
      setSaveMessage(
        `Saved roll ${claim.latest_roll} for ${claim.class_label} #${claim.student_number} to the roster.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save roll to roster');
    } finally {
      setSavingClaimKey('');
    }
  }

  async function handleSemesterChange(next: GradebookSemester) {
    setSemester(next);
    setLoaded(false);
    // Keep school name / slug / roll toggle — reloading them from a stale overview
    // was putting the old student header back into the form (and a later Save wrote it back).
    await loadOverview(next, schoolYear, { preserveDisplayFields: true });
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

        <div className="mb-4 rounded-lg border-2 border-[var(--comic-dark)] p-4 bg-[var(--comic-bg)]">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={rollLookupOpen}
              onChange={(event) => {
                setRollLookupOpen(event.target.checked);
                setSaveMessage('');
              }}
            />
            <span>
              <ComicText className="font-black">
                Temporary: open roll lookup (students still type 5 digits)
              </ComicText>
              <ComicText className="text-sm mt-1 text-[var(--comic-dark)]">
                When on, class + seat is enough to see grades. The 5 digits they enter are logged
                below so you can verify and save them to the roster. Turn this off when you’re
                caught up — students will not see any difference on their page.
              </ComicText>
            </span>
          </label>
          {rollLookupOpen ? (
            <ComicText className="text-sm mt-3 font-bold text-[var(--comic-danger)]">
              Open mode is temporary and less private (classmates who know a seat can peek). Lock
              it again after you enter rolls.
            </ComicText>
          ) : null}
        </div>

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
            {` · Roll lookup: ${settings.roll_lookup_open ? 'OPEN (temporary)' : 'locked'}`}
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
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            Claimed roll numbers
          </ComicTitle>
          <div className="flex flex-wrap gap-2">
            <ComicButton
              type="button"
              variant="accent"
              size="sm"
              onClick={() => void loadClaims()}
            >
              Refresh log
            </ComicButton>
            <ComicButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={clearingClaims || claims.length === 0}
              onClick={() => void handleClearClaims()}
            >
              {clearingClaims ? 'Clearing…' : 'Clear log'}
            </ComicButton>
          </div>
        </div>
        <ComicText className="mb-4 text-[var(--comic-dark)]">
          When temporary open lookup is on, each successful student check logs the 5 digits they
          typed. Use “Save to roster” after you verify, or copy them into the class gradebook Roll #
          column yourself.
        </ComicText>

        {!claimsLoaded ? (
          <ComicText className="font-bold">Loading claimed rolls…</ComicText>
        ) : claimSummaries.length === 0 ? (
          <ComicText className="font-bold text-[var(--comic-dark)]">
            No claimed rolls yet. Turn on temporary open lookup, save settings, then have students
            check grades at their school link.
          </ComicText>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--comic-dark)]">
                  <th className="py-2 pr-3">
                    <ComicText className="font-black text-sm">Class</ComicText>
                  </th>
                  <th className="py-2 pr-3">
                    <ComicText className="font-black text-sm">Seat</ComicText>
                  </th>
                  <th className="py-2 pr-3">
                    <ComicText className="font-black text-sm">They entered</ComicText>
                  </th>
                  <th className="py-2 pr-3">
                    <ComicText className="font-black text-sm">Notes</ComicText>
                  </th>
                  <th className="py-2">
                    <ComicText className="font-black text-sm">Action</ComicText>
                  </th>
                </tr>
              </thead>
              <tbody>
                {claimSummaries.map((claim) => {
                  const key = `${claim.class_id}::${claim.student_number}`;
                  return (
                    <tr key={key} className="border-b border-[var(--comic-dark)]/30 align-top">
                      <td className="py-3 pr-3">
                        <ComicText className="font-bold">{claim.class_label || '—'}</ComicText>
                      </td>
                      <td className="py-3 pr-3">
                        <ComicText className="font-bold">#{claim.student_number}</ComicText>
                      </td>
                      <td className="py-3 pr-3">
                        <ComicText className="font-black text-lg tracking-widest">
                          {claim.latest_roll}
                        </ComicText>
                        <ComicText className="text-xs text-[var(--comic-dark)]">
                          {new Date(claim.latest_at).toLocaleString()}
                        </ComicText>
                      </td>
                      <td className="py-3 pr-3">
                        {claim.conflict ? (
                          <ComicText className="text-sm font-bold text-[var(--comic-danger)]">
                            Conflict: {claim.rolls.join(', ')}
                          </ComicText>
                        ) : (
                          <ComicText className="text-sm text-[var(--comic-dark)]">OK</ComicText>
                        )}
                      </td>
                      <td className="py-3">
                        <ComicButton
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={savingClaimKey === key}
                          onClick={() => {
                            if (
                              claim.conflict &&
                              !window.confirm(
                                `Different rolls were entered for this seat (${claim.rolls.join(', ')}). Save the latest (${claim.latest_roll}) anyway?`
                              )
                            ) {
                              return;
                            }
                            void handleSaveClaimToRoster(claim);
                          }}
                        >
                          {savingClaimKey === key ? 'Saving…' : 'Save to roster'}
                        </ComicButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
