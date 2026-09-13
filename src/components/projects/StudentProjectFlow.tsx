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
  asSpeakingSettings,
  asUploadTaskSettings,
  componentDisplayTitle,
  formatProjectHeaderMeta,
  formatSubmissionGroupLabel,
  getComponentUploadFiles,
  isUploadTaskType,
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

function sentViaLine(row: ProjectComponentSubmission | null): boolean {
  return Boolean(row?.extra?.sent_via_line);
}

function OpenClassLineButton({
  url,
  onSent,
}: {
  url: string;
  onSent?: () => void;
}) {
  if (!url) return null;
  return (
    <button
      type="button"
      className="comic-button flex w-full items-stretch overflow-hidden p-0 text-base text-white"
      style={{ backgroundColor: '#06C755' }}
      onClick={() => {
        window.open(url, '_blank', 'noopener,noreferrer');
        onSent?.();
      }}
    >
      <span
        className="flex w-14 shrink-0 items-center justify-center self-stretch"
        aria-hidden
      >
        <FontAwesomeIcon
          icon={faLine}
          className="block text-white"
          style={{
            width: '2.75rem',
            height: '2.75rem',
            fontSize: '2.75rem',
            color: '#ffffff',
          }}
        />
      </span>
      <span className="flex flex-1 items-center justify-center px-3 py-2">Send!</span>
    </button>
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
  const [uploadMethods, setUploadMethods] = useState<Record<string, 'upload' | 'camera' | ''>>({});
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number } | null>(null);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const entryConfig = project?.entry_config ?? getDefaultEntryConfig();
  const sortedClasses = useMemo(
    () => sortSpeakClassOptions(entryConfig.classes),
    [entryConfig.classes]
  );
  const usesClassDropdown = sortedClasses.length > 0;
  const usesStudentLetter = entryConfig.student_letter_enabled;
  const classLineGroupUrl = classLineGroupUrlForStudent(sortedClasses, classNumber);

  const uploadTasks = (project?.components ?? []).filter((item) => isUploadTaskType(item.type));
  const speaking = project?.components.find((item) => item.type === 'speaking');
  const speakingSettings = speaking ? asSpeakingSettings(speaking.settings) : null;
  const speakingRow = rowFor(speaking, submission);
  const locked =
    !preview &&
    Boolean(submission && submission.status !== 'in_progress' && !project?.allow_resubmission);
  const finalSubmissionEnabled = project?.final_submission_enabled !== false;
  const projectProgressEnabled = project?.project_progress_enabled !== false;
  const hasSuccessfulUpload = uploadTasks.some(
    (task) => getComponentUploadFiles(rowFor(task, submission)).length > 0
  );
  const showFinalSubmission =
    finalSubmissionEnabled || hasSuccessfulUpload || Boolean(submission && submission.status !== 'in_progress');
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
      setUploadMethods({});
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

  async function uploadStudentFile(
    kind: 'upload' | 'audio',
    file: Blob,
    componentId: string,
    extra?: FormData
  ) {
    if (preview) return;
    const formData = extra ?? new FormData();
    formData.append('file', file, kind === 'audio' ? 'recording.webm' : file instanceof File ? file.name : kind);
    formData.append('kind', kind);
    formData.append('student_name', studentName);
    formData.append('student_number', studentNumber);
    formData.append('class_number', classNumber);
    formData.append('component_id', componentId);
    const response = await fetch(`/api/projects/public/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    setSubmission(data.submission);
  }

  async function handleUploadTaskFiles(
    componentId: string,
    selected: FileList | File[],
    remainingSlots: number,
    maxUploads: number
  ) {
    if (locked || preview || remainingSlots <= 0) return;
    const selectedFiles = Array.from(selected);
    if (selectedFiles.length === 0) return;
    const files = selectedFiles.slice(0, remainingSlots);
    setBusy(`upload-${componentId}`);
    setError(
      selectedFiles.length > remainingSlots
        ? `You can upload up to ${maxUploads} file${maxUploads === 1 ? '' : 's'}. Only the first ${remainingSlots} will be used.`
        : ''
    );
    try {
      for (const file of files) {
        await uploadStudentFile('upload', file, componentId);
      }
      setUploadMethods((current) => ({ ...current, [componentId]: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setBusy('');
    }
  }

  async function handleRemoveUploadFile(componentId: string, fileKeyOrUrl: string) {
    if (locked || preview || !submission) return;
    setBusy(`remove-file-${componentId}`);
    setError('');
    try {
      await saveComponent({
        component_id: componentId,
        remove_file_key: fileKeyOrUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove file');
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
      await uploadStudentFile('audio', pendingAudio.blob, speaking.id, formData);
      setSpeakingMethod('online');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
    } finally {
      setBusy('');
    }
  }

  async function handleSendInLine(componentId: string) {
    if (preview || locked || !submission) return;
    try {
      await saveComponent({ component_id: componentId, sent_via_line: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save LINE progress');
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
        {project?.worksheet_file?.url ? (
          <ComicText className="comic-text-white">
            <a
              href={project.worksheet_file.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-[0.2em] decoration-2"
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
                      {member.class_number ? ` · ${member.class_number}` : ''}
                    </li>
                  ))}
                </ul>
              </ComicCard>
            ) : null}

            {projectProgressEnabled ? (
              <ComicCard className="comic-shadow-xl">
                <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
                  Project progress
                </ComicTitle>
                <ul className="space-y-2">
                  {progressItems.map((item) => (
                    <li key={item.id} className="font-bold text-[var(--comic-dark)]">
                      {statusFor(item, submission) ? '✓' : '○'} {componentDisplayTitle(item)}
                    </li>
                  ))}
                  {showFinalSubmission ? (
                    <li className="font-bold text-[var(--comic-dark)]">
                      {submitted ? '✓' : '○'} Submit
                    </li>
                  ) : null}
                </ul>
              </ComicCard>
            ) : null}

            {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

            {uploadTasks.map((task) => {
              const settings = asUploadTaskSettings(task.settings, componentDisplayTitle(task));
              const row = rowFor(task, submission);
              const uploadedFiles = getComponentUploadFiles(row);
              const method = uploadMethods[task.id] ?? '';
              const taskBusy = busy === `upload-${task.id}` || busy === `remove-file-${task.id}`;
              const remainingSlots = Math.max(0, settings.max_uploads - uploadedFiles.length);
              const canAddMore = remainingSlots > 0;
              const allowMultiSelect = remainingSlots > 1;
              const showUpload = settings.upload_enabled && canAddMore;
              const showCamera = settings.take_photo_enabled && canAddMore;
              const showLine = settings.send_line_enabled && Boolean(classLineGroupUrl);
              const optionCount = [showUpload, showCamera, showLine].filter(Boolean).length;
              const gridClass =
                optionCount >= 3
                  ? 'sm:grid-cols-3'
                  : optionCount === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-1';

              return (
                <ComicCard key={task.id} className="comic-shadow-xl space-y-4">
                  <ComicTitle level={4} className="text-[var(--comic-primary)]">
                    {componentDisplayTitle(task)}
                  </ComicTitle>
                  {task.instructions ? (
                    <ComicText className="text-[var(--comic-dark)]">{task.instructions}</ComicText>
                  ) : null}
                  {settings.example_image_enabled && settings.example_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.example_image.url}
                      alt={`${componentDisplayTitle(task)} example`}
                      className="max-h-56 w-full object-contain rounded-lg comic-border"
                    />
                  ) : null}
                  {uploadedFiles.length > 0 ? (
                    <ul className="space-y-3">
                      {uploadedFiles.map((file, index) => (
                        <li
                          key={`${file.key || file.url}-${index}`}
                          className="space-y-2 rounded-lg comic-border bg-white p-3"
                        >
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block font-bold text-[var(--comic-secondary)] underline"
                          >
                            {file.file_name || `Upload ${index + 1}`}
                          </a>
                          {file.content_type?.startsWith('image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.file_name || `Upload ${index + 1}`}
                              className="max-h-56 w-full object-contain rounded-lg"
                            />
                          ) : null}
                          {!locked ? (
                            <ComicButton
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={preview || taskBusy}
                              onClick={() =>
                                void handleRemoveUploadFile(task.id, file.key || file.url)
                              }
                            >
                              {busy === `remove-file-${task.id}` ? 'Removing…' : 'Remove'}
                            </ComicButton>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {!locked ? (
                    <>
                      {showUpload ? (
                        <input
                          ref={(element) => {
                            uploadInputRefs.current[task.id] = element;
                          }}
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          multiple={allowMultiSelect}
                          className="hidden"
                          onChange={(event) => {
                            const files = event.target.files;
                            if (files?.length) {
                              void handleUploadTaskFiles(
                                task.id,
                                files,
                                remainingSlots,
                                settings.max_uploads
                              );
                            }
                            event.target.value = '';
                          }}
                        />
                      ) : null}
                      {optionCount > 0 ? (
                        <div className={`grid gap-3 ${gridClass}`}>
                          {showUpload ? (
                            <ComicButton
                              variant={method === 'upload' ? 'primary' : 'secondary'}
                              size="sm"
                              className="w-full"
                              disabled={preview || taskBusy}
                              onClick={() => {
                                setUploadMethods((current) => ({
                                  ...current,
                                  [task.id]: 'upload',
                                }));
                                uploadInputRefs.current[task.id]?.click();
                              }}
                            >
                              {taskBusy && method === 'upload' ? 'Uploading…' : 'Upload'}
                            </ComicButton>
                          ) : null}
                          {showCamera ? (
                            <ComicButton
                              variant={method === 'camera' ? 'primary' : 'secondary'}
                              size="sm"
                              className="w-full"
                              disabled={preview || taskBusy}
                              onClick={() =>
                                setUploadMethods((current) => ({
                                  ...current,
                                  [task.id]: 'camera',
                                }))
                              }
                            >
                              Take a photo
                            </ComicButton>
                          ) : null}
                          {showLine ? (
                            <OpenClassLineButton
                              url={classLineGroupUrl}
                              onSent={() => void handleSendInLine(task.id)}
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {showCamera && method === 'camera' ? (
                        <ArtworkCamera
                          disabled={preview || taskBusy}
                          onCapture={(file) =>
                            void handleUploadTaskFiles(
                              task.id,
                              [file],
                              remainingSlots,
                              settings.max_uploads
                            )
                          }
                          onClose={() =>
                            setUploadMethods((current) => ({ ...current, [task.id]: '' }))
                          }
                        />
                      ) : null}
                    </>
                  ) : showLine ? (
                    <OpenClassLineButton url={classLineGroupUrl} />
                  ) : null}
                </ComicCard>
              );
            })}

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

            {showFinalSubmission ? (
              <ComicCard className="comic-shadow-xl space-y-4">
                <ComicTitle level={4} className="text-[var(--comic-secondary)]">
                  Final submission
                </ComicTitle>
                <ul className="space-y-2">
                  {progressItems.map((item) => {
                    const row = rowFor(item, submission);
                    return (
                      <li key={`final-${item.id}`} className="font-bold text-[var(--comic-dark)]">
                        {statusFor(item, submission) ? '✓' : '○'} {componentDisplayTitle(item)}
                        {item.type === 'speaking' && speakingRow?.text_data === 'in_person'
                          ? ' (in-person)'
                          : item.type === 'speaking' && speakingRow?.audio_url
                            ? ' (recording)'
                            : isUploadTaskType(item.type) &&
                                sentViaLine(row) &&
                                getComponentUploadFiles(row).length === 0
                              ? ' (LINE)'
                              : ''}
                      </li>
                    );
                  })}
                </ul>
                {submitted ? (
                  <ComicText className="text-[var(--comic-success)] font-bold">
                    Thank you for your submission!
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
                  <button
                    type="button"
                    className="project-remove-button mt-1 text-sm font-bold text-[var(--comic-dark)]/60 underline underline-offset-2 hover:text-[var(--comic-danger)] disabled:opacity-50"
                    disabled={busy === 'remove'}
                    onClick={() => void handleRemoveSubmission()}
                  >
                    {busy === 'remove' ? 'Removing…' : 'Remove submission'}
                  </button>
                ) : null}
              </ComicCard>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  );
}
