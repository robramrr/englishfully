'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import ComicText from '../ComicText';
import { generateQrDataUrl, getSentenceContestUrl } from '@/lib/sentence-contest/qr';

export default function SentenceContestShare({
  activityId,
  qrClassName = 'h-32 w-32',
}: {
  activityId: string;
  qrClassName?: string;
}) {
  const [shareUrl, setShareUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activityId) {
      setShareUrl('');
      setQrCode('');
      return;
    }
    const url = getSentenceContestUrl(activityId, window.location.origin);
    setShareUrl(url);
    let cancelled = false;
    void generateQrDataUrl(url)
      .then((dataUrl) => {
        if (!cancelled) setQrCode(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrCode('');
      });
    return () => {
      cancelled = true;
    };
  }, [activityId]);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-4 border-[var(--comic-black)] bg-white p-3">
      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrCode}
          alt="QR code for this sentence contest"
          className={`${qrClassName} shrink-0 object-contain`}
        />
      ) : (
        <div
          className={`flex ${qrClassName} shrink-0 items-center justify-center border-4 border-[var(--comic-black)] bg-[var(--comic-light)] text-center text-xs font-bold`}
        >
          Generating QR code…
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <ComicText className="font-black">Student link</ComicText>
        <ComicText className="text-sm font-bold text-[var(--comic-dark)]">
          Students scan the code or open the link to write their sentences.
        </ComicText>
        {shareUrl ? (
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline"
          >
            {shareUrl}
          </a>
        ) : null}
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={!shareUrl}
          onClick={() => void copyLink()}
        >
          {copied ? 'Link copied' : 'Copy link'}
        </ComicButton>
      </div>
    </div>
  );
}
