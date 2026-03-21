import type { Metadata } from "next";
import { Fredoka, Bungee, Comic_Neue } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ResponsiveNav from "../components/ResponsiveNav";
import { LOGO_URL } from "../constants/images";
import { I18nProvider } from "../i18n/I18nProvider";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: ["400"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Englishfully - Listen, Read, Speak. Succeed!",
  description: "Online English lessons, resources, and coaching to improve your speaking, writing, and confidence.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
      {/* Plain <img>: avoids Vercel Image Optimization; Cloudinary URL is fixed + transformed */}
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

function Header() {
  return (
    <header className="w-full flex items-center justify-between py-6 px-8 bg-[var(--comic-white)] comic-border-b-4 border-b-6 border-[var(--comic-black)] comic-shadow-xl comic-pattern-stripes">
      <Logo />
      <ResponsiveNav />
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${fredoka.variable} ${bungee.variable} ${comicNeue.variable}`}>
        <I18nProvider>
          <Header />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
