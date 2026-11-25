'use client';

import { useEffect, useState } from 'react';
import ComicButton from '../ComicButton';
import { generateQrDataUrl, getSentenceContestUrl } from '@/lib/sentence-contest/qr';

export default function SentenceContestShare({
  activityId,
  qrClassName = 'h-16 w-16',
  showLink = false,
}: {
  activityId: string;
  qrClassName?: string;
  showLink?: boolean;
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
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <ComicButton
          type="button"
          variant="secondary"
          size="sm"
          disabled={!shareUrl}
          onClick={() => void copyLink()}
        >
          {copied ? 'Link copied' : 'Copy link'}
        </ComicButton>
        {qrCode ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCode}
            alt=""
            className={`${qrClassName} shrink-0 object-contain`}
          />
        ) : null}
      </div>
      {showLink && shareUrl ? (
        <a
          href={shareUrl}
          target="_blank"
          rel="noreferrer"
          className="max-w-xs break-all text-right text-sm font-bold text-[var(--comic-secondary)] underline-offset-2 hover:underline"
        >
          {shareUrl}
        </a>
      ) : null}
    </div>
  );
}
