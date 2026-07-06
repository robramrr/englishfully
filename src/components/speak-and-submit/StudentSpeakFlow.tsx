'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import ComicAudioPlayer from '../ComicAudioPlayer';
import type { ItemTaskType, PublicTask } from '@/lib/speak-and-submit/types';
import {
  STUDENT_LETTER_OPTIONS,
  STUDENT_TASK_TYPE_LABELS,
  buildStudentRecordingItems,
  getDefaultEntryConfig,
  getPromptSectionsNeedingChoice,
  groupTaskItemsBySection,
  sortSpeakClassOptions,
} from '@/lib/speak-and-submit/types';

type Step = 'loading' | 'identity' | 'choose_prompt' | 'record' | 'submitting' | 'done' | 'error';

interface RecordingState {
  task_item_id: string;
  blob: Blob | null;
  audioUrl: string | null;
  duration_seconds: number;
  uploadedUrl: string | null;
}

interface StudentSpeakFlowProps {
  taskId: string;
}

interface PromptOptionDisplayProps {
  content: string;
  optionLabel?: string;
  rules?: string | null;
  example?: string | null;
  className?: string;
}

function PromptOptionDisplay({
  content,
  optionLabel,
  rules,
  example,
  className = '',
}: PromptOptionDisplayProps) {
  return (
    <div className={`student-prompt-option space-y-1 leading-snug ${className}`}>
      <p className="flex items-baseline justify-between gap-3 text-[var(--comic-dark)]">
        <span className="student-prompt-title">{content}</span>
        {optionLabel ? (
          <span className="student-prompt-option-label shrink-0 text-[var(--comic-secondary)] whitespace-nowrap">
            {optionLabel}
          </span>
        ) : null}
      </p>
      {rules ? (
        <p className="student-prompt-rules text-[var(--comic-dark)]">
          <span className="text-[var(--comic-secondary)] font-bold">Rules: </span>
          {rules}
        </p>
      ) : null}
      {example ? (
        <p className="student-prompt-example text-[var(--comic-dark)] italic">
          <span className="text-[var(--comic-secondary)] not-italic font-bold">Example: </span>
          {example}
        </p>
      ) : null}
    </div>
  );
}

function getSupportedMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function buildRecordingBlob(chunks: Blob[], mimeType: string): Blob {
  return new Blob(chunks, { type: mimeType });
}

async function waitForRecordingBlob(
  chunks: Blob[],
  mimeType: string,
  maxAttempts = 20,
  delayMs = 100
): Promise<Blob | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const blob = buildRecordingBlob(chunks, mimeType);
    if (blob.size > 0) {
      return blob;
    }
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }
  return null;
}

