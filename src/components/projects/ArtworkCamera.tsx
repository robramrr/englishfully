'use client';

import { useEffect, useRef, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { compressArtworkImage } from '@/lib/projects/compressImage';

interface ArtworkCameraProps {
  disabled?: boolean;
  onCapture: (file: File) => void;
}

export default function ArtworkCamera({ disabled = false, onCapture }: ArtworkCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
        setError('');
      } catch {
        if (!cancelled) {
          setError('Could not open the live camera. Use Snap photo to open your phone camera.');
        }
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function handleCapturedBlob(source: Blob) {
    setBusy(true);
    setError('');
    try {
      const compressed = await compressArtworkImage(source);
      stopCamera();
      onCapture(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this photo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSnap() {
    const video = videoRef.current;
    if (video && ready && !busy && !disabled) {
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        setError('Could not take the photo.');
        return;
      }
      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92)
      );
      if (!blob) {
        setError('Could not take the photo.');
        return;
      }
      await handleCapturedBlob(blob);
      return;
    }
    fileInputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full max-h-80 rounded-lg comic-border bg-[var(--comic-dark)] object-cover ${
          ready ? '' : 'hidden'
        }`}
      />
      <ComicButton
        variant="primary"
        className="w-full"
        disabled={disabled || busy}
        onClick={() => void handleSnap()}
      >
        {busy ? 'Saving photo…' : 'Snap photo'}
      </ComicButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleCapturedBlob(file);
          event.target.value = '';
        }}
      />
      {error ? <ComicText className="text-[var(--comic-danger)] font-bold">{error}</ComicText> : null}
    </div>
  );
}
