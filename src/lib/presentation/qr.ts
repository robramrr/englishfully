import { generateQrDataUrl } from '@/lib/speak-and-submit/qr';

export { generateQrDataUrl };

export function getPresentationUrl(presentationId: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}/presentation/${presentationId}`;
}
