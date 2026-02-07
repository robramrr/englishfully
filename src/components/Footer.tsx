'use client';

import Link from "next/link";
import ComicButton from "./ComicButton";
import ComicCard from "./ComicCard";
import ComicTitle from "./ComicTitle";
import ComicText from "./ComicText";
import { useI18n } from "../i18n/I18nProvider";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="w-full comic-bg-accent py-16 px-8 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <ComicCard variant="primary" className="text-center comic-shadow-xl">
            <ComicTitle level={3} className="comic-text-white mb-6">
              {t.footer.getInTouch}
            </ComicTitle>
            <div className="space-y-3">
              <Link href="/contact">
                <ComicButton variant="warning" size="sm">
                  {t.footer.contactUs}
                </ComicButton>
              </Link>
              <a href="https://m.me/englishfully" target="_blank" rel="noopener noreferrer">
                <ComicButton variant="warning" size="sm">
                  {t.footer.chatWithUs}
                </ComicButton>
              </a>
            </div>
          </ComicCard>
          
          <ComicCard variant="secondary" className="text-center comic-shadow-xl">
            <ComicTitle level={3} className="comic-text-white mb-6">
              {t.footer.followUs}
            </ComicTitle>
            <div className="flex justify-center space-x-4 mb-4">
              <a href="https://tiktok.com/@englishfully" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-12 h-12 bg-white rounded-full flex items-center justify-center comic-border-thick comic-shadow-md hover:comic-shadow-lg transition-all duration-200 hover:scale-110">
                <svg width="24" height="24" fill="#000000" className="inline-block"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </a>
              <a href="https://facebook.com/englishfully" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-12 h-12 bg-white rounded-full flex items-center justify-center comic-border-thick comic-shadow-md hover:comic-shadow-lg transition-all duration-200 hover:scale-110">
                <svg width="24" height="24" fill="#1877F2" className="inline-block"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>
              </a>
              <a href="https://instagram.com/englishfullyonline" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-12 h-12 bg-white rounded-full flex items-center justify-center comic-border-thick comic-shadow-md hover:comic-shadow-lg transition-all duration-200 hover:scale-110">
                <svg width="24" height="24" fill="#E4405F" className="inline-block"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.242-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.13 4.602.402 3.635 1.37 2.668 2.337 2.396 3.51 2.338 4.788.013 8.332 0 8.741 0 12c0 3.259.013 3.668.072 4.948.058 1.277.33 2.45 1.297 3.417.967.967 2.14 1.239 3.417 1.297C8.332 23.987 8.741 24 12 24c3.259 0 3.668-.013 4.948-.072 1.277-.058 2.45-.33 3.417-1.297.967-.967 1.239-2.14 1.297-3.417.059-1.28.072-1.689.072-4.948 0-3.259-.013-3.668-.072-4.948-.058-1.277-.33-2.45-1.297-3.417-.967-.967-2.14-1.239-3.417-1.297C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm7.2-11.406a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
              </a>
            </div>
            <Link href="/blog">
              <ComicButton variant="warning" size="sm">
                {t.nav.blog}
              </ComicButton>
            </Link>
          </ComicCard>
          
          <ComicCard variant="accent" className="text-center comic-shadow-xl">
            <ComicTitle level={3} className="comic-text-white mb-6">
              {t.footer.readyToStart}
            </ComicTitle>
            <Link href="/online-learning">
              <ComicButton variant="warning" size="sm">
                {t.footer.joinNow}
              </ComicButton>
            </Link>
          </ComicCard>

          <div className="text-center comic-shadow-xl p-6 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 comic-border-thick">
            <ComicTitle level={3} className="comic-text-white mb-6">
              {t.footer.downloadApp}
            </ComicTitle>
            <div className="space-y-3">
              <Link href="#">
                <ComicButton variant="warning" size="sm" className="w-full">
                  {t.footer.appStore}
                </ComicButton>
              </Link>
              <Link href="#">
                <ComicButton variant="warning" size="sm" className="w-full">
                  {t.footer.googlePlay}
                </ComicButton>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-8 border-t-6 border-[var(--comic-primary)]">
          <ComicText className="comic-text-white font-bold">
            {t.footer.copyright.replace('{year}', new Date().getFullYear().toString())}
          </ComicText>
        </div>
      </div>
    </footer>
  );
}
