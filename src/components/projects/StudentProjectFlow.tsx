'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import ComicAudioPlayer from '../ComicAudioPlayer';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import ArtworkCamera from './ArtworkCamera';
import ProjectRecorder from './ProjectRecorder';
import StudentGroupIdentity, {
  emptyIdentityDraft,
  resolveIdentityMembers,
  type IdentityDraft,
} from './StudentGroupIdentity';
import {
  PROJECT_COMPONENT_LABELS,
  asArtworkSettings,
  asSpeakingSettings,
  asWorksheetSettings,
  formatProjectDateTime,
  formatProjectHeaderMeta,
  formatSubmissionGroupLabel,
  type ProjectComponentSubmission,
  type ProjectSubmissionWithComponents,
  type PublicProject,
  type PublicProjectComponent,
  type SpeakingMethod,
} from '@/lib/projects/types';
import {
  getDefaultEntryConfig,
  sortSpeakClassOptions,
  type SpeakClassOption,
} from '@/lib/speak-and-submit/types';

type Step = 'loading' | 'identity' | 'project' | 'error';

interface SavedProjectIdentity {
  student_name: string;
  student_number: string;
  class_number: string;
}

interface StudentProjectFlowProps {
  projectId: string;
  preview?: boolean;
  headerAction?: ReactNode;
}

function statusFor(
  component: PublicProjectComponent,
  submission: ProjectSubmissionWithComponents | null
): boolean {
  return (
    submission?.components.find((item) => item.component_id === component.id)?.status === 'complete'
  );
}

function rowFor(
  component: PublicProjectComponent | undefined,
  submission: ProjectSubmissionWithComponents | null
): ProjectComponentSubmission | null {
  if (!component || !submission) return null;
  return submission.components.find((item) => item.component_id === component.id) ?? null;
}

