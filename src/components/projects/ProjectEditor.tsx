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
  asSpeakingSettings,
  asUploadTaskSettings,
  DEFAULT_UPLOAD_TASK_SETTINGS,
  defaultSettingsForType,
  isUploadTaskType,
  type ProjectComponent,
  type ProjectWithComponents,
  type SaveProjectPayload,
  type StoredFileRef,
  type UploadTaskSettings,
} from '@/lib/projects/types';
import type { SpeakClassOption } from '@/lib/speak-and-submit/types';
import { sortSpeakClassOptions } from '@/lib/speak-and-submit/types';
import ClassCheckboxDropdown from './ClassCheckboxDropdown';

interface ProjectEditorProps {
  project: ProjectWithComponents;
  onProjectChange: (project: ProjectWithComponents) => void;
}

type EditorComponent = SaveProjectPayload['components'][number] & {
  clientKey: string;
};

function newClientKey(): string {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toEditorComponents(components: ProjectComponent[]): EditorComponent[] {
  const uploads = components
    .filter((item) => isUploadTaskType(item.type))
    .map((item) => ({
      clientKey: item.id,
      id: item.id,
      type: 'upload' as const,
      enabled: item.enabled,
      required: item.required,
      instructions: item.instructions,
      settings: asUploadTaskSettings(
        item.settings,
        item.type === 'artwork' ? 'Artwork' : item.type === 'worksheet' ? 'Worksheet' : 'Upload'
      ),
    }));

  const speaking = components.find((item) => item.type === 'speaking');
  const speakingEditor: EditorComponent = {
    clientKey: speaking?.id || 'speaking',
    id: speaking?.id,
    type: 'speaking',
    enabled: speaking?.enabled ?? false,
    required: speaking?.required ?? true,
    instructions: speaking?.instructions ?? '',
    settings: speaking?.settings ?? defaultSettingsForType('speaking'),
  };

  return [...uploads, speakingEditor];
}

function emptyUploadTask(title = 'Upload'): EditorComponent {
  return {
    clientKey: newClientKey(),
    type: 'upload',
    enabled: true,
    required: true,
    instructions: '',
    settings: asUploadTaskSettings({ ...DEFAULT_UPLOAD_TASK_SETTINGS, title }, title),
  };
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
  const [projectProgressEnabled, setProjectProgressEnabled] = useState(
    project.project_progress_enabled !== false
  );
  const [worksheetFile, setWorksheetFile] = useState<StoredFileRef | null>(
    project.worksheet_file ?? null
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
  const exampleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const studentUrl = project.share_url || getStudentProjectUrl(project.slug);
  const uploadTasks = components.filter((item) => item.type === 'upload');
  const speaking = components.find((item) => item.type === 'speaking');
  const speakingSettings = useMemo(
    () => asSpeakingSettings(speaking?.settings ?? defaultSettingsForType('speaking')),
    [speaking]
  );

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

  function syncFromProject(next: ProjectWithComponents) {
    onProjectChange(next);
    setWorksheetFile(next.worksheet_file ?? null);
    setComponents(toEditorComponents(next.components));
  }

  function updateByKey(clientKey: string, patch: Partial<EditorComponent>) {
    setComponents((current) =>
      current.map((item) => (item.clientKey === clientKey ? { ...item, ...patch } : item))
    );
  }

  function updateUploadSettings(clientKey: string, patch: Partial<UploadTaskSettings>) {
    setComponents((current) =>
      current.map((item) => {
        if (item.clientKey !== clientKey || item.type !== 'upload') return item;
        const settings = asUploadTaskSettings(item.settings);
        return {
          ...item,
          settings: asUploadTaskSettings({ ...settings, ...patch }, settings.title),
        };
      })
    );
  }

  function addUploadTask() {
    setComponents((current) => {
      const speakingItem = current.find((item) => item.type === 'speaking');
      const uploads = current.filter((item) => item.type === 'upload');
      const nextTitle = uploads.length === 0 ? 'Worksheet' : uploads.length === 1 ? 'Artwork' : `Upload ${uploads.length + 1}`;
      const nextUploads = [...uploads, emptyUploadTask(nextTitle)];
      return speakingItem ? [...nextUploads, speakingItem] : nextUploads;
    });
  }

  function removeUploadTask(clientKey: string) {
    setComponents((current) => current.filter((item) => item.clientKey !== clientKey));
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
          project_progress_enabled: projectProgressEnabled,
          worksheet_file: worksheetFile,
          components: components.map((item) => ({
            id: item.id,
            type: item.type === 'speaking' ? 'speaking' : 'upload',
            enabled: item.enabled,
            required: item.required,
            instructions: item.instructions,
            settings:
              item.type === 'speaking'
                ? {
                    ...asSpeakingSettings(item.settings),
                    prompts: speakingSettings.prompts,
                  }
                : asUploadTaskSettings(item.settings),
          })),
        } satisfies SaveProjectPayload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save draft');
        return null;
      }
      syncFromProject(data.project);
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
      syncFromProject(data.project);
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
      syncFromProject(data.project);
      setMessage('Project is a draft again.');
    } catch {
      setError('Failed to unpublish project');
    } finally {
      setPublishing(false);
    }
  }

  async function handleWorksheetUpload(file: File) {
    setUploading('worksheet');
    setError('');
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'worksheet');
      const response = await fetch(`/api/projects/${saved.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to upload worksheet');
        return;
      }
      syncFromProject(data.project);
      setMessage('Worksheet uploaded.');
    } catch {
      setError('Failed to upload worksheet');
    } finally {
      setUploading('');
    }
  }

  async function handleExampleUpload(clientKey: string, componentId: string | undefined, file: File) {
    setUploading(`example-${clientKey}`);
    setError('');
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const savedComponent =
        (componentId && saved.components.find((item) => item.id === componentId)) ||
        saved.components.find((item) => {
          if (!isUploadTaskType(item.type)) return false;
          const settings = asUploadTaskSettings(item.settings);
          const local = components.find((entry) => entry.clientKey === clientKey);
          const localSettings = local ? asUploadTaskSettings(local.settings) : null;
          return localSettings?.title === settings.title;
        });
      if (!savedComponent) {
        setError('Save the upload task before adding an example image.');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'upload-example');
      formData.append('component_id', savedComponent.id);
      const response = await fetch(`/api/projects/${saved.id}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to upload example image');
        return;
      }
      syncFromProject(data.project);
      setMessage('Example image uploaded.');
    } catch {
      setError('Failed to upload example image');
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

        <div className="space-y-3">
          <ComicText className="font-bold text-[var(--comic-dark)]">Upload a worksheet</ComicText>
          <input
            ref={worksheetInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleWorksheetUpload(file);
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
          {worksheetFile ? (
            <ComicText className="text-[var(--comic-dark)]">
              Attached:{' '}
              <a
                href={worksheetFile.url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[var(--comic-secondary)] underline"
              >
                {worksheetFile.file_name}
              </a>
            </ComicText>
          ) : (
            <ComicText className="text-[var(--comic-dark)]">
              Optional handout students can open from the project page.
            </ComicText>
          )}
        </div>

        <label className="flex items-center gap-2 font-bold text-[var(--comic-dark)]">
          <input
            type="checkbox"
            checked={projectProgressEnabled}
            onChange={(event) => setProjectProgressEnabled(event.target.checked)}
          />
          Enable project progress
        </label>
        <ComicText className="text-[var(--comic-dark)]">
          When this is off, students do not see the Project progress checklist.
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
          When this is off, students cannot submit or remove a submission. They only upload or send
          in LINE, and you review the project manually.
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

      {uploadTasks.map((task) => {
        const settings = asUploadTaskSettings(task.settings);
        return (
          <ComicCard key={task.clientKey} className="comic-shadow-xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                className="min-w-0 flex-1 comic-input"
                placeholder="Task title (e.g. Worksheet or Artwork)"
                value={settings.title}
                onChange={(event) => updateUploadSettings(task.clientKey, { title: event.target.value })}
              />
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.enabled}
                  onChange={(event) => updateByKey(task.clientKey, { enabled: event.target.checked })}
                />
                Enabled
              </label>
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.required}
                  onChange={(event) => updateByKey(task.clientKey, { required: event.target.checked })}
                />
                Required
              </label>
            </div>
            <textarea
              className="w-full comic-textarea min-h-24"
              placeholder="Instructions for this upload task"
              value={task.instructions}
              onChange={(event) => updateByKey(task.clientKey, { instructions: event.target.value })}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.upload_enabled}
                  onChange={(event) =>
                    updateUploadSettings(task.clientKey, { upload_enabled: event.target.checked })
                  }
                />
                Upload enabled
              </label>
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.take_photo_enabled}
                  onChange={(event) =>
                    updateUploadSettings(task.clientKey, { take_photo_enabled: event.target.checked })
                  }
                />
                Take photo enabled
              </label>
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.send_line_enabled}
                  onChange={(event) =>
                    updateUploadSettings(task.clientKey, { send_line_enabled: event.target.checked })
                  }
                />
                Send in LINE enabled
              </label>
              <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.example_image_enabled}
                  onChange={(event) =>
                    updateUploadSettings(task.clientKey, { example_image_enabled: event.target.checked })
                  }
                />
                Example image enabled
              </label>
            </div>
            {settings.example_image_enabled ? (
              <div className="space-y-3">
                <input
                  ref={(node) => {
                    exampleInputRefs.current[task.clientKey] = node;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleExampleUpload(task.clientKey, task.id, file);
                    event.target.value = '';
                  }}
                />
                <ComicButton
                  variant="secondary"
                  size="sm"
                  disabled={uploading === `example-${task.clientKey}`}
                  onClick={() => exampleInputRefs.current[task.clientKey]?.click()}
                >
                  {uploading === `example-${task.clientKey}` ? 'Uploading…' : 'Upload example image'}
                </ComicButton>
                {settings.example_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.example_image.url}
                    alt={`${settings.title} example`}
                    className="max-h-56 rounded-lg comic-border object-contain"
                  />
                ) : null}
              </div>
            ) : null}
            <ComicButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => removeUploadTask(task.clientKey)}
            >
              Remove upload task
            </ComicButton>
          </ComicCard>
        );
      })}

      <ComicButton type="button" variant="accent" onClick={addUploadTask}>
        + Add upload task
      </ComicButton>

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
                onChange={(event) => updateByKey(speaking.clientKey, { enabled: event.target.checked })}
              />
              Enabled
            </label>
          </div>
          <label className="font-bold text-[var(--comic-dark)] flex items-center gap-2">
            <input
              type="checkbox"
              checked={speaking.required}
              onChange={(event) => updateByKey(speaking.clientKey, { required: event.target.checked })}
            />
            Required
          </label>
          <textarea
            className="w-full comic-textarea min-h-24"
            placeholder="Talk about your dream city for 1–2 minutes."
            value={speaking.instructions}
            onChange={(event) => updateByKey(speaking.clientKey, { instructions: event.target.value })}
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
                  updateByKey(speaking.clientKey, {
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
                  updateByKey(speaking.clientKey, {
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
              updateByKey(speaking.clientKey, {
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
                updateByKey(speaking.clientKey, {
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
                updateByKey(speaking.clientKey, {
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
