"use client";

import { useState } from "react";
import ComicButton from "./ComicButton";
import ComicTitle from "./ComicTitle";
import ComicText from "./ComicText";
import { useI18n } from "../i18n/I18nProvider";

/** “📧 Stay Updated” signup — shared by /blog and the homepage (same API + strings). */
export default function BlogNewsletterSection({
  wrapperClassName = "",
}: {
  wrapperClassName?: string;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/contact/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t.blog.subscribeSuccess);
        setEmail("");
      } else {
        setMessage(data.error || t.blog.subscribeFailed);
      }
    } catch {
      setMessage(t.blog.subscribeFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="stay-updated" className={`max-w-6xl mx-auto py-24 px-4 ${wrapperClassName}`}>
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.blog.newsletterTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.blog.newsletterDesc}
        </ComicText>
      </div>

      <div className="comic-bg-primary py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl text-center">
        <ComicTitle level={3} className="comic-text-white mb-6">
          {t.blog.weeklyTipsTitle}
        </ComicTitle>
        <ComicText className="comic-text-white font-bold mb-8">{t.blog.weeklyTipsDesc}</ComicText>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input
            type="email"
            placeholder={t.blog.emailPlaceholder}
            className="w-full p-4 comic-border rounded-lg text-[var(--comic-dark)] font-bold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-bold ${
                message.includes(t.blog.subscribeSuccess)
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message}
            </div>
          )}
          <ComicButton variant="warning" size="lg" className="w-full" disabled={loading}>
            {loading ? t.blog.subscribing : t.blog.subscribeButton}
          </ComicButton>
        </form>

        <ComicText className="comic-text-white text-sm mt-4">{t.blog.privacyText}</ComicText>
      </div>
    </section>
  );
}
