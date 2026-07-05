import type { Metadata } from "next";
import { Fredoka, Bungee, Comic_Neue } from "next/font/google";
import "./globals.css";
import HeaderWrapper from "../components/HeaderWrapper";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${fredoka.variable} ${bungee.variable} ${comicNeue.variable}`}>
        <I18nProvider>
          <HeaderWrapper />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
