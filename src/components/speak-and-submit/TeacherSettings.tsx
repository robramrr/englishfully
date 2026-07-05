'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';

export default function TeacherSettings() {
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/speak-and-submit/settings')
      .then((response) => response.json())
      .then((data) => {
        if (typeof data.teacher_name === 'string') {
          setTeacherName(data.teacher_name);
        }
      })
      .catch(() => setError('Failed to load teacher settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const response = await fetch('/api/speak-and-submit/settings/teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_name: teacherName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save teacher settings.');
        return;
      }
      setTeacherName(data.teacher_name);
      setSaved(true);
    } catch {
      setError('Failed to save teacher settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading teacher settings…</ComicText>
      </ComicCard>
    );
  }

  return (
    <ComicCard className="comic-shadow-xl">
      <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
        👩‍🏫 Teacher settings
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
        Enter your name so it&apos;s saved for your Speak &amp; Submit account.
      </ComicText>

      <form onSubmit={handleSave} className="space-y-6 text-left">
        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Your name</ComicText>
          <input
            className="w-full comic-input"
            value={teacherName}
            onChange={(event) => {
              setTeacherName(event.target.value);
              setSaved(false);
            }}
            placeholder="Ms. Johnson"
            required
          />
        </div>

        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
        {saved ? (
          <ComicText className="text-[var(--comic-success)] font-bold">Settings saved.</ComicText>
        ) : null}

        <ComicButton type="submit" variant="secondary" size="md" disabled={saving}>
          {saving ? 'Saving…' : 'Save teacher settings'}
        </ComicButton>
      </form>
    </ComicCard>
  );
}
