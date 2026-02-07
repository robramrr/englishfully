'use client';

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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.onlineLearning.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.onlineLearning.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#subscription-plans">
            <ComicButton 
              variant="secondary" 
              size="lg"
              className="comic-wiggle"
            >
              {t.onlineLearning.explorePlans}
            </ComicButton>
          </a>
        </div>
      </div>
    </section>
  );
}

// Courses Section
function CoursesSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.onlineLearning.beginnerTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.beginnerDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.beginnerItem1}</li>
            <li>{t.onlineLearning.beginnerItem2}</li>
            <li>{t.onlineLearning.beginnerItem3}</li>
            <li>{t.onlineLearning.beginnerItem4}</li>
          </ul>
          <a href="#subscription-plans">
            <ComicButton variant="success" size="sm">
              {t.onlineLearning.learnMore}
            </ComicButton>
          </a>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            {t.onlineLearning.intermediateTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.intermediateDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.intermediateItem1}</li>
            <li>{t.onlineLearning.intermediateItem2}</li>
            <li>{t.onlineLearning.intermediateItem3}</li>
            <li>{t.onlineLearning.intermediateItem4}</li>
          </ul>
          <a href="#subscription-plans">
            <ComicButton variant="warning" size="sm">
              {t.onlineLearning.learnMore}
            </ComicButton>
          </a>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
            {t.onlineLearning.advancedTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.advancedDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.advancedItem1}</li>
            <li>{t.onlineLearning.advancedItem2}</li>
            <li>{t.onlineLearning.advancedItem3}</li>
          </ul>
          <a href="#subscription-plans">
            <ComicButton variant="danger" size="sm">
              {t.onlineLearning.learnMore}
            </ComicButton>
          </a>
        </ComicCard>
      </div>
    </section>
  );
}

// AI Features Section
function AIFeaturesSection() {
  const { t } = useI18n();
  
  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.onlineLearning.aiFeaturesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.onlineLearning.aiFeaturesDesc}
          </ComicText>
        </div>
      
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              {t.onlineLearning.aiVoiceTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.onlineLearning.aiVoiceDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>{t.onlineLearning.aiVoiceItem1}</li>
              <li>{t.onlineLearning.aiVoiceItem2}</li>
              <li>{t.onlineLearning.aiVoiceItem3}</li>
              <li>{t.onlineLearning.aiVoiceItem5}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              {t.onlineLearning.visualPhonicsTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.onlineLearning.visualPhonicsDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>{t.onlineLearning.visualPhonicsItem1}</li>
              <li>{t.onlineLearning.visualPhonicsItem2}</li>
              <li>{t.onlineLearning.visualPhonicsItem3}</li>
              <li>{t.onlineLearning.visualPhonicsItem4}</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              {t.onlineLearning.speakingPracticeTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              {t.onlineLearning.speakingPracticeDesc}
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>{t.onlineLearning.speakingPracticeItem1}</li>
              <li>{t.onlineLearning.speakingPracticeItem2}</li>
              <li>{t.onlineLearning.speakingPracticeItem3}</li>
              <li>{t.onlineLearning.speakingPracticeItem4}</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Subscription Plans Section
function SubscriptionPlansSection() {
  const { t } = useI18n();
  
  return (
    <section id="subscription-plans" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.onlineLearning.subscriptionTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.onlineLearning.subscriptionDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
            {t.onlineLearning.freeTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.freeDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.freeItem1}</li>
            <li>{t.onlineLearning.freeItem2}</li>
            <li>{t.onlineLearning.freeItem4}</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            {t.onlineLearning.comingSoon}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-lg text-center border-4 border-[var(--comic-warning)] flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
            {t.onlineLearning.premiumTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.premiumDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.premiumItem1}</li>
            <li>{t.onlineLearning.premiumItem2}</li>
            <li>{t.onlineLearning.premiumItem3}</li>
            <li>{t.onlineLearning.premiumItem4}</li>
            <li>{t.onlineLearning.premiumItem5}</li>
          </ul>
          <ComicButton variant="warning" size="sm">
            {t.onlineLearning.comingSoon}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
            {t.onlineLearning.proTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.onlineLearning.proDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.onlineLearning.proItem1}</li>
            <li>{t.onlineLearning.proItem2}</li>
            <li>{t.onlineLearning.proItem3}</li>
            <li>{t.onlineLearning.proItem4}</li>
          </ul>
          <ComicButton variant="danger" size="sm">
            {t.onlineLearning.comingSoon}
          </ComicButton>
        </ComicCard>
      </div>
    </section>
  );
}

export default function OnlineLearning() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <CoursesSection />
      <AIFeaturesSection />
      <SubscriptionPlansSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

