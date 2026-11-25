'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import { generateQrDataUrl, getSentenceContestUrl } from '@/lib/sentence-contest/qr';

export default function SentenceContestShare({
  activityId,
  qrClassName = 'h-16 w-16',
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
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrCode}
          alt=""
          className={`${qrClassName} shrink-0 object-contain`}
        />
      ) : null}
      {shareUrl ? (
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="max-w-xs break-all text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline"
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
  );
}
