"use client";

import Link from "next/link";
import { useState } from "react";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import { useI18n } from "../../i18n/I18nProvider";


// Hero Section
function HeroSection() {
  const { t } = useI18n();
  
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-yellow relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.blog.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.blog.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/online-learning">
            <ComicButton 
              variant="primary" 
              size="lg"
              className="comic-wiggle"
            >
              {t.blog.startLearning}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Featured Articles Section
function FeaturedArticlesSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.blog.featuredTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.blog.featuredDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              {t.blog.article1Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.blog.article1Desc}
            </ComicText>
            <ComicButton variant="primary" size="sm">
              {t.blog.article1Button}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              {t.blog.article2Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.blog.article2Desc}
            </ComicText>
            <ComicButton variant="secondary" size="sm">
              {t.blog.article2Button}
            </ComicButton>
          </ComicCard>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              {t.blog.article3Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.blog.article3Desc}
            </ComicText>
            <ComicButton variant="success" size="sm">
              {t.blog.article3Button}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
              {t.blog.article4Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.blog.article4Desc}
            </ComicText>
            <ComicButton variant="warning" size="sm">
              {t.blog.article4Button}
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
              {t.blog.article5Title}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.blog.article5Desc}
            </ComicText>
            <ComicButton variant="danger" size="sm">
              {t.blog.article5Button}
            </ComicButton>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Newsletter Section
function NewsletterSection() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/contact/community', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t.blog.subscribeSuccess);
        setEmail('');
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
    <section className="max-w-6xl mx-auto py-24 px-4">
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
        <ComicText className="comic-text-white font-bold mb-8">
          {t.blog.weeklyTipsDesc}
        </ComicText>
        
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
            <div className={`p-3 rounded-lg text-sm font-bold ${
              message.includes(t.blog.subscribeSuccess) 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}
          <ComicButton 
            variant="warning" 
            size="lg" 
            className="w-full"
            disabled={loading}
          >
            {loading ? t.blog.subscribing : t.blog.subscribeButton}
          </ComicButton>
        </form>
        
        <ComicText className="comic-text-white text-sm mt-4">
          {t.blog.privacyText}
        </ComicText>
      </div>
    </section>
  );
}

export default function Blog() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <FeaturedArticlesSection />
      <NewsletterSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
