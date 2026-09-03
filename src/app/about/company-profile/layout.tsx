import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Company Profile | Englishfully Co., Ltd.',
  description:
    'Englishfully Co., Ltd. company profile for BOI Thailand Smart Visa (Digital Industry).',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
