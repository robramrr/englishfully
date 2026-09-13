'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { compressArtworkImage } from '@/lib/projects/compressImage';

interface ArtworkCameraProps {
  disabled?: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function ArtworkCamera({
  disabled = false,
  onCapture,
  onClose,
}: ArtworkCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }

  function handleClose() {
    if (busy) return;
    stopCamera();
    onClose();
  }

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        stopCamera();
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

  async function handleCapturedBlob(source: Blob) {
    setBusy(true);
    setError('');
    try {
      const compressed = await compressArtworkImage(source);
      stopCamera();
      onClose();
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover ${ready ? '' : 'hidden'}`}
      />
      {!ready && !error ? (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <ComicText className="text-center font-bold text-white">Opening camera…</ComicText>
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 flex justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <ComicButton type="button" variant="danger" size="sm" disabled={busy} onClick={handleClose}>
          Close
        </ComicButton>
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-black/80 to-transparent p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {error ? <ComicText className="font-bold text-white">{error}</ComicText> : null}
        <ComicButton
          type="button"
          variant="primary"
          className="w-full"
          disabled={disabled || busy}
          onClick={() => void handleSnap()}
        >
          {busy ? 'Saving photo…' : 'Snap photo'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="accent"
          className="w-full"
          disabled={busy}
          onClick={handleClose}
        >
          Close camera
        </ComicButton>
      </div>
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
    </div>,
    document.body
  );
}
