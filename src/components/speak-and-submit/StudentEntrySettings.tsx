'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { NameMode, SaveEntryConfigPayload } from '@/lib/speak-and-submit/types';

interface ClassDraft {
  label: string;
  max_student_number: number;
}

const NAME_MODE_OPTIONS: Array<{ value: NameMode; label: string; emoji: string }> = [
  { value: 'nickname', label: 'Nickname (1 field)', emoji: '🙂' },
  { value: 'first_last', label: 'First & last name (2 fields)', emoji: '👤' },
];

export default function StudentEntrySettings() {
  const [nameMode, setNameMode] = useState<NameMode>('nickname');
  const [studentLetterEnabled, setStudentLetterEnabled] = useState(false);
  const [classes, setClasses] = useState<ClassDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/speak-and-submit/settings')
      .then((response) => response.json())
      .then((data) => {
        if (data.config) {
          setNameMode(data.config.name_mode);
          setStudentLetterEnabled(Boolean(data.config.student_letter_enabled));
          setClasses(
            data.config.classes.map((item: ClassDraft) => ({
              label: item.label,
              max_student_number: item.max_student_number,
            }))
          );
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  function addClass() {
    setClasses((current) => [...current, { label: '', max_student_number: 35 }]);
    setSaved(false);
  }

  function updateClass(index: number, field: keyof ClassDraft, value: string | number) {
    setClasses((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
    setSaved(false);
  }

  function removeClass(index: number) {
    setClasses((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSaved(false);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const payload: SaveEntryConfigPayload = {
      name_mode: nameMode,
      student_letter_enabled: studentLetterEnabled,
      classes: classes.filter((item) => item.label.trim()),
    };

    try {
      const response = await fetch('/api/speak-and-submit/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save settings.');
        return;
      }
      setClasses(
        data.config.classes.map((item: ClassDraft) => ({
          label: item.label,
          max_student_number: item.max_student_number,
        }))
      );
      setSaved(true);
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ComicCard className="comic-shadow-xl">
        <ComicText className="text-[var(--comic-dark)] font-bold">Loading student entry settings…</ComicText>
      </ComicCard>
    );
  }

  return (
    <ComicCard className="comic-shadow-xl">
      <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
        ⚙️ Student entry settings
      </ComicTitle>
      <ComicText className="text-[var(--comic-dark)] font-bold mb-6">
        Configure how students identify themselves on the speak page. These settings are saved and reused for all tasks.
      </ComicText>

      <form onSubmit={handleSave} className="space-y-8 text-left">
        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-3">Name fields</ComicText>
          <div className="grid sm:grid-cols-2 gap-3">
            {NAME_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setNameMode(option.value);
                  setSaved(false);
                }}
                className={`comic-border rounded-lg px-4 py-3 text-left font-bold transition-transform hover:scale-[1.02] ${
                  nameMode === option.value
                    ? 'comic-bg-secondary comic-text-white comic-shadow-md'
                    : 'bg-white text-[var(--comic-dark)]'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-3">Student number ID</ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4 text-sm">
            When enabled, students pick their number and an A or B ID (e.g. 15 + B → 15B).
          </ComicText>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setStudentLetterEnabled(false);
                setSaved(false);
              }}
              className={`comic-border rounded-lg px-4 py-3 text-left font-bold transition-transform hover:scale-[1.02] ${
                !studentLetterEnabled
                  ? 'comic-bg-secondary comic-text-white comic-shadow-md'
                  : 'bg-white text-[var(--comic-dark)]'
              }`}
            >
              🔢 Number only
            </button>
            <button
              type="button"
              onClick={() => {
                setStudentLetterEnabled(true);
                setSaved(false);
              }}
              className={`comic-border rounded-lg px-4 py-3 text-left font-bold transition-transform hover:scale-[1.02] ${
                studentLetterEnabled
                  ? 'comic-bg-secondary comic-text-white comic-shadow-md'
                  : 'bg-white text-[var(--comic-dark)]'
              }`}
            >
              🔤 Number + A/B ID
            </button>
          </div>
        </div>

        <div>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-3">Classes</ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4 text-sm">
            Add the classes students can pick from (e.g. 4/10, Grade 7B). Each class can have its own student number range.
          </ComicText>

          {classes.length === 0 ? (
            <ComicText className="text-[var(--comic-dark)] mb-4 text-sm italic">
              No classes yet — students will type class manually and pick numbers 1–35.
            </ComicText>
          ) : (
            <div className="space-y-3 mb-4">
              {classes.map((item, index) => (
                <div key={`class-${index}`} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-grow">
                    <ComicText className="text-[var(--comic-dark)] font-bold mb-1 text-sm">Class label</ComicText>
                    <input
                      className="w-full comic-input"
                      value={item.label}
                      onChange={(event) => updateClass(index, 'label', event.target.value)}
                      placeholder="4/10"
                      required
                    />
                  </div>
                  <div className="sm:w-40">
                    <ComicText className="text-[var(--comic-dark)] font-bold mb-1 text-sm">Max student #</ComicText>
                    <select
                      className="w-full comic-input"
                      value={item.max_student_number}
                      onChange={(event) =>
                        updateClass(index, 'max_student_number', Number.parseInt(event.target.value, 10))
                      }
                    >
                      {Array.from({ length: 35 }, (_, numberIndex) => numberIndex + 1).map((number) => (
                        <option key={number} value={number}>
                          1 – {number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ComicButton type="button" variant="danger" size="sm" onClick={() => removeClass(index)}>
                    Remove
                  </ComicButton>
                </div>
              ))}
            </div>
          )}

          <ComicButton type="button" variant="accent" size="sm" onClick={addClass}>
            + Add class
          </ComicButton>
        </div>

        {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
        {saved ? (
          <ComicText className="text-[var(--comic-success)] font-bold">Settings saved.</ComicText>
        ) : null}

        <ComicButton type="submit" variant="secondary" size="md" disabled={saving}>
          {saving ? 'Saving…' : 'Save entry settings'}
        </ComicButton>
      </form>
    </ComicCard>
  );
}
