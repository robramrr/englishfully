import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitch Deck | Englishfully Co., Ltd.',
  description:
    'Englishfully Co., Ltd. pitch deck for BOI Thailand Smart Visa (Digital Industry).',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PitchDeckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