function getOpenableLineGroupUrl(value: string): string {
  const url = value.trim();
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function classLineGroupUrlForStudent(
  classes: SpeakClassOption[],
  classNumber: string
): string {
  const wanted = classNumber.trim().toLowerCase();
  if (!wanted) return '';
  const match = classes.find((item) => item.label.trim().toLowerCase() === wanted);
  return getOpenableLineGroupUrl(match?.line_group_url ?? '');
}

function OpenClassLineButton({ url }: { url: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="comic-button inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-base text-white no-underline"
      style={{ backgroundColor: '#06C755' }}
    >
      <FontAwesomeIcon icon={faLine} aria-hidden className="h-[1.1em] w-[1.1em]" />
      Send in LINE
    </a>
  );
}

export default function StudentProjectFlow({
  projectId,
  preview = false,
  headerAction,
}: StudentProjectFlowProps) {
  const [step, setStep] = useState<Step>('loading');
  const [project, setProject] = useState<PublicProject | null>(null);
  const [submission, setSubmission] = useState<ProjectSubmissionWithComponents | null>(null);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState(preview ? 'Preview student' : '');
  const [studentNumber, setStudentNumber] = useState(preview ? '1' : '');
  const [classNumber, setClassNumber] = useState('');
  const [memberDrafts, setMemberDrafts] = useState<IdentityDraft[]>([emptyIdentityDraft()]);
  const [checkingIdentity, setCheckingIdentity] = useState(false);
  const [busy, setBusy] = useState('');
  const [speakingMethod, setSpeakingMethod] = useState<SpeakingMethod | ''>('');
  const [artworkMethod, setArtworkMethod] = useState<'upload' | 'camera' | ''>('');
  const [worksheetMethod, setWorksheetMethod] = useState<'upload' | 'camera' | ''>('');
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const worksheetUploadRef = useRef<HTMLInputElement>(null);

  const entryConfig = project?.entry_config ?? getDefaultEntryConfig();
  const sortedClasses = useMemo(
    () => sortSpeakClassOptions(entryConfig.classes),
    [entryConfig.classes]
  );
  const usesClassDropdown = sortedClasses.length > 0;
  const usesStudentLetter = entryConfig.student_letter_enabled;
  const classLineGroupUrl = classLineGroupUrlForStudent(sortedClasses, classNumber);

  const worksheet = project?.components.find((item) => item.type === 'worksheet');
  const artwork = project?.components.find((item) => item.type === 'artwork');
  const speaking = project?.components.find((item) => item.type === 'speaking');
  const worksheetSettings = worksheet ? asWorksheetSettings(worksheet.settings) : null;
  const artworkSettings = artwork ? asArtworkSettings(artwork.settings) : null;
  const speakingSettings = speaking ? asSpeakingSettings(speaking.settings) : null;
  const worksheetRow = rowFor(worksheet, submission);
  const artworkRow = rowFor(artwork, submission);
  const speakingRow = rowFor(speaking, submission);
  const locked =
    !preview &&
    Boolean(submission && submission.status !== 'in_progress' && !project?.allow_resubmission);
  const requiredReady = Boolean(
    project &&
      submission &&
      project.components
        .filter((item) => item.required)
        .every((item) => statusFor(item, submission))
  );

  useEffect(() => {
    const url = preview
      ? `/api/projects/${projectId}/preview`
      : `/api/projects/public/${projectId}`;
    fetch(url, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!data.project) {
          setError(data.error || 'This project could not be found.');
          setStep('error');
          return;
        }
        setProject(data.project);
        if (data.project.entry_config?.classes?.length > 0) {
          const classes = sortSpeakClassOptions(data.project.entry_config.classes);
          setMemberDrafts((current) =>
            current.map((draft) => ({
              ...draft,
              selectedClassId: draft.selectedClassId || classes[0].id,
            }))
          );
          if (preview) setClassNumber(classes[0].label);
        } else if (preview) {
          setClassNumber(data.project.class_label || 'Preview');
        }
        setStep(preview ? 'project' : 'identity');
      })
      .catch(() => {
        setError('Unable to load this project.');
        setStep('error');
      });
  }, [preview, projectId]);

  function applySubmission(
    next: ProjectSubmissionWithComponents,
    identity: SavedProjectIdentity
  ) {
    setStudentName(identity.student_name || next.student_name);
    setStudentNumber(identity.student_number);
    setClassNumber(identity.class_number);
    setSubmission(next);
    const existingMethod = next.components.find(
      (item) => item.text_data === 'in_person' || item.audio_url
    );
    if (existingMethod?.text_data === 'in_person') setSpeakingMethod('in_person');
    if (existingMethod?.audio_url) setSpeakingMethod('online');
    setStep('project');
  }

  async function openSubmission(
    idOrSlug: string,
    identity: SavedProjectIdentity,
    members?: Array<{ student_name: string; student_number: string; class_number: string }>
  ): Promise<boolean> {
    const response = await fetch(`/api/projects/public/${idOrSlug}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        members && members.length > 0
          ? { members }
          : {
              student_name: identity.student_name,
              student_number: identity.student_number,
              class_number: identity.class_number,
            }
      ),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Unable to open this project.');
      return false;
    }
    applySubmission(data.submission, identity);
    return true;
  }

  async function handleContinueIdentity() {
    if (!project) return;
    const resolved = resolveIdentityMembers(memberDrafts, {
      entryConfig,
      sortedClasses,
      usesClassDropdown,
      usesStudentLetter,
    });
    if ('error' in resolved) {
      setError(resolved.error);
      return;
    }

    const primary = resolved.members[0];
    setCheckingIdentity(true);
    setError('');
    try {
      const opened = await openSubmission(
        projectId,
        {
          student_name: primary.student_name,
          student_number: primary.student_number,
          class_number: primary.class_number,
        },
        resolved.members
      );
      if (!opened) return;
    } catch {
      setError('Unable to start this project. Please try again.');
    } finally {
      setCheckingIdentity(false);
    }
  }

  async function handleRemoveSubmission() {
    if (preview || !submission) return;
    const label = formatSubmissionGroupLabel(submission);
    const confirmed = window.confirm(
      `Remove this submission${label ? ` for ${label}` : ''}?\n\nYou can start the project again.`
    );
    if (!confirmed) return;

    setBusy('remove');
    setError('');
    try {
      const response = await fetch(`/api/projects/public/${projectId}/submission`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber,
          class_number: classNumber,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Failed to remove submission.');
        return;
      }
      setSubmission(null);
      setArtworkMethod('');
      setWorksheetMethod('');
      setSpeakingMethod('');
      setPendingAudio(null);
      setStep('identity');
    } catch {
      setError('Failed to remove submission.');
    } finally {
      setBusy('');
    }
  }

  async function saveComponent(payload: Record<string, unknown>) {
    if (preview || !project) return;
    const response = await fetch(`/api/projects/public/${projectId}/component`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_number: studentNumber,
        class_number: classNumber,
        ...payload,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save progress');
    setSubmission(data.submission);
  }

  async function uploadStudentFile(kind: 'worksheet' | 'artwork' | 'audio', file: Blob, extra?: FormData) {
    if (preview) return;
    const formData = extra ?? new FormData();
    formData.append('file', file, kind === 'audio' ? 'recording.webm' : file instanceof File ? file.name : kind);
    formData.append('kind', kind);
    formData.append('student_name', studentName);
    formData.append('student_number', studentNumber);
    formData.append('class_number', classNumber);
    const componentId =
      kind === 'worksheet' ? worksheet?.id : kind === 'artwork' ? artwork?.id : speaking?.id;
    if (!componentId) throw new Error('Component not found');
    formData.append('component_id', componentId);
    const response = await fetch(`/api/projects/public/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    setSubmission(data.submission);
  }

  async function markWorksheetOpened() {
    if (preview || locked || !submission || !worksheet) return;
    setBusy('worksheet');
    setError('');
    try {
      await saveComponent({ component_id: worksheet.id, viewed: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save worksheet progress');
    } finally {
      setBusy('');
    }
  }

  async function handleArtworkUpload(file: File) {
    if (locked || preview || !artwork) return;
    setBusy('artwork');
    setError('');
    try {
      await uploadStudentFile('artwork', file);
      setArtworkMethod('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload artwork');
    } finally {
      setBusy('');
    }
  }

  async function handleWorksheetUpload(file: File) {
    if (locked || preview || !worksheet) return;
    setBusy('worksheet-upload');
    setError('');
    try {
      await uploadStudentFile('worksheet', file);
      setWorksheetMethod('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload worksheet');
    } finally {
      setBusy('');
    }
  }

  async function handleChooseInPerson() {
    if (locked || preview || !speaking) return;
    setBusy('speaking');
    setError('');
    try {
      await saveComponent({
        component_id: speaking.id,
        speaking_method: 'in_person',
        clear_audio: true,
      });
      setSpeakingMethod('in_person');
      setPendingAudio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save speaking choice');
    } finally {
      setBusy('');
    }
  }

  async function handleSaveRecording() {
    if (locked || preview || !speaking || !pendingAudio) return;
    setBusy('speaking');
    setError('');
    try {
      const formData = new FormData();
      formData.append('duration_seconds', String(pendingAudio.duration));
      await uploadStudentFile('audio', pendingAudio.blob, formData);
      setSpeakingMethod('online');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setBusy('');
    }
  }

  async function handleSubmitProject() {
    if (locked || preview || !requiredReady) return;
    setBusy('submit');
    setError('');
    try {
      const response = await fetch(`/api/projects/public/${projectId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: studentNumber,
          class_number: classNumber,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit project');
      setSubmission(data.submission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project');
    } finally {
      setBusy('');
    }
  }

  const progressItems = project?.components ?? [];
  const submitted = submission?.status === 'submitted' || submission?.status === 'reviewed';

  return (
    <div className="student-project-page min-h-screen bg-[var(--comic-light)]">
      <section className="comic-bg-secondary py-10 px-4 comic-pattern-dots text-center">
        <ComicTitle level={2} className="comic-title-no-shadow comic-text-white mb-2">
          <span className="inline-flex items-center justify-center gap-3">
            <FontAwesomeIcon icon={faFolderOpen} aria-hidden className="h-[0.85em] w-[0.85em]" />
            <span>{project?.title || 'Project'}</span>
          </span>
        </ComicTitle>
        {worksheetSettings?.file?.url ? (
          <ComicText className="comic-text-white">
            <a
              href={worksheetSettings.file.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-[0.2em] decoration-2"
              onClick={() => void markWorksheetOpened()}
            >
              Open worksheet
            </a>
          </ComicText>
        ) : null}
        {project && formatProjectHeaderMeta(project) ? (
          <ComicText className="comic-text-white mt-2">{formatProjectHeaderMeta(project)}</ComicText>
        ) : null}
      </section>

      {headerAction ? (
        <div className="max-w-3xl mx-auto px-4 pt-4">{headerAction}</div>
      ) : null}

      <section className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {preview ? (
          <ComicCard className="comic-shadow-xl">
            <ComicText className="text-[var(--comic-secondary)] font-bold">
              Teacher preview — students see this after you publish. Uploads and submit stay off here.
            </ComicText>
          </ComicCard>
        ) : null}

        {step === 'loading' ? (
          <ComicText className="text-[var(--comic-dark)] font-bold">Loading project…</ComicText>
        ) : null}

        {step === 'error' ? (
          <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText>
        ) : null}

        {step === 'identity' && project ? (
          <StudentGroupIdentity
            drafts={memberDrafts}
            onChange={setMemberDrafts}
            entryConfig={entryConfig}
            sortedClasses={sortedClasses}
            usesClassDropdown={usesClassDropdown}
            usesStudentLetter={usesStudentLetter}
            error={error}
            checking={checkingIdentity}
            onContinue={() => void handleContinueIdentity()}
          />
        ) : null}

        {step === 'project' && project ? (
          <>
            {submitted ? (
              <ComicCard className="comic-shadow-xl text-center">
                <ComicTitle level={3} className="mb-2 text-[var(--comic-success)]">
                  Project submitted
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)] font-bold">
                  Submitted on {formatProjectDateTime(submission?.submitted_at ?? null)}
                </ComicText>
                {submission?.status === 'reviewed' && submission.teacher_feedback ? (
                  <ComicText className="text-[var(--comic-dark)] mt-3">
                    Teacher feedback: {submission.teacher_feedback}
                  </ComicText>
                ) : null}
              </ComicCard>
            ) : null}

            {submission && (submission.members?.length ?? 1) > 1 ? (
              <ComicCard className="comic-shadow-xl">
                <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
                  Group:
                </ComicTitle>
                <ul className="space-y-2">
                  {(submission.members ?? []).map((member) => (
                    <li
                      key={`${member.class_number}-${member.student_number}`}
                      className="font-bold text-[var(--comic-dark)]"
                    >
                      {member.student_number} {member.student_name}
                    </li>
                  ))}
                </ul>
              </ComicCard>
            ) : null}

            <ComicCard className="comic-shadow-xl">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
                Project progress
              </ComicTitle>
              <ul className="space-y-2">
                {progressItems.map((item) => (
                  <li key={item.id} className="font-bold text-[var(--comic-dark)]">
                    {statusFor(item, submission) ? '✓' : '○'} {PROJECT_COMPONENT_LABELS[item.type]}
                    {item.required ? '' : ' (optional)'}
                  </li>
                ))}
                <li className="font-bold text-[var(--comic-dark)]">
                  {submitted ? '✓' : '○'} Submit
                </li>
              </ul>
            </ComicCard>

            {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

            {worksheet ? (
              <ComicCard className="comic-shadow-xl space-y-4">
                <ComicTitle level={4} className="text-[var(--comic-primary)]">
                  Worksheet
                </ComicTitle>
                {!locked ? (
                  <>
                    <ComicText className="text-[var(--comic-dark)]">
                      Upload completed worksheet
                    </ComicText>
                    <input
                      ref={worksheetUploadRef}
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleWorksheetUpload(file);
                        event.target.value = '';
                      }}
                    />
                    <div
                      className={`grid gap-3 ${
                        classLineGroupUrl ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      }`}
                    >
                      <ComicButton
                        variant={worksheetMethod === 'upload' ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full"
                        disabled={preview || busy === 'worksheet-upload'}
                        onClick={() => {
                          setWorksheetMethod('upload');
                          worksheetUploadRef.current?.click();
                        }}
                      >
                        {busy === 'worksheet-upload' && worksheetMethod === 'upload'
                          ? 'Uploading…'
                          : 'Upload'}
                      </ComicButton>
                      <ComicButton
                        variant={worksheetMethod === 'camera' ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full"
                        disabled={preview || busy === 'worksheet-upload'}
                        onClick={() => setWorksheetMethod('camera')}
                      >
                        Take a photo
                      </ComicButton>
                      <OpenClassLineButton url={classLineGroupUrl} />
                    </div>
                    {worksheetMethod === 'camera' ? (
                      <ArtworkCamera
                        disabled={preview || busy === 'worksheet-upload'}
                        onCapture={(file) => void handleWorksheetUpload(file)}
                        onClose={() => setWorksheetMethod('')}
                      />
                    ) : null}
                  </>
                ) : (
                  <OpenClassLineButton url={classLineGroupUrl} />
                )}
                {worksheetRow?.file_url ? (
                  <a
                    href={worksheetRow.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-bold text-[var(--comic-secondary)] underline"
                  >
                    View your uploaded worksheet
                  </a>
                ) : null}
              </ComicCard>
            ) : null}

            {artwork ? (
              <ComicCard className="comic-shadow-xl space-y-4">
                <ComicTitle level={4} className="text-[var(--comic-primary)]">
                  Artwork
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)]">
                  {artwork.instructions || 'Create your artwork and upload a photo.'}
                </ComicText>
                {artworkSettings?.example_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artworkSettings.example_image.url}
                    alt="Artwork example"
                    className="max-h-56 w-full object-contain rounded-lg comic-border"
                  />
                ) : null}
                {artworkRow?.file_url ? (
                  <>
                    <ComicText className="text-[var(--comic-success)] font-bold">
                      ✓ Artwork uploaded
                    </ComicText>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artworkRow.file_url}
                      alt="Your artwork"
                      className="max-h-72 w-full object-contain rounded-lg comic-border"
                    />
                  </>
                ) : null}
                {!locked ? (
                  <>
                    <input
                      ref={artworkInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleArtworkUpload(file);
                        event.target.value = '';
                      }}
                    />
                    <div
                      className={`grid gap-3 ${
                        classLineGroupUrl ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                      }`}
                    >
                      <ComicButton
                        variant={artworkMethod === 'upload' ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full"
                        disabled={preview || busy === 'artwork'}
                        onClick={() => {
                          setArtworkMethod('upload');
                          artworkInputRef.current?.click();
                        }}
                      >
                        {busy === 'artwork' && artworkMethod === 'upload' ? 'Uploading…' : 'Upload'}
                      </ComicButton>
                      <ComicButton
                        variant={artworkMethod === 'camera' ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full"
                        disabled={preview || busy === 'artwork'}
                        onClick={() => setArtworkMethod('camera')}
                      >
                        Take a photo
                      </ComicButton>
                      <OpenClassLineButton url={classLineGroupUrl} />
                    </div>
                    {artworkMethod === 'camera' ? (
                      <ArtworkCamera
                        disabled={preview || busy === 'artwork'}
                        onCapture={(file) => void handleArtworkUpload(file)}
                        onClose={() => setArtworkMethod('')}
                      />
                    ) : null}
                  </>
                ) : (
                  <OpenClassLineButton url={classLineGroupUrl} />
                )}
              </ComicCard>
            ) : null}

            {speaking && speakingSettings ? (
              <ComicCard className="comic-shadow-xl space-y-4">
                <ComicTitle level={4} className="text-[var(--comic-primary)]">
                  Speaking
                </ComicTitle>
                <ComicText className="text-[var(--comic-dark)]">
                  {speaking.instructions || 'Practice your presentation.'}
                </ComicText>
                {speakingSettings.prompts.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 font-bold text-[var(--comic-dark)]">
                    {speakingSettings.prompts.map((prompt, index) => (
                      <li key={`${index}-${prompt}`}>{prompt}</li>
                    ))}
                  </ul>
                ) : null}

                {speakingSettings.online_recording_enabled && speakingSettings.in_person_enabled && !locked ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <ComicButton
                      variant={speakingMethod === 'online' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full"
                      disabled={preview}
                      onClick={() => setSpeakingMethod('online')}
                    >
                      Online recording
                    </ComicButton>
                    <ComicButton
                      variant={speakingMethod === 'in_person' ? 'primary' : 'secondary'}
                      size="sm"
                      className="w-full"
                      disabled={preview || busy === 'speaking'}
                      onClick={() => void handleChooseInPerson()}
                    >
                      In-person presentation
                    </ComicButton>
                  </div>
                ) : null}

                {(speakingMethod === 'in_person' ||
                  (!speakingSettings.online_recording_enabled && speakingSettings.in_person_enabled) ||
                  speakingRow?.text_data === 'in_person') && (
                  <div className="space-y-3">
                    <ComicText className="text-[var(--comic-dark)]">
                      You will present this project in class.
                    </ComicText>
                    {speakingRow?.text_data === 'in_person' ? (
                      <ComicText className="text-[var(--comic-success)] font-bold">
                        ✓ In-person presentation selected
                      </ComicText>
                    ) : !locked && !speakingSettings.online_recording_enabled ? (
                      <ComicButton
                        variant="secondary"
                        className="w-full"
                        disabled={preview || busy === 'speaking'}
                        onClick={() => void handleChooseInPerson()}
                      >
                        I will present in person
                      </ComicButton>
                    ) : null}
                  </div>
                )}

                {(speakingSettings.online_recording_enabled &&
                  (speakingMethod === 'online' ||
                    !speakingSettings.in_person_enabled ||
                    Boolean(speakingRow?.audio_url))) && (
                  <div className="space-y-3">
                    {speakingRow?.audio_url ? (
                      <>
                        <ComicText className="text-[var(--comic-success)] font-bold">
                          ✓ Speaking submitted
                        </ComicText>
                        <ComicAudioPlayer src={speakingRow.audio_url} />
                      </>
                    ) : null}
                    {!locked ? (
                      <>
                        <ProjectRecorder
                          minSeconds={speakingSettings.min_seconds}
                          maxSeconds={speakingSettings.max_seconds}
                          disabled={preview || busy === 'speaking'}
                          onReady={(blob, duration) => setPendingAudio({ blob, duration })}
                          onClear={() => setPendingAudio(null)}
                        />
                        {pendingAudio ? (
                          <ComicButton
                            variant="success"
                            className="w-full"
                            disabled={preview || busy === 'speaking'}
                            onClick={() => void handleSaveRecording()}
                          >
                            {busy === 'speaking' ? 'Saving…' : 'Save recording'}
                          </ComicButton>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                )}
              </ComicCard>
            ) : null}

            <ComicCard className="comic-shadow-xl space-y-4">
              <ComicTitle level={4} className="text-[var(--comic-secondary)]">
                Final submission
              </ComicTitle>
              <ul className="space-y-2">
                {progressItems.map((item) => (
                  <li key={`final-${item.id}`} className="font-bold text-[var(--comic-dark)]">
                    {statusFor(item, submission) ? '✓' : '○'} {PROJECT_COMPONENT_LABELS[item.type]}
                    {item.type === 'speaking' && speakingRow?.text_data === 'in_person'
                      ? ' (in-person)'
                      : item.type === 'speaking' && speakingRow?.audio_url
                        ? ' (recording)'
                        : ''}
                  </li>
                ))}
              </ul>
              {submitted ? (
                <ComicText className="text-[var(--comic-success)] font-bold">
                  This project is locked after submission.
                </ComicText>
              ) : (
                <ComicButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={!requiredReady || preview || Boolean(busy)}
                  onClick={() => void handleSubmitProject()}
                >
                  {busy === 'submit' ? 'Submitting…' : 'Submit project'}
                </ComicButton>
              )}
              {!preview ? (
                <ComicButton
                  variant="danger"
                  size="lg"
                  className="project-remove-button w-full"
                  disabled={busy === 'remove'}
                  onClick={() => void handleRemoveSubmission()}
                >
                  {busy === 'remove' ? 'Removing…' : 'Remove submission'}
                </ComicButton>
              ) : null}
            </ComicCard>
          </>
        ) : null}
      </section>
    </div>
  );
}
