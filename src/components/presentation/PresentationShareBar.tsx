'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import ComicTitle from '../ComicTitle';
import { generateQrDataUrl, getPresentationUrl } from '@/lib/presentation/qr';
import { downloadPresentationPdf } from '@/lib/presentation/exportPdf';
import { downloadPresentationPptx } from '@/lib/presentation/exportPptx';
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

  useEffect(() => {
    if (!shareUrl) {
      setQrCode('');
      return;
    }
    void generateQrDataUrl(shareUrl).then(setQrCode).catch(() => setQrCode(''));
  }, [shareUrl]);

  async function handleSaveAndShare() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/presentation/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save presentation');
      const saved = data.presentation as PresentationDeck;
      const url =
        (data.url as string) ||
        getPresentationUrl(saved.id, window.location.origin);
      onDeckSaved(saved);
      setShareUrl(url);
      setMessage('Saved. Link and QR are ready.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save presentation');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) {
      await handleSaveAndShare();
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage('Link copied.');
    } catch {
      setError('Could not copy link.');
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
      await downloadPresentationPptx(deck);
      setMessage('PowerPoint downloaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export PowerPoint');
    } finally {
      setExporting('');
    }
  }

  return (
    <ComicCard className="comic-shadow-xl space-y-4">
      <ComicTitle level={3} className="text-[var(--comic-secondary)]">
        Share &amp; download
      </ComicTitle>
      <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
        Save to get a quick-access link and QR code. Download PDF or PowerPoint anytime.
      </ComicText>

      <div className="flex flex-wrap gap-2">
        <ComicButton
          type="button"
          variant="primary"
          size="sm"
          disabled={saving}
          onClick={() => void handleSaveAndShare()}
        >
          {saving ? 'Saving…' : 'Save & get link'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={saving}
          onClick={() => void handleCopyLink()}
        >
          Copy link
        </ComicButton>
        <ComicButton
          type="button"
          variant="warning"
          size="sm"
          disabled={Boolean(exporting)}
          onClick={() => void handlePdf()}
        >
          {exporting === 'pdf' ? 'Opening…' : 'Download PDF'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="accent"
          size="sm"
          disabled={Boolean(exporting)}
          onClick={() => void handlePptx()}
        >
          {exporting === 'pptx' ? 'Exporting…' : 'Download PowerPoint'}
        </ComicButton>
      </div>

      {shareUrl ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
          <div className="space-y-2 min-w-0">
            <ComicText className="text-sm font-bold">Share link</ComicText>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="block break-all font-bold underline text-[var(--comic-secondary)]"
            >
              {shareUrl}
            </a>
          </div>
          {qrCode ? (
            <div className="justify-self-start md:justify-self-end border-4 border-[var(--comic-black)] bg-white p-2 comic-shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Presentation QR code" width={160} height={160} />
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <ComicText className="font-bold text-[var(--comic-success)]">{message}</ComicText>
      ) : null}
      {error ? (
        <ComicText className="font-bold text-[var(--comic-danger)]">{error}</ComicText>
      ) : null}
    </ComicCard>
  );
}
