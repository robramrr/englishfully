'use client';

import { useState } from 'react';
import ComicButton from '../ComicButton';
import {
  listRoleplayPresets,
  saveRoleplayPreset,
  type RoleplayPreset,
} from '@/lib/worksheets/roleplay';
import {
  ROLEPLAY_LEVELS,
  type RoleplayBank,
  type RoleplayLine,
  type RoleplaySettings,
  type WorksheetSection,
} from '@/lib/worksheets/types';

export function RoleplaySettingsPanel({
  settings,
  onChange,
}: {
  settings: RoleplaySettings;
  onChange: (settings: RoleplaySettings) => void;
}) {
  const [presets, setPresets] = useState<RoleplayPreset[]>(() => listRoleplayPresets());
  const [presetName, setPresetName] = useState('');

  function savePreset() {
    const name = presetName.trim() || settings.objective.trim().slice(0, 40) || 'Saved objective';
    setPresets(
      saveRoleplayPreset({
        name,
        objective: settings.objective,
        vocabulary: settings.vocabulary,
        grammar: settings.grammar,
      })
    );
    setPresetName('');
  }

  function loadPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    onChange({
      ...settings,
      objective: preset.objective,
      vocabulary: preset.vocabulary,
      grammar: preset.grammar,
    });
  }

  return (
    <div className="space-y-3 border-4 border-[var(--comic-black)] bg-[var(--comic-yellow)] p-4">
      <p className="font-black text-[var(--comic-dark)]">Guided roleplay settings</p>
      <p className="text-sm font-bold text-[var(--comic-dark)]">
        Students complete a partner dialogue from word banks, then practise it aloud.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">English level</span>
          <select
            value={settings.level}
            onChange={(event) =>
              onChange({ ...settings, level: event.target.value as RoleplaySettings['level'] })
            }
            className="comic-input w-full"
          >
            {ROLEPLAY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Difficulty</span>
          <select
            value={settings.difficulty}
            onChange={(event) =>
              onChange({
                ...settings,
                difficulty: event.target.value as RoleplaySettings['difficulty'],
              })
            }
            className="comic-input w-full"
          >
            <option value="easy">Easy</option>
            <option value="standard">Standard</option>
            <option value="challenging">Challenging</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Word bank</span>
          <select
            value={settings.wordUse}
            onChange={(event) =>
              onChange({ ...settings, wordUse: event.target.value as RoleplaySettings['wordUse'] })
            }
            className="comic-input w-full"
          >
            <option value="once">Use each word once</option>
            <option value="repeat">Words can be used again</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Learning objective</span>
        <textarea
          value={settings.objective}
          onChange={(event) => onChange({ ...settings, objective: event.target.value })}
          rows={2}
          placeholder="Use adverbs of frequency and adjectives to talk about social media."
          className="comic-input w-full"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Target vocabulary</span>
        <textarea
          value={settings.vocabulary}
          onChange={(event) => onChange({ ...settings, vocabulary: event.target.value })}
          rows={4}
          placeholder={'Adverbs of frequency: always, often, sometimes\nAdjectives: fun, useful, boring'}
          className="comic-input w-full"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Target grammar (optional)</span>
        <input
          value={settings.grammar}
          onChange={(event) => onChange({ ...settings, grammar: event.target.value })}
          placeholder="Present simple, will for the future"
          className="comic-input w-full"
        />
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block text-sm font-bold">Save these words</span>
          <input
            value={presetName}
            onChange={(event) => setPresetName(event.target.value)}
            placeholder="Social media A2"
            className="comic-input w-full"
          />
        </label>
        <ComicButton type="button" variant="secondary" size="sm" onClick={savePreset}>
          Save objective
        </ComicButton>
        {presets.length > 0 ? (
          <label className="min-w-[12rem] flex-1">
            <span className="mb-1 block text-sm font-bold">Reuse a saved set</span>
            <select
              defaultValue=""
              onChange={(event) => {
                loadPreset(event.target.value);
                event.target.value = '';
              }}
              className="comic-input w-full"
            >
              <option value="">Choose a saved set</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}

function answersToText(answers: string[][]): string {
  return answers.map((options) => options.join(' | ')).join('; ');
}

function textToAnswers(value: string, gaps: number): string[][] {
  const groups = value
    .split(';')
    .map((group) =>
      group
        .split('|')
        .map((word) => word.trim())
        .filter(Boolean)
        .slice(0, 4)
    );
  return Array.from({ length: gaps }, (_, index) => groups[index] || []);
}

export function RoleplaySectionEditor({
  section,
  onChange,
}: {
  section: Extract<WorksheetSection, { type: 'guided_roleplay' }>;
  onChange: (section: Extract<WorksheetSection, { type: 'guided_roleplay' }>) => void;
}) {
  const [busy, setBusy] = useState<'conversation' | 'banks' | ''>('');
  const [error, setError] = useState('');

  function updateLine(index: number, line: RoleplayLine) {
    onChange({
      ...section,
      lines: section.lines.map((current, lineIndex) => (lineIndex === index ? line : current)),
    });
  }

  function updateBank(index: number, bank: RoleplayBank) {
    onChange({
      ...section,
      banks: section.banks.map((current, bankIndex) => (bankIndex === index ? bank : current)),
    });
  }

  async function regenerate(mode: 'conversation' | 'banks') {
    setError('');
    setBusy(mode);
    try {
      const response = await fetch('/api/worksheets/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          topic: section.topic,
          exchanges: Math.max(4, Math.ceil(section.lines.length / 2)),
          settings: {
            level: section.level,
            objective: section.objective,
            vocabulary: section.vocabulary,
            grammar: section.grammar,
            difficulty: section.difficulty,
            wordUse: section.wordUse,
          },
          banks: section.banks,
          lines: section.lines,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.section) {
        throw new Error(data.error || 'Could not rebuild this roleplay');
      }
      onChange(data.section);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rebuild this roleplay');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Learning objective</span>
        <textarea
          value={section.objective}
          onChange={(event) => onChange({ ...section, objective: event.target.value })}
          rows={2}
          className="comic-input w-full"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== ''}
          onClick={() => void regenerate('conversation')}
        >
          {busy === 'conversation' ? 'Writing…' : 'New conversation'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== ''}
          onClick={() => void regenerate('banks')}
        >
          {busy === 'banks' ? 'Shuffling…' : 'New word banks'}
        </ComicButton>
      </div>
      {error ? <p className="text-sm font-bold text-[var(--comic-danger)]">{error}</p> : null}
      {section.banks.map((bank, index) => (
        <div key={`${bank.label}-${index}`} className="grid gap-2 md:grid-cols-[10rem_1fr_auto]">
          <input
            value={bank.label}
            aria-label={`Word bank ${index + 1} name`}
            onChange={(event) => updateBank(index, { ...bank, label: event.target.value })}
            className="comic-input w-full"
          />
          <input
            value={bank.words.join(' | ')}
            aria-label={`Word bank ${index + 1} words`}
            onChange={(event) =>
              updateBank(index, {
                ...bank,
                words: event.target.value
                  .split('|')
                  .map((word) => word.trim())
                  .filter(Boolean),
              })
            }
            className="comic-input w-full"
          />
          <button
            type="button"
            className="border-2 border-[var(--comic-black)] px-2 text-sm font-black"
            onClick={() =>
              onChange({ ...section, banks: section.banks.filter((_, bankIndex) => bankIndex !== index) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="border-2 border-[var(--comic-black)] bg-white px-2 py-1 text-sm font-black"
        onClick={() => onChange({ ...section, banks: [...section.banks, { label: 'Words', words: [] }] })}
      >
        Add word bank
      </button>
      {section.lines.map((line, index) => {
        const gaps = Math.max(0, line.text.split(/_{3,}/).length - 1);
        return (
          <div key={`line-${index}`} className="space-y-2 border-2 border-[var(--comic-black)] p-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={line.speaker}
                aria-label={`Line ${index + 1} speaker`}
                onChange={(event) =>
                  updateLine(index, { ...line, speaker: Number(event.target.value) === 2 ? 2 : 1 })
                }
                className="comic-input"
              >
                <option value={1}>Speaker 1</option>
                <option value={2}>Speaker 2</option>
              </select>
              <button
                type="button"
                className="ml-auto border-2 border-[var(--comic-black)] px-2 text-sm font-black"
                onClick={() =>
                  onChange({
                    ...section,
                    lines: section.lines.filter((_, lineIndex) => lineIndex !== index),
                  })
                }
              >
                Remove line
              </button>
            </div>
            <textarea
              value={line.text}
              aria-label={`Line ${index + 1}`}
              rows={2}
              onChange={(event) => {
                const text = event.target.value;
                const nextGaps = Math.max(0, text.split(/_{3,}/).length - 1);
                updateLine(index, {
                  ...line,
                  text,
                  answers: Array.from({ length: nextGaps }, (_, gap) => line.answers[gap] || []),
                });
              }}
              className="comic-input w-full"
            />
            {gaps > 0 ? (
              <input
                value={answersToText(line.answers)}
                aria-label={`Line ${index + 1} answers`}
                placeholder="always | often; sometimes"
                onChange={(event) =>
                  updateLine(index, { ...line, answers: textToAnswers(event.target.value, gaps) })
                }
                className="comic-input w-full"
              />
            ) : null}
            <input
              value={line.note}
              aria-label={`Line ${index + 1} note`}
              placeholder="Note for the answer key, if a blank has more than one answer"
              onChange={(event) => updateLine(index, { ...line, note: event.target.value })}
              className="comic-input w-full"
            />
          </div>
        );
      })}
      <button
        type="button"
        className="border-2 border-[var(--comic-black)] bg-white px-2 py-1 text-sm font-black"
        onClick={() =>
          onChange({
            ...section,
            lines: [
              ...section.lines,
              {
                speaker: section.lines.length % 2 === 0 ? 1 : 2,
                text: '',
                answers: [],
                note: '',
              },
            ],
          })
        }
      >
        Add line
      </button>
    </div>
  );
}
