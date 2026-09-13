'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { generateQrDataUrl, getStudentProjectUrl } from '@/lib/projects/qr';
import {
  PROJECT_STATUS_LABELS,
  asArtworkSettings,
  asSpeakingSettings,
  asWorksheetSettings,
  defaultSettingsForType,
  type ProjectComponent,
  type ProjectWithComponents,
  type SaveProjectPayload,
} from '@/lib/projects/types';
import type { SpeakClassOption } from '@/lib/speak-and-submit/types';
import { sortSpeakClassOptions } from '@/lib/speak-and-submit/types';
import ClassCheckboxDropdown from './ClassCheckboxDropdown';

interface ProjectEditorProps {
  project: ProjectWithComponents;
  onProjectChange: (project: ProjectWithComponents) => void;
}

type EditorComponent = SaveProjectPayload['components'][number];

function toEditorComponents(components: ProjectComponent[]): EditorComponent[] {
  const byType = new Map(components.map((item) => [item.type, item]));
  return (['worksheet', 'artwork', 'speaking'] as const).map((type) => {
    const current = byType.get(type);
    return {
      id: current?.id,
      type,
      enabled: current?.enabled ?? false,
      required: current?.required ?? true,
      instructions: current?.instructions ?? '',
      settings: current?.settings ?? defaultSettingsForType(type),
    };
  });
}

