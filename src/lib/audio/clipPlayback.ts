/**
 * Reliable clip start/end helpers for HTMLAudioElement.
 *
 * Browsers fire `timeupdate` only ~4×/sec, so clip ends can overshoot by
 * hundreds of ms. Seeking before play can also be ignored until metadata loads.
 */

export async function seekAudioTo(
  audio: HTMLAudioElement,
  seconds: number
): Promise<void> {
  const target = Math.max(0, Number(seconds) || 0);
  if (!Number.isFinite(target)) return;

  // Ensure we can seek (duration known).
  if (audio.readyState < 1) {
    await new Promise<void>((resolve) => {
      const onMeta = () => {
        audio.removeEventListener('loadedmetadata', onMeta);
        resolve();
      };
      audio.addEventListener('loadedmetadata', onMeta);
      window.setTimeout(() => {
        audio.removeEventListener('loadedmetadata', onMeta);
        resolve();
      }, 1500);
    });
  }

  if (Math.abs(audio.currentTime - target) < 0.04) {
    audio.currentTime = target;
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
    window.setTimeout(finish, 600);
  });

  // Some browsers report seeked before currentTime settles — nudge once more.
  if (Math.abs(audio.currentTime - target) > 0.08) {
    try {
      audio.currentTime = target;
    } catch {
      // ignore
    }
  }
}

/** True when playback has reached/passed the clip end. */
export function isPastClipEnd(
  currentTime: number,
  endSeconds: number,
  epsilon = 0.02
): boolean {
  return currentTime >= endSeconds - epsilon;
}
