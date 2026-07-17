import QRCode from 'qrcode';

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: {
      dark: '#001a48',
      light: '#ffffff',
    },
  });
}

export function getStudentLearnUrl(assignmentId: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}/listen-learn/${assignmentId}`;
}
