/**
 * Reliable HTMLAudio clip playback.
 *
 * Problems this solves:
 * - `timeupdate` only fires ~4×/sec → clip ends overshoot intermittently
 * - `currentTime = start` before play is often ignored until metadata/seek settles
 *   → live play can start early and run until the end mark (feels "extended")
 *
 * Strategy: verified seek + rAF end check + wall-clock hard stop for length.
 */

export async function waitForAudioMetadata(
  audio: HTMLAudioElement,
  timeoutMs = 2000
): Promise<void> {
  if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) {
    return;
  }
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      audio.removeEventListener('loadedmetadata', finish);
      audio.removeEventListener('canplay', finish);
      resolve();
    };
    audio.addEventListener('loadedmetadata', finish);
    audio.addEventListener('canplay', finish);
    try {
      audio.load();
    } catch {
      // ignore
    }
    window.setTimeout(finish, timeoutMs);
  });
}

export async function seekAudioTo(
  audio: HTMLAudioElement,
  seconds: number
): Promise<void> {
  const target = Math.max(0, Number(seconds) || 0);
  if (!Number.isFinite(target)) return;

  await waitForAudioMetadata(audio);

  if (Math.abs(audio.currentTime - target) < 0.03) {
    try {
      audio.currentTime = target;
    } catch {
      // ignore
    }
    return;
  }

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      audio.removeEventListener('seeked', onSeeked);
      resolve();
    };
    const onSeeked = () => finish();
    audio.addEventListener('seeked', onSeeked);
    try {
      audio.currentTime = target;
    } catch {
      finish();
      return;
    }
    window.setTimeout(finish, 700);
  });
}

/** Seek and retry until currentTime is near the target (or attempts exhausted). */
export async function seekAudioToVerified(
  audio: HTMLAudioElement,
  seconds: number,
  options?: { tolerance?: number; attempts?: number }
): Promise<boolean> {
  const tolerance = options?.tolerance ?? 0.12;
  const attempts = options?.attempts ?? 4;
  const target = Math.max(0, Number(seconds) || 0);

  for (let i = 0; i < attempts; i += 1) {
    await seekAudioTo(audio, target);
    if (Math.abs(audio.currentTime - target) <= tolerance) {
      return true;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40 + i * 30));
  }

  // Last nudge — still return whether we got close enough for usable playback.
  try {
    audio.currentTime = target;
  } catch {
    // ignore
  }
  return Math.abs(audio.currentTime - target) <= tolerance * 2;
}

export function isPastClipEnd(
  currentTime: number,
  endSeconds: number,
  epsilon = 0.02
): boolean {
  return currentTime >= endSeconds - epsilon;
}

export function clipDurationSeconds(startSeconds: number, endSeconds: number): number {
  const start = Math.max(0, Number(startSeconds) || 0);
  const end = Math.max(start + 0.05, Number(endSeconds) || start + 5);
  return Math.max(0.05, end - start);
}

/**
 * Attach a #t=start,end media fragment when the URL has no hash yet.
 * Browsers that support it help start in-range; we still clamp ourselves.
 */
export function withClipMediaFragment(
  url: string,
  startSeconds: number,
  endSeconds: number
): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const base = trimmed.split('#')[0];
  const start = Math.max(0, Number(startSeconds) || 0);
  const end = Math.max(start + 0.05, Number(endSeconds) || start + 5);
  return `${base}#t=${start.toFixed(3)},${end.toFixed(3)}`;
}