export default function ProjectEditor({ project, onProjectChange }: ProjectEditorProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    project.class_names?.length ? project.class_names : project.class_name ? [project.class_name] : []
  );
  const [manualClassName, setManualClassName] = useState(
    project.class_names?.length ? '' : project.class_name
  );
  const [classLabel, setClassLabel] = useState(project.class_label || '');
  const [dueDate, setDueDate] = useState(project.due_date || '');
  const [allowResubmission, setAllowResubmission] = useState(project.allow_resubmission);
  const [finalSubmissionEnabled, setFinalSubmissionEnabled] = useState(
    project.final_submission_enabled !== false
  );
  const [components, setComponents] = useState<EditorComponent[]>(() =>
    toEditorComponents(project.components)
  );
  const [classes, setClasses] = useState<SpeakClassOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const worksheetInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  const studentUrl = project.share_url || getStudentProjectUrl(project.slug);

  useEffect(() => {
    fetch('/api/speak-and-submit/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        setClasses(sortSpeakClassOptions((data.config?.classes || []) as SpeakClassOption[]));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (project.status !== 'published') {
      setQrCode('');
      return;
    }
    void generateQrDataUrl(studentUrl).then((dataUrl) => {
      if (!cancelled) setQrCode(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [project.status, studentUrl]);

  const worksheet = components.find((item) => item.type === 'worksheet');
  const artwork = components.find((item) => item.type === 'artwork');
  const speaking = components.find((item) => item.type === 'speaking');
  const worksheetSettings = useMemo(
    () => asWorksheetSettings(worksheet?.settings ?? defaultSettingsForType('worksheet')),
    [worksheet]
  );
  const artworkSettings = useMemo(
    () => asArtworkSettings(artwork?.settings ?? defaultSettingsForType('artwork')),
    [artwork]
  );
  const speakingSettings = useMemo(
    () => asSpeakingSettings(speaking?.settings ?? defaultSettingsForType('speaking')),
    [speaking]
  );

  function updateComponent(type: EditorComponent['type'], patch: Partial<EditorComponent>) {
    setComponents((current) =>
      current.map((item) => (item.type === type ? { ...item, ...patch } : item))
    );
  }

  async function saveDraft(): Promise<ProjectWithComponents | null> {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          class_names: classes.length > 0 ? selectedClasses : [manualClassName].filter(Boolean),
          class_label: classLabel,
          due_date: dueDate || null,
          allow_resubmission: allowResubmission,
          final_submission_enabled: finalSubmissionEnabled,
          components: components.map((item) => ({
            id: item.id,
            type: item.type,
            enabled: item.enabled,
            required: item.required,
            instructions: item.instructions,
            settings:
              item.type === 'speaking'
                ? {
                    ...asSpeakingSettings(item.settings),
                    prompts: speakingSettings.prompts,
                  }
                : item.settings,
          })),
        } satisfies SaveProjectPayload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save draft');
        return null;
      }
      onProjectChange(data.project);
      setMessage('Draft saved.');
      return data.project as ProjectWithComponents;
    } catch {
      setError('Failed to save draft');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError('');
    setMessage('');
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const response = await fetch(`/api/projects/${saved.id}/publish`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to publish project');
        return;
      }
      onProjectChange(data.project);
      setMessage('Project published. Students can now open the share link.');
    } catch {
      setError('Failed to publish project');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setPublishing(true);
    setError('');
    try {
      const response = await fetch(`/api/projects/${project.id}/publish`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to unpublish project');
        return;
      }
      onProjectChange(data.project);
      setMessage('Project is a draft again.');
    } catch {
      setError('Failed to unpublish project');
    } finally {
      setPublishing(false);
    }
  }

  async function handleTeacherUpload(kind: 'worksheet' | 'artwork-example', file: File) {
    setUploading(kind);
    setError('');
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      const response = await fetch(`/api/projects/${saved.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to upload file');
        return;
      }
      onProjectChange(data.project);
      setComponents(toEditorComponents(data.project.components));
      setMessage(kind === 'worksheet' ? 'Worksheet uploaded.' : 'Example image uploaded.');
    } catch {
      setError('Failed to upload file');
    } finally {
      setUploading('');
    }
  }

  return (
    <div className="space-y-8">
      <ComicCard className="comic-shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ComicTitle level={3} className="text-[var(--comic-secondary)]">
            Project settings
          </ComicTitle>
          <ComicText className="text-[var(--comic-secondary)] font-bold">
            {PROJECT_STATUS_LABELS[project.status]}
          </ComicText>
        </div>

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
            <ClassCheckboxDropdown
              classes={classes}
              selected={selectedClasses}
              onChange={setSelectedClasses}
            />
          ) : (
            <input
              className="w-full comic-input"
              placeholder="Class"
              value={manualClassName}
              onChange={(event) => setManualClassName(event.target.value)}
            />
          )}
          <input
            type="date"
            className="w-full comic-input"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
        <label className="block font-bold text-[var(--comic-dark)]">
          Class label on the project header
          <input
            className="w-full comic-input mt-2"
            placeholder="e.g. M4,M5,M6"
            value={classLabel}
            onChange={(event) => setClassLabel(event.target.value)}
          />
        </label>
        <ComicText className="text-[var(--comic-dark)]">
          This short label is what students and teachers see. The class list above only controls who can submit.
        </ComicText>
        <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={finalSubmissionEnabled}
            onChange={(event) => setFinalSubmissionEnabled(event.target.checked)}
          />
          Enable final submission
        </label>
        <ComicText className="text-[var(--comic-dark)]">
          When this is off, students only upload or send in LINE. You review the project manually.
        </ComicText>
        <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={allowResubmission}
            onChange={(event) => setAllowResubmission(event.target.checked)}
          />
          Allow students to resubmit after they send the project
        </label>
      </ComicCard>

      {worksheet ? (
        <ComicCard className="comic-shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ComicTitle level={4} className="text-[var(--comic-primary)]">
              Worksheet
            </ComicTitle>
            <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
              <input
                type="checkbox"
                checked={worksheet.enabled}
                onChange={(event) => updateComponent('worksheet', { enabled: event.target.checked })}
              />
              Enabled
            </label>
          </div>
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={worksheet.required}
              onChange={(event) => updateComponent('worksheet', { required: event.target.checked })}
            />
            Required
          </label>
          <textarea
            className="w-full comic-textarea min-h-24"
            placeholder="Worksheet instructions"
            value={worksheet.instructions}
            onChange={(event) => updateComponent('worksheet', { instructions: event.target.value })}
          />
          <input
            ref={worksheetInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleTeacherUpload('worksheet', file);
              event.target.value = '';
            }}
          />
          <ComicButton
            variant="secondary"
            size="sm"
            disabled={uploading === 'worksheet'}
            onClick={() => worksheetInputRef.current?.click()}
          >
            {uploading === 'worksheet' ? 'Uploading…' : 'Upload worksheet'}
          </ComicButton>
          {worksheetSettings.file ? (
            <ComicText className="text-[var(--comic-dark)]">
              Attached: {worksheetSettings.file.file_name}
            </ComicText>
          ) : (
            <ComicText className="text-[var(--comic-dark)]">
              Optional now. Google Drive import can be added later without changing the project model.
            </ComicText>
          )}
        </ComicCard>
      ) : null}

      {artwork ? (
        <ComicCard className="comic-shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ComicTitle level={4} className="text-[var(--comic-primary)]">
              Artwork
            </ComicTitle>
            <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
              <input
                type="checkbox"
                checked={artwork.enabled}
                onChange={(event) => updateComponent('artwork', { enabled: event.target.checked })}
              />
              Enabled
            </label>
          </div>
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={artwork.required}
              onChange={(event) => updateComponent('artwork', { required: event.target.checked })}
            />
            Required
          </label>
          <textarea
            className="w-full comic-textarea min-h-24"
            placeholder="Create a drawing of your dream city and upload a photo of your artwork."
            value={artwork.instructions}
            onChange={(event) => updateComponent('artwork', { instructions: event.target.value })}
          />
          <input
            ref={artworkInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleTeacherUpload('artwork-example', file);
              event.target.value = '';
            }}
          />
          <ComicButton
            variant="secondary"
            size="sm"
            disabled={uploading === 'artwork-example'}
            onClick={() => artworkInputRef.current?.click()}
          >
            {uploading === 'artwork-example' ? 'Uploading…' : 'Upload example image'}
          </ComicButton>
          {artworkSettings.example_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkSettings.example_image.url}
              alt="Artwork example"
              className="max-h-56 rounded-lg comic-border object-contain"
            />
          ) : null}
        </ComicCard>
      ) : null}

      {speaking ? (
        <ComicCard className="comic-shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ComicTitle level={4} className="text-[var(--comic-primary)]">
              Speaking
            </ComicTitle>
            <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
              <input
                type="checkbox"
                checked={speaking.enabled}
                onChange={(event) => updateComponent('speaking', { enabled: event.target.checked })}
              />
              Enabled
            </label>
          </div>
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={speaking.required}
              onChange={(event) => updateComponent('speaking', { required: event.target.checked })}
            />
            Required
          </label>
          <textarea
            className="w-full comic-textarea min-h-24"
            placeholder="Talk about your dream city for 1–2 minutes."
            value={speaking.instructions}
            onChange={(event) => updateComponent('speaking', { instructions: event.target.value })}
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="font-bold text-[var(--comic-dark)]">
              Minimum seconds
              <input
                type="number"
                min={5}
                max={600}
                className="w-full comic-input mt-2"
                value={speakingSettings.min_seconds}
                onChange={(event) =>
                  updateComponent('speaking', {
                    settings: {
                      ...speakingSettings,
                      min_seconds: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="font-bold text-[var(--comic-dark)]">
              Maximum seconds
              <input
                type="number"
                min={5}
                max={600}
                className="w-full comic-input mt-2"
                value={speakingSettings.max_seconds}
                onChange={(event) =>
                  updateComponent('speaking', {
                    settings: {
                      ...speakingSettings,
                      max_seconds: Number(event.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
          <textarea
            className="w-full comic-textarea min-h-24"
            placeholder="Optional prompts / questions (one per line)"
            value={speakingSettings.prompts.join('\n')}
            onChange={(event) =>
              updateComponent('speaking', {
                settings: {
                  ...speakingSettings,
                  prompts: event.target.value.split('\n'),
                },
              })
            }
          />
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={speakingSettings.online_recording_enabled}
              onChange={(event) =>
                updateComponent('speaking', {
                  settings: {
                    ...speakingSettings,
                    online_recording_enabled: event.target.checked,
                  },
                })
              }
            />
            Online recording (like Speak & Submit)
          </label>
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={speakingSettings.in_person_enabled}
              onChange={(event) =>
                updateComponent('speaking', {
                  settings: {
                    ...speakingSettings,
                    in_person_enabled: event.target.checked,
                  },
                })
              }
            />
            In-person presentation
          </label>
        </ComicCard>
      ) : null}

      {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
      {message ? <ComicText className="text-[var(--comic-success)] font-bold">{message}</ComicText> : null}

      <div className="flex flex-wrap gap-3">
        <ComicButton variant="secondary" onClick={() => void saveDraft()} disabled={saving || publishing}>
          {saving ? 'Saving…' : 'Save draft'}
        </ComicButton>
        <Link href={`/teacher-resources/projects/${project.id}/preview`}>
          <ComicButton variant="accent">Preview project</ComicButton>
        </Link>
        {project.status === 'published' ? (
          <ComicButton variant="warning" onClick={() => void handleUnpublish()} disabled={publishing}>
            {publishing ? 'Updating…' : 'Unpublish'}
          </ComicButton>
        ) : (
          <ComicButton variant="primary" onClick={() => void handlePublish()} disabled={publishing || saving}>
            {publishing ? 'Publishing…' : 'Publish project'}
          </ComicButton>
        )}
      </div>

      {project.status === 'published' ? (
        <ComicCard className="comic-shadow-xl text-center space-y-3">
          <ComicTitle level={4} className="text-[var(--comic-secondary)]">
            Student link
          </ComicTitle>
          {qrCode ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="QR code for student project" className="mx-auto comic-border-thick" />
          ) : null}
          <ComicText className="text-[var(--comic-dark)] font-bold break-all">{studentUrl}</ComicText>
        </ComicCard>
      ) : null}
    </div>
  );
}
