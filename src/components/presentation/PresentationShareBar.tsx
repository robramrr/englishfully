'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicCard from '../ComicCard';
import ComicText from '../ComicText';
import { generateQrDataUrl, getPresentationUrl } from '@/lib/presentation/qr';
import { downloadPresentationPdf } from '@/lib/presentation/exportPdf';
import type { PresentationDeck } from '@/lib/presentation/types';

interface PresentationShareBarProps {
  deck: PresentationDeck;
  onDeckSaved: (deck: PresentationDeck) => void;
  onClearDraft: () => void;
}

export default function PresentationShareBar({
  deck,
  onDeckSaved,
  onClearDraft,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ComicButton type="button" variant="warning" size="md" onClick={onClearDraft}>
            Clear draft
          </ComicButton>
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
            {saving ? 'Publishing…' : 'Publish'}
          </ComicButton>
        </div>
        <ComicText className="text-sm font-black">
          Status: {isPublished ? 'Published' : 'Draft'}
        </ComicText>
      </div>

      <hr className="border-t-4 border-[var(--comic-black)]" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {shareUrl && isPublished ? (
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="max-w-full break-all font-bold underline text-[var(--comic-secondary)]"
              title={shareUrl}
            >
              Direct link
            </a>
          ) : (
            <ComicText className="text-sm font-bold text-[var(--comic-dark)]/60">
              Direct link (publish to unlock)
            </ComicText>
          )}
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

        {shareUrl && isPublished && qrCode ? (
          <div className="ml-auto shrink-0 border-4 border-[var(--comic-black)] bg-white p-2 comic-shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="Presentation QR code" width={120} height={120} />
          </div>
        ) : null}
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
