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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-pink relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.community.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.community.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/online-learning">
            <ComicButton 
              variant="warning" 
              size="lg"
              className="comic-wiggle"
            >
              {t.community.startLearning}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Community Features Section
function CommunityFeaturesSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.community.featuresTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.community.featuresDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.community.forumTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.community.forumDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.community.forumItem1}</li>
            <li>{t.community.forumItem2}</li>
            <li>{t.community.forumItem3}</li>
            <li>{t.community.forumItem4}</li>
            <li>{t.community.forumItem5}</li>
          </ul>
          <ComicButton variant="primary" size="sm">
            {t.community.forumButton}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.community.studyGroupsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.community.studyGroupsDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.community.studyItem1}</li>
            <li>{t.community.studyItem2}</li>
            <li>{t.community.studyItem3}</li>
            <li>{t.community.studyItem4}</li>
            <li>{t.community.studyItem5}</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            {t.community.studyButton}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.community.eventsTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.community.eventsDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>{t.community.eventsItem1}</li>
            <li>{t.community.eventsItem2}</li>
            <li>{t.community.eventsItem3}</li>
            <li>{t.community.eventsItem4}</li>
            <li>{t.community.eventsItem5}</li>
          </ul>
          <ComicButton variant="success" size="sm">
            {t.community.eventsButton}
          </ComicButton>
        </ComicCard>
      </div>
    </section>
  );
}

// Community Stats Section
function CommunityStatsSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.community.statsTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.community.statsDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
              {t.community.activeLearnersCount}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.community.activeLearnersLabel}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              {t.community.countriesCount}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.community.countriesLabel}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              {t.community.studyGroupsCount}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.community.studyGroupsLabel}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
              {t.community.supportLabel}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.community.supportDesc}
            </ComicText>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Success Stories Section
function SuccessStoriesSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-success)]">
          {t.community.successTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.community.successDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.community.story1Name}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            "{t.community.story1Quote}"
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.community.story1Details}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.community.story2Name}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            "{t.community.story2Quote}"
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.community.story2Details}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.community.story3Name}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            "{t.community.story3Quote}"
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.community.story3Details}
          </ComicText>
        </ComicCard>
      </div>
    </section>
  );
}

// Join Community Section
function JoinCommunitySection() {
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
        setMessage(t.community.subscribeSuccess);
        setEmail('');
      } else {
        setMessage(data.error || t.community.subscribeFailed);
      }
    } catch {
      setMessage(t.community.subscribeFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto text-center">
        <ComicTitle level={2} className="comic-text-white mb-8">
          {t.community.joinTitle}
        </ComicTitle>
        <ComicText size="lg" className="comic-text-white font-bold mb-12 max-w-3xl mx-auto">
          {t.community.joinDesc}
        </ComicText>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Link href="/online-learning">
            <ComicButton variant="warning" size="lg">
              {t.community.startLearningNow}
            </ComicButton>
          </Link>
          <Link href="/in-person-learning">
            <ComicButton variant="success" size="lg">
              {t.community.joinStudyGroups}
            </ComicButton>
          </Link>
        </div>
        
        <ComicCard className="comic-shadow-xl max-w-2xl mx-auto">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            {t.community.updatesTitle}
          </ComicTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.community.emailLabel}</ComicText>
              <input 
                type="email" 
                className="w-full comic-input" 
                placeholder={t.contact.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {message && (
              <div className={`p-3 rounded-lg text-sm font-bold ${
                message.includes(t.community.subscribeSuccess) 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                {message}
              </div>
            )}
            <ComicButton 
              variant="primary" 
              size="lg" 
              className="w-full"
              disabled={loading}
            >
              {loading ? t.community.subscribing : t.community.subscribeToUpdates}
            </ComicButton>
          </form>
        </ComicCard>
      </div>
    </section>
  );
}

export default function Community() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <CommunityFeaturesSection />
      <CommunityStatsSection />
      <SuccessStoriesSection />
      <JoinCommunitySection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
