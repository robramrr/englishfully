'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { generateQrDataUrl, getPresentationUrl } from '@/lib/presentation/qr';
import { downloadPresentationPdf } from '@/lib/presentation/exportPdf';
import type { PresentationDeck } from '@/lib/presentation/types';

interface PresentationShareBarProps {
  deck: PresentationDeck;
  onDeckSaved: (deck: PresentationDeck) => void;
}

export default function PresentationShareBar({
  deck,
  onDeckSaved,
}: PresentationShareBarProps) {
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isPublished = deck.status === 'published';

  useEffect(() => {
    if (isPublished && deck.id) {
      setShareUrl(getPresentationUrl(deck.id, window.location.origin));
    } else {
      setShareUrl('');
    }
  }, [isPublished, deck.id]);

  useEffect(() => {
    if (!shareUrl) {
      setQrCode('');
      return;
    }
    void generateQrDataUrl(shareUrl).then(setQrCode).catch(() => setQrCode(''));
  }, [shareUrl]);

  async function ensurePublished(): Promise<string> {
    if (shareUrl && isPublished) return shareUrl;
    setSaving(true);
    try {
      const response = await fetch(`/api/presentation/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck, publish: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to publish');
      const saved = data.presentation as PresentationDeck;
      const url =
        (data.url as string) ||
        getPresentationUrl(saved.id, window.location.origin);
      onDeckSaved(saved);
      setShareUrl(url);
      return url;
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    setError('');
    setMessage('');
    try {
      const url = await ensurePublished();
      await navigator.clipboard.writeText(url);
      setMessage('Link copied.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not copy link.');
    }
  }

  async function handlePdf() {
    setExporting('pdf');
    setError('');
    try {
      downloadPresentationPdf(deck);
      setMessage('PDF print window opened — choose Save as PDF.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PDF');
    } finally {
      setExporting('');
    }
  }

  async function handlePptx() {
    setExporting('pptx');
    setError('');
    try {
      const response = await fetch('/api/presentation/export-pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to export PowerPoint');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      anchor.href = url;
      anchor.download = match?.[1] || 'presentation.pptx';
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('PowerPoint downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PowerPoint');
    } finally {
      setExporting('');
    }
  }

  const showQr = Boolean(shareUrl && isPublished && qrCode);

  return (
    <ComicCard className="relative space-y-4">
      {showQr ? (
        <div className="absolute right-6 top-6 z-10 border-4 border-[var(--comic-black)] bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Presentation QR code"
            className="h-36 w-36 object-contain"
          />
        </div>
      ) : null}

      <div className={showQr ? 'md:pr-44' : ''}>
        <ComicTitle level={3} className="comic-title-no-shadow text-[var(--comic-secondary)]">
          Status: {isPublished ? 'Published' : 'Draft'}
        </ComicTitle>

        <div className="mt-4 flex flex-col gap-3">
          {shareUrl && isPublished ? (
            <ComicText className="text-[var(--comic-dark)] font-bold break-all">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--comic-secondary)] no-underline [font-size:inherit] [line-height:inherit] [font-weight:inherit] [font-family:inherit]"
              >
                {shareUrl}
              </a>
            </ComicText>
          ) : (
            <ComicText className="text-[var(--comic-dark)] font-bold">
              Publish to generate the live link and QR code.
            </ComicText>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <ComicButton
              type="button"
              variant="secondary"
              size="md"
              disabled={saving}
              onClick={() => void handleCopyLink()}
            >
              Copy link
            </ComicButton>
            <ComicButton
              type="button"
              variant="warning"
              size="md"
              disabled={Boolean(exporting)}
              onClick={() => void handlePdf()}
            >
              {exporting === 'pdf' ? 'Opening…' : 'Download PDF'}
            </ComicButton>
            <ComicButton
              type="button"
              variant="accent"
              size="md"
              disabled={Boolean(exporting)}
              onClick={() => void handlePptx()}
            >
              {exporting === 'pptx' ? 'Exporting…' : 'Download PowerPoint'}
            </ComicButton>
          </div>
        </div>
      </div>

      {message ? (
        <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
      ) : null}
      {error ? (
        <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
      ) : null}
    </ComicCard>
  );
}
