'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ResponsiveNav from './ResponsiveNav';
import { LOGO_URL } from '../constants/images';

function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
      <img
        src={LOGO_URL}
        alt="Englishfully Logo"
        width={320}
        height={240}
        className="object-contain"
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  );
}

export default function HeaderWrapper() {
  const pathname = usePathname();
  const isFormalDoc =
    pathname.startsWith('/about/pitch-deck') ||
    pathname.startsWith('/about/company-profile');
  const hideHeader =
    pathname.startsWith('/speak/') ||
    pathname.startsWith('/listen-learn/') ||
    pathname.startsWith('/escape-room/') ||
    (pathname.includes('/escape-room/') && pathname.endsWith('/preview')) ||
    pathname === '/grades' ||
    pathname.startsWith('/grades/') ||
    (pathname.includes('/speak-and-submit/') && pathname.endsWith('/print')) ||
    (pathname.includes('/listen-and-answer/') && pathname.endsWith('/print')) ||
    (pathname.includes('/gradebook/') && pathname.endsWith('/print'));

  if (hideHeader) return null;

  return (
    <header
      className={[
        'w-full flex items-center justify-between py-6 px-8 comic-bg-header-stripes comic-border-b-4 border-b-6 border-[var(--comic-black)] comic-shadow-xl',
        isFormalDoc ? 'pitch-deck-site-header' : '',
        pathname.startsWith('/about/company-profile') ? 'print:hidden' : '',
      ].join(' ')}
    >
      <Logo />
      <div className={isFormalDoc ? 'print:hidden' : undefined}>
        <ResponsiveNav />
      </div>
    </header>
  );
}
