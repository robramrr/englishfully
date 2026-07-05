'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import type { PublicTask, TaskType } from '@/lib/speak-and-submit/types';

type Step = 'loading' | 'identity' | 'record' | 'submitting' | 'done' | 'error';

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

function getSupportedMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

async function uploadRecording(taskId: string, blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, `recording.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);

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
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recordings, setRecordings] = useState<RecordingState[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micDenied, setMicDenied] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentItem = task?.items[currentIndex];
  const totalItems = task?.items.length ?? 0;

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
          items: data.items,
        });
        setRecordings(
          data.items.map((item: PublicTask['items'][number]) => ({
            task_item_id: item.id,
            blob: null,
            audioUrl: null,
            duration_seconds: 0,
            uploadedUrl: null,
          }))
        );
        setStep('identity');
      })
      .catch(() => {
        setError('Unable to load this speaking task.');
        setStep('error');
      });
  }, [taskId]);

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
      recordings.forEach((recording) => {
        if (recording.audioUrl) URL.revokeObjectURL(recording.audioUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureMicStream = useCallback(async () => {
    if (mediaStreamRef.current) return mediaStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicDenied(false);
      return stream;
    } catch {
      setMicDenied(true);
      throw new Error('Microphone access is required to complete this homework.');
    }
  }, []);

  async function startRecording() {
    setError('');
    try {
      const stream = await ensureMicStream();
      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || recorder.mimeType || 'audio/webm',
        });
        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        const previewUrl = URL.createObjectURL(blob);

        setRecordings((current) =>
          current.map((recording, index) =>
            index === currentIndex
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
        setIsRecording(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
        setElapsedSeconds(duration);
      };

      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start recording.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
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
  }

  function goNext() {
    if (!recordings[currentIndex]?.blob) {
      setError('Please record this item before continuing.');
      return;
    }
    setError('');
    if (currentIndex < totalItems - 1) {
      setCurrentIndex((value) => value + 1);
      setElapsedSeconds(0);
    }
  }

  async function submitAll() {
    if (recordings.some((recording) => !recording.blob)) {
      setError('Please record every item before submitting.');
      return;
    }

    setStep('submitting');
    setError('');

    try {
      const uploaded = await Promise.all(
        recordings.map(async (recording) => {
          if (recording.uploadedUrl) {
            return recording;
          }
          const uploadedUrl = await uploadRecording(taskId, recording.blob as Blob);
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

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      setStep('done');
    } catch (err) {
      setStep('record');
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  }

  function taskTypeLabel(type: TaskType): string {
    switch (type) {
      case 'single_sentence':
        return 'Say this sentence';
      case 'sentence_set':
        return 'Say each sentence';
      case 'vocab_list':
        return 'Say each word';
      case 'prompt':
        return 'Answer this prompt';
      default:
        return 'Speaking task';
    }
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ComicText className="text-[var(--comic-dark)] font-bold text-xl">Loading task…</ComicText>
      </div>
    );
  }

  if (step === 'error' || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ComicCard className="comic-shadow-xl max-w-lg w-full text-center">
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
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <ComicCard className="comic-shadow-xl max-w-lg w-full text-center">
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
    <div className="min-h-screen bg-[var(--comic-light)] px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <ComicTitle level={2} className="text-[var(--comic-secondary)] mb-2">
            🎙️ Speak &amp; Submit
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">{task.title}</ComicText>
          <ComicText className="text-[var(--comic-dark)]">Class {task.class_name}</ComicText>
        </div>

        {step === 'identity' ? (
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              👋 Who are you?
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4 text-sm">
              Your teacher will use this recording for class feedback only.
            </ComicText>
            <div className="space-y-4">
              <input
                className="w-full comic-input text-lg py-4"
                placeholder="Your name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                required
              />
              <input
                className="w-full comic-input text-lg py-4"
                placeholder="Student number"
                inputMode="numeric"
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
                required
              />
              <input
                className="w-full comic-input text-lg py-4"
                placeholder="Class number"
                value={classNumber}
                onChange={(event) => setClassNumber(event.target.value)}
                required
              />
              <ComicButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  if (!studentName.trim() || !studentNumber.trim() || !classNumber.trim()) {
                    setError('Please fill in all fields.');
                    return;
                  }
                  setError('');
                  setStep('record');
                }}
              >
                Continue
              </ComicButton>
            </div>
          </ComicCard>
        ) : null}

        {step === 'record' || step === 'submitting' ? (
          <ComicCard className="comic-shadow-xl">
            <ComicText className="text-[var(--comic-dark)] font-bold mb-2">
              {taskTypeLabel(task.task_type)}
            </ComicText>
            {totalItems > 1 ? (
              <ComicText className="text-[var(--comic-secondary)] font-bold text-lg mb-4">
                Item {currentIndex + 1} of {totalItems}
              </ComicText>
            ) : null}

            <div className="comic-border-thick bg-white p-5 mb-6 rounded-lg">
              <ComicText className="text-[var(--comic-dark)] font-bold text-xl leading-relaxed">
                {currentItem?.content}
              </ComicText>
            </div>

            {micDenied ? (
              <ComicText className="text-[var(--comic-danger)] font-bold mb-4">
                Microphone access was denied. Please allow the mic in your browser settings and refresh.
              </ComicText>
            ) : null}

            <div className="flex flex-col gap-4">
              {!isRecording && !recordings[currentIndex]?.audioUrl ? (
                <ComicButton variant="danger" size="lg" className="w-full" onClick={startRecording}>
                  ● Start recording
                </ComicButton>
              ) : null}

              {isRecording ? (
                <>
                  <ComicText className="text-center text-[var(--comic-danger)] font-bold text-xl animate-pulse">
                    Recording… {elapsedSeconds}s
                  </ComicText>
                  <ComicButton variant="secondary" size="lg" className="w-full" onClick={stopRecording}>
                    ■ Stop recording
                  </ComicButton>
                </>
              ) : null}

              {recordings[currentIndex]?.audioUrl ? (
                <>
                  <audio controls src={recordings[currentIndex].audioUrl ?? undefined} className="w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <ComicButton variant="warning" size="md" onClick={reRecord}>
                      Re-record
                    </ComicButton>
                    {currentIndex < totalItems - 1 ? (
                      <ComicButton variant="primary" size="md" onClick={goNext}>
                        Next item →
                      </ComicButton>
                    ) : (
                      <ComicButton
                        variant="success"
                        size="md"
                        disabled={step === 'submitting'}
                        onClick={submitAll}
                      >
                        {step === 'submitting' ? 'Submitting…' : 'Submit all'}
                      </ComicButton>
                    )}
                  </div>
                </>
              ) : null}
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