async function uploadRecording(
  taskId: string,
  blob: Blob,
  meta: {
    studentName: string;
    studentNumber: string;
    classNumber: string;
    itemIndex: number;
  }
): Promise<string> {
  if (blob.size === 0) {
    throw new Error('Recording is empty. Please re-record this item.');
  }

  const extension = blob.type.includes('mp4')
    ? 'mp4'
    : blob.type.includes('mpeg')
      ? 'mp3'
      : blob.type.includes('ogg')
        ? 'ogg'
        : 'webm';

  const formData = new FormData();
  formData.append('file', blob, `recording.${extension}`);
  formData.append('student_name', meta.studentName);
  formData.append('student_number', meta.studentNumber);
  formData.append('class_number', meta.classNumber);
  formData.append('item_index', String(meta.itemIndex));

  const response = await fetch(`/api/speak/${taskId}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Audio upload failed');
  }

  return data.url as string;
}

export default function StudentSpeakFlow({ taskId }: StudentSpeakFlowProps) {
  const [step, setStep] = useState<Step>('loading');
  const [task, setTask] = useState<PublicTask | null>(null);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentLetter, setStudentLetter] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [manualClassNumber, setManualClassNumber] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordings, setRecordings] = useState<RecordingState[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const [checkingIdentity, setCheckingIdentity] = useState(false);
  const [promptSelections, setPromptSelections] = useState<Record<number, string>>({});
  const [choosePromptSection, setChoosePromptSection] = useState<number | null>(null);

  const activeItems = useMemo(
    () => buildStudentRecordingItems(task?.items ?? [], promptSelections),
    [task, promptSelections]
  );
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingSessionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const currentIndexRef = useRef(0);

  const currentItem = activeItems[currentIndex];
  const totalItems = activeItems.length;
  const nextUnchosenPromptSection = useMemo(
    () => (task ? getPromptSectionsNeedingChoice(task.items).find((s) => !promptSelections[s]) ?? null : null),
    [task, promptSelections]
  );
  const choosePromptOptions = useMemo(() => {
    if (!task || choosePromptSection === null) return [];
    return task.items.filter(
      (item) => item.item_type === 'prompt' && item.section_index === choosePromptSection
    );
  }, [task, choosePromptSection]);
  const entryConfig = task?.entry_config ?? getDefaultEntryConfig();
  const sortedClasses = useMemo(
    () => sortSpeakClassOptions(entryConfig.classes),
    [entryConfig.classes]
  );
  const usesClassDropdown = sortedClasses.length > 0;
  const usesStudentLetter = entryConfig.student_letter_enabled;
  const selectedClass = useMemo(
    () => sortedClasses.find((item) => item.id === selectedClassId) ?? null,
    [sortedClasses, selectedClassId]
  );
  const maxStudentNumber = selectedClass?.max_student_number ?? 35;
  const studentNumberOptions = useMemo(
    () => Array.from({ length: maxStudentNumber }, (_, index) => String(index + 1)),
    [maxStudentNumber]
  );
  const maxRecordingSeconds =
    currentItem?.max_recording_seconds ?? task?.max_recording_seconds ?? 25;
  const previousItem = currentIndex > 0 ? activeItems[currentIndex - 1] : null;
  const currentItemType: ItemTaskType =
    currentItem?.item_type ??
    (task?.task_type === 'mixed' ? 'single_sentence' : (task?.task_type as ItemTaskType)) ??
    'single_sentence';
  const showSectionHeader =
    currentIndex === 0 || currentItem?.section_index !== previousItem?.section_index;
  const sectionCount = useMemo(
    () => new Set(task?.items.map((item) => item.section_index) ?? []).size,
    [task]
  );

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    fetch(`/api/speak/${taskId}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.task) {
          setError('This speaking task could not be found.');
          setStep('error');
          return;
        }
        setTask({
          ...data.task,
          entry_config: data.task.entry_config ?? getDefaultEntryConfig(),
          items: data.items,
        });
        if (data.task.entry_config?.classes?.length > 0) {
          const classes = sortSpeakClassOptions(data.task.entry_config.classes);
          setSelectedClassId(classes[0].id);
        }
        setStep('identity');
      })
      .catch(() => {
        setError('Unable to load this speaking task.');
        setStep('error');
      });
  }, [taskId]);

  useEffect(() => {
    if (studentNumber && Number.parseInt(studentNumber, 10) > maxStudentNumber) {
      setStudentNumber('');
    }
  }, [maxStudentNumber, studentNumber]);

  function formatStudentNumber(number: string, letter: string): string {
    if (usesStudentLetter && letter) {
      return `${number}${letter}`;
    }
    return number;
  }

  function beginRecording(
    items: PublicTask['items'],
    selections: Record<number, string>,
    preserveRecordings?: RecordingState[]
  ) {
    const queue = buildStudentRecordingItems(items, selections);
    setRecordings(
      queue.map((item) => {
        const existing = preserveRecordings?.find((recording) => recording.task_item_id === item.id);
        return (
          existing ?? {
            task_item_id: item.id,
            blob: null,
            audioUrl: null,
            duration_seconds: 0,
            uploadedUrl: null,
          }
        );
      })
    );
    setStep('record');
  }

  function handleSelectPrompt(itemId: string) {
    if (!task || choosePromptSection === null) return;

    const newSelections = { ...promptSelections, [choosePromptSection]: itemId };
    setPromptSelections(newSelections);
    setChoosePromptSection(null);
    setError('');

    const queue = buildStudentRecordingItems(task.items, newSelections);
    beginRecording(task.items, newSelections, recordings);
    const newIndex = queue.findIndex((item) => item.id === itemId);
    setCurrentIndex(newIndex >= 0 ? newIndex : queue.length - 1);
    setElapsedSeconds(0);
  }

  async function handleContinueIdentity() {
    const resolvedName =
      entryConfig.name_mode === 'first_last'
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : nickname.trim();

    const resolvedClass = usesClassDropdown
      ? selectedClass?.label ?? ''
      : manualClassNumber.trim();

    if (entryConfig.name_mode === 'first_last') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name.');
        return;
      }
    } else if (!nickname.trim()) {
      setError('Please enter your nickname.');
      return;
    }

    if (!studentNumber) {
      setError('Please select your student number.');
      return;
    }

    if (usesStudentLetter && !studentLetter) {
      setError('Please select your student ID (A or B).');
      return;
    }

    if (!resolvedClass) {
      setError(usesClassDropdown ? 'Please select your class.' : 'Please enter your class.');
      return;
    }

    const formattedNumber = formatStudentNumber(studentNumber, studentLetter);

    setCheckingIdentity(true);
    setError('');

    try {
      const response = await fetch(`/api/speak/${taskId}/check-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_number: formattedNumber,
          class_number: resolvedClass,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to verify submission status.');
        return;
      }
      if (data.alreadySubmitted) {
        setError('You have already submitted for this task. Each student number can only submit once.');
        return;
      }
    } catch {
      setError('Unable to verify submission status. Please try again.');
      return;
    } finally {
      setCheckingIdentity(false);
    }

    setStudentName(resolvedName);
    setClassNumber(resolvedClass);
    setStudentNumber(formattedNumber);
    setPromptSelections({});
    setCurrentIndex(0);

    const items = task?.items ?? [];
    const initialQueue = buildStudentRecordingItems(items, {});
    const firstPromptSection = getPromptSectionsNeedingChoice(items)[0] ?? null;

    if (initialQueue.length === 0 && firstPromptSection !== null) {
      setChoosePromptSection(firstPromptSection);
      setStep('choose_prompt');
      return;
    }

    beginRecording(items, {});
  }

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
      recordings.forEach((recording) => {
        if (recording.audioUrl) URL.revokeObjectURL(recording.audioUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const releaseMicStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const acquireFreshMicStream = useCallback(async () => {
    releaseMicStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicDenied(false);
      return stream;
    } catch {
      setMicDenied(true);
      throw new Error('Microphone access is required to complete this homework.');
    }
  }, [releaseMicStream]);

  const clearRecordingTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  async function startRecording() {
    setError('');

    if (mediaRecorderRef.current?.state === 'recording') {
      return;
    }

    const sessionId = recordingSessionRef.current + 1;
    recordingSessionRef.current = sessionId;
    const recordingIndex = currentIndexRef.current;

    try {
      const stream = await acquireFreshMicStream();
      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      const chunks: Blob[] = [];
      const resolvedMimeType = mimeType || recorder.mimeType || 'audio/webm';

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        void (async () => {
          clearRecordingTimer();
          setIsRecording(false);
          mediaRecorderRef.current = null;

          if (sessionId !== recordingSessionRef.current) {
            releaseMicStream();
            return;
          }

          const blob = await waitForRecordingBlob(chunks, resolvedMimeType);

          if (sessionId !== recordingSessionRef.current) {
            releaseMicStream();
            return;
          }

          releaseMicStream();

          if (!blob) {
            setError('Recording failed — no audio was captured. Please try again.');
            return;
          }

          const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          const previewUrl = URL.createObjectURL(blob);

          setRecordings((current) =>
            current.map((recording, index) =>
              index === recordingIndex
                ? {
                    ...recording,
                    blob,
                    audioUrl: previewUrl,
                    duration_seconds: duration,
                    uploadedUrl: null,
                  }
                : recording
            )
          );
          setElapsedSeconds(duration);
        })();
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();

      try {
        recorder.start(250);
      } catch {
        recorder.start();
      }

      setIsRecording(true);
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
        if (elapsed >= maxRecordingSeconds) {
          stopRecording();
        }
      }, 250);
    } catch (err) {
      releaseMicStream();
      setError(err instanceof Error ? err.message : 'Could not start recording.');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 400) {
      setError('Please record for at least half a second before stopping.');
      return;
    }

    recorder.stop();
  }

  function reRecord() {
    recordingSessionRef.current += 1;
    releaseMicStream();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    clearRecordingTimer();
    setIsRecording(false);

    const existing = recordings[currentIndex];
    if (existing?.audioUrl) URL.revokeObjectURL(existing.audioUrl);
    setRecordings((current) =>
      current.map((recording, index) =>
        index === currentIndex
          ? {
              ...recording,
              blob: null,
              audioUrl: null,
              duration_seconds: 0,
              uploadedUrl: null,
            }
          : recording
      )
    );
    setElapsedSeconds(0);
    setError('');
  }

  function goNext() {
    const currentRecording = recordings[currentIndex];
    if (!currentRecording?.blob || currentRecording.blob.size === 0) {
      setError('Please record this item before continuing.');
      return;
    }

    recordingSessionRef.current += 1;
    releaseMicStream();
    mediaRecorderRef.current = null;
    clearRecordingTimer();
    setIsRecording(false);
    setError('');

    if (currentIndex < totalItems - 1) {
      setCurrentIndex((value) => value + 1);
      setElapsedSeconds(0);
      return;
    }

    if (task && nextUnchosenPromptSection !== null) {
      setChoosePromptSection(nextUnchosenPromptSection);
      setStep('choose_prompt');
    }
  }

  async function submitAll() {
    if (recordings.some((recording) => !recording.blob || recording.blob.size === 0)) {
      setError('Please record every item before submitting.');
      return;
    }

    setStep('submitting');
    setError('');

    try {
      const uploaded = await Promise.all(
        recordings.map(async (recording, index) => {
          if (recording.uploadedUrl) {
            return recording;
          }
          const uploadedUrl = await uploadRecording(taskId, recording.blob as Blob, {
            studentName: studentName.trim(),
            studentNumber: studentNumber.trim(),
            classNumber: classNumber.trim(),
            itemIndex: index,
          });
          return { ...recording, uploadedUrl };
        })
      );

      const response = await fetch(`/api/speak/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName.trim(),
          student_number: studentNumber.trim(),
          class_number: classNumber.trim(),
          recordings: uploaded.map((recording) => ({
            task_item_id: recording.task_item_id,
            audio_url: recording.uploadedUrl,
            duration_seconds: recording.duration_seconds,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }
      releaseMicStream();
      setStep('done');
    } catch (err) {
      setStep('record');
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  }

  function taskTypeLabel(type: ItemTaskType): string {
    return STUDENT_TASK_TYPE_LABELS[type];
  }

  if (step === 'loading') {
    return (
      <div className="speak-page min-h-screen flex items-center justify-center px-4">
        <ComicText className="text-[var(--comic-dark)] font-bold text-xl">Loading task…</ComicText>
      </div>
    );
  }

  if (step === 'error' || !task) {
    return (
      <div className="speak-page min-h-screen flex items-center justify-center px-4">
        <ComicCard className="max-w-lg w-full text-center">
          <ComicTitle level={2} className="mb-4 text-[var(--comic-danger)]">
            Task unavailable
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">{error}</ComicText>
        </ComicCard>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="speak-page min-h-screen flex items-center justify-center px-4 py-10">
        <ComicCard className="max-w-lg w-full text-center">
          <ComicTitle level={2} className="mb-4 text-[var(--comic-success)]">
            ✅ All done — submitted!
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold text-lg">
            You submitted {totalItems} item{totalItems === 1 ? '' : 's'} for {task.title}.
          </ComicText>
        </ComicCard>
      </div>
    );
  }

  return (
    <div className="speak-page min-h-screen bg-[var(--comic-light)] px-4 py-8">
      <style jsx global>{`
        .speak-page .student-prompt-option {
          line-height: 1.35;
        }
        .speak-page .student-prompt-title,
        .speak-page .student-prompt-option-label {
          font-size: 17px;
          font-weight: bold;
        }
        .speak-page .student-prompt-rules {
          font-size: 15px;
          font-weight: normal;
        }
        .speak-page .student-prompt-example {
          font-size: 15px;
          font-weight: normal;
        }
        .speak-page .student-choose-prompt {
          font-size: 17px;
          font-weight: bold;
          line-height: 1.35;
        }
      `}</style>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <ComicTitle level={2} className="text-[var(--comic-secondary)] mb-2">
            🎙️ Speak &amp; Submit
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">{task.title}</ComicText>
          <ComicText className="text-[var(--comic-dark)]">Class {task.class_name}</ComicText>
        </div>

        {step === 'identity' ? (
          <ComicCard>
            <ComicTitle level={6} className="speak-identity-title mb-4 text-[var(--comic-primary)] text-center">
              👋 Who are you?
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4 text-sm">
              Recordings used for class feedback
            </ComicText>
            <div className="space-y-4">
              {entryConfig.name_mode === 'first_last' ? (
                <>
                  <input
                    className="w-full comic-input text-lg py-4"
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                    required
                  />
                  <input
                    className="w-full comic-input text-lg py-4"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </>
              ) : (
                <input
                  className="w-full comic-input text-lg py-4"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  autoComplete="nickname"
                  required
                />
              )}

              {usesClassDropdown ? (
                <select
                  className="w-full comic-input text-lg py-4"
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  required
                >
                  <option value="">Select class</option>
                  {sortedClasses.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                      {classOption.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full comic-input text-lg py-4"
                  placeholder="Class"
                  value={manualClassNumber}
                  onChange={(event) => setManualClassNumber(event.target.value)}
                  required
                />
              )}

              <div className={`grid gap-3 ${usesStudentLetter ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <select
                  className="w-full comic-input text-lg py-4"
                  value={studentNumber}
                  onChange={(event) => setStudentNumber(event.target.value)}
                  required
                >
                  <option value="">#</option>
                  {studentNumberOptions.map((number) => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </select>

                {usesStudentLetter ? (
                  <select
                    className="w-full comic-input text-lg py-4"
                    value={studentLetter}
                    onChange={(event) => setStudentLetter(event.target.value.toUpperCase())}
                    required
                  >
                    <option value="">ID</option>
                    {STUDENT_LETTER_OPTIONS.map((letter) => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <ComicButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleContinueIdentity}
                disabled={checkingIdentity}
              >
                {checkingIdentity ? 'Checking…' : 'Continue'}
              </ComicButton>
            </div>
          </ComicCard>
        ) : null}

        {step === 'record' || step === 'submitting' ? (
          <ComicCard>
            {showSectionHeader ? (
              <>
                {sectionCount > 1 ? (
                  <ComicText className="text-[var(--comic-secondary)] font-bold mb-1">
                    Part {((currentItem?.section_index ?? 0) + 1)} of {sectionCount}
                  </ComicText>
                ) : null}
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
                  {taskTypeLabel(currentItemType)}
                </ComicText>
              </>
            ) : null}
            {totalItems > 1 ? (
              <ComicText className="text-[var(--comic-secondary)] font-bold text-lg mb-4">
                Item {currentIndex + 1} of {totalItems}
              </ComicText>
            ) : null}

            <div className="comic-border-thick bg-white p-5 mb-6 rounded-lg">
              {currentItemType === 'prompt' ? (
                <PromptOptionDisplay
                  content={currentItem?.content ?? ''}
                  rules={currentItem?.prompt_rules}
                  example={currentItem?.prompt_example}
                />
              ) : (
                <ComicText className="text-[var(--comic-dark)] font-bold text-xl leading-relaxed">
                  {currentItem?.content}
                </ComicText>
              )}
            </div>

            {micDenied ? (
              <ComicText className="text-[var(--comic-danger)] font-bold mb-4">
                Microphone access was denied. Please allow the mic in your browser settings and refresh.
              </ComicText>
            ) : null}

            <div className="flex flex-col gap-4">
              {!isRecording && !recordings[currentIndex]?.audioUrl ? (
                <>
                  <ComicText className="text-center text-[var(--comic-secondary)] font-bold text-sm">
                    Max {maxRecordingSeconds}s per recording
                  </ComicText>
                  <ComicButton variant="danger" size="lg" className="w-full" onClick={startRecording}>
                    ● Start recording
                  </ComicButton>
                </>
              ) : null}

              {isRecording ? (
                <>
                  <ComicText className="text-center text-[var(--comic-danger)] font-bold text-xl animate-pulse">
                    Recording… {elapsedSeconds}s / {maxRecordingSeconds}s
                  </ComicText>
                  <ComicButton variant="secondary" size="lg" className="w-full" onClick={stopRecording}>
                    ■ Stop recording
                  </ComicButton>
                </>
              ) : null}

              {recordings[currentIndex]?.audioUrl && recordings[currentIndex]?.blob?.size ? (
                <>
                  <ComicAudioPlayer
                    key={recordings[currentIndex].audioUrl ?? undefined}
                    src={recordings[currentIndex].audioUrl ?? ''}
                    className="mb-2"
                  />
                  <div className="speak-action-row">
                    <ComicButton variant="warning" size="sm" onClick={reRecord}>
                      Try again
                    </ComicButton>
                    {currentIndex < totalItems - 1 || nextUnchosenPromptSection !== null ? (
                      <ComicButton variant="primary" size="sm" onClick={goNext}>
                        Next item →
                      </ComicButton>
                    ) : (
                      <ComicButton
                        variant="success"
                        size="sm"
                        disabled={step === 'submitting'}
                        onClick={submitAll}
                      >
                        {step === 'submitting' ? 'Submitting…' : 'Submit'}
                      </ComicButton>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </ComicCard>
        ) : null}

        {step === 'choose_prompt' ? (
          <ComicCard>
            <ComicTitle level={4} className="mb-1 text-[var(--comic-primary)] text-center">
              🎙️ Speaking Task
            </ComicTitle>
            <p className="student-choose-prompt text-[var(--comic-secondary)] text-center mb-4 mt-2">
              Choose one prompt:
            </p>
            <div className="space-y-3">
              {choosePromptOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectPrompt(option.id)}
                  className="w-full text-left comic-border bg-white rounded-lg p-3 hover:bg-[var(--comic-light)] transition-colors"
                >
                  <PromptOptionDisplay
                    content={option.content}
                    optionLabel={`Option ${index + 1}`}
                    rules={option.prompt_rules}
                    example={option.prompt_example}
                  />
                </button>
              ))}
            </div>
          </ComicCard>
        ) : null}

        {error ? (
          <ComicText className="text-[var(--comic-danger)] font-bold text-center">{error}</ComicText>
        ) : null}
      </div>
    </div>
  );
}
