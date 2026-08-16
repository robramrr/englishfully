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
    }
  }, [isPublished, deck.id]);

  useEffect(() => {
    if (!shareUrl) {
      setQrCode('');
      return;
    }
    void generateQrDataUrl(shareUrl).then(setQrCode).catch(() => setQrCode(''));
  }, [shareUrl]);

  async function handlePublish() {
    setSaving(true);
    setError('');
    setMessage('');
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
      setMessage('Published. Share the link or QR below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/presentation/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deck: { ...deck, status: deck.status || 'draft' },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save draft');
      onDeckSaved(data.presentation as PresentationDeck);
      setMessage('Draft saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) {
      await handlePublish();
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

  return (
    <ComicCard className="comic-shadow-xl space-y-4">
      <ComicTitle level={3} className="text-[var(--comic-primary)]">
        Publish · Link · QR · PDF · PowerPoint
      </ComicTitle>
      <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
        {isPublished
          ? 'This presentation is published. Update anytime, then publish again to refresh the live link.'
          : 'Save your draft while editing. Publish when ready to get a share link and QR code.'}
      </ComicText>
      <ComicText className="text-sm font-black">
        Status: {isPublished ? 'Published' : 'Draft'}
      </ComicText>

      <div className="flex flex-wrap gap-3">
        <ComicButton
          type="button"
          variant="accent"
          size="md"
          disabled={saving}
          onClick={() => void handleSaveDraft()}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="primary"
          size="md"
          disabled={saving}
          onClick={() => void handlePublish()}
        >
          {saving ? 'Publishing…' : isPublished ? 'Publish update' : 'Publish & get link'}
        </ComicButton>
        <ComicButton
          type="button"
          variant="secondary"
          size="md"
          disabled={saving || (!shareUrl && !isPublished)}
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

      {shareUrl && isPublished ? (
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start">
          <div className="space-y-2 min-w-0">
            <ComicText className="text-sm font-bold">Direct link</ComicText>
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
