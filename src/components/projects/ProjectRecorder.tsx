'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ComicAudioPlayer from '../ComicAudioPlayer';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';

interface ProjectRecorderProps {
  minSeconds: number;
  maxSeconds: number;
  disabled?: boolean;
  onReady: (blob: Blob, durationSeconds: number) => void;
  onClear: () => void;
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
    if (blob.size > 0) return blob;
    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }
  return null;
}

export default function ProjectRecorder({
  minSeconds,
  maxSeconds,
  disabled = false,
  onReady,
  onClear,
}: ProjectRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const [error, setError] = useState('');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingSessionRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const releaseMicStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      releaseMicStream();
      clearTimer();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [clearTimer, previewUrl, releaseMicStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  async function startRecording() {
    if (disabled || mediaRecorderRef.current?.state === 'recording') return;
    setError('');

    const sessionId = recordingSessionRef.current + 1;
    recordingSessionRef.current = sessionId;

    try {
      releaseMicStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicDenied(false);

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const resolvedMimeType = mimeType || recorder.mimeType || 'audio/webm';

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        void (async () => {
          clearTimer();
          setIsRecording(false);
          mediaRecorderRef.current = null;
          if (sessionId !== recordingSessionRef.current) {
            releaseMicStream();
            return;
          }

          const blob = await waitForRecordingBlob(chunks, resolvedMimeType);
          releaseMicStream();
          if (sessionId !== recordingSessionRef.current) return;
          if (!blob) {
            setError('Recording failed — no audio was captured. Please try again.');
            return;
          }

          const recordedDuration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          if (recordedDuration < minSeconds) {
            setError(`Please speak for at least ${minSeconds} seconds.`);
            setElapsedSeconds(recordedDuration);
            return;
          }

          if (previewUrl) URL.revokeObjectURL(previewUrl);
          const nextUrl = URL.createObjectURL(blob);
          setPreviewUrl(nextUrl);
          setDuration(recordedDuration);
          setElapsedSeconds(recordedDuration);
          onReady(blob, recordedDuration);
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
        if (elapsed >= maxSeconds) stopRecording();
      }, 250);
    } catch {
      setMicDenied(true);
      setError('Microphone access is required for online recording.');
    }
  }

  function handleRecordAgain() {
    recordingSessionRef.current += 1;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDuration(0);
    setElapsedSeconds(0);
    setError('');
    onClear();
  }

  return (
    <div className="space-y-4">
      <ComicText className="text-[var(--comic-secondary)] font-bold text-sm">
        Speak for {minSeconds}–{maxSeconds} seconds
      </ComicText>
      {micDenied ? (
        <ComicText className="text-[var(--comic-danger)] font-bold">
          Microphone access was denied. Allow the mic in your browser settings and try again.
        </ComicText>
      ) : null}
      {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}

      {isRecording ? (
        <>
          <ComicText className="text-center text-[var(--comic-primary)] font-bold text-xl">
            Recording… {elapsedSeconds}s
          </ComicText>
          <ComicButton variant="warning" size="lg" className="w-full" onClick={stopRecording}>
            Stop
          </ComicButton>
        </>
      ) : previewUrl ? (
        <>
          <ComicAudioPlayer src={previewUrl} />
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {duration}s recorded
          </ComicText>
          <ComicButton
            variant="accent"
            size="lg"
            className="w-full"
            disabled={disabled}
            onClick={handleRecordAgain}
          >
            Record again
          </ComicButton>
        </>
      ) : (
        <ComicButton
          variant="danger"
          size="lg"
          className="w-full"
          disabled={disabled}
          onClick={() => void startRecording()}
        >
          Record
        </ComicButton>
      )}
    </div>
  );
}
