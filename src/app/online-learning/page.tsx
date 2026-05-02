'use client';

import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicFeatureChecklist from "../../components/ComicFeatureChecklist";
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
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto whitespace-pre-line">
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

const SESSION_TYPE_ENTRIES = [
  {
    titleKey: "sessionType1Title",
    focusKey: "sessionType1Focus",
    bodyKey: "sessionType1Body",
    accentClass: "text-[var(--comic-primary)]",
  },
  {
    titleKey: "sessionType2Title",
    focusKey: "sessionType2Focus",
    bodyKey: "sessionType2Body",
    accentClass: "text-[var(--comic-secondary)]",
  },
  {
    titleKey: "sessionType3Title",
    focusKey: "sessionType3Focus",
    bodyKey: "sessionType3Body",
    accentClass: "text-[var(--comic-warning)]",
  },
  {
    titleKey: "sessionType4Title",
    focusKey: "sessionType4Focus",
    bodyKey: "sessionType4Body",
    accentClass: "text-[var(--comic-success)]",
  },
  {
    titleKey: "sessionType5Title",
    focusKey: "sessionType5Focus",
    bodyKey: "sessionType5Body",
    accentClass: "text-[var(--comic-danger)]",
  },
  {
    titleKey: "sessionType6Title",
    focusKey: "sessionType6Focus",
    bodyKey: "sessionType6Body",
    accentClass: "text-[var(--comic-purple)]",
  },
] as const;

// Session Types (formerly AI Features on this route)
function SessionTypesSection() {
  const { t } = useI18n();
  const ol = t.onlineLearning;

  return (
    <section className="comic-bg-primary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {ol.sessionTypesTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {ol.sessionTypesDesc}
          </ComicText>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {SESSION_TYPE_ENTRIES.map(({ titleKey, focusKey, bodyKey, accentClass }) => (
            <ComicCard
              key={titleKey}
              className="comic-shadow-xl text-center flex flex-col h-full min-h-0 overflow-hidden min-w-0"
            >
              <ComicTitle
                level={4}
                className={`mb-3 w-full min-w-0 max-w-full px-1 leading-tight tracking-tight break-words [overflow-wrap:anywhere] hyphens-auto ${accentClass}`}
              >
                {ol[titleKey]}
              </ComicTitle>
              <ComicText
                weight="bold"
                size="sm"
                className={`mb-4 w-full min-w-0 max-w-full px-1 break-words [overflow-wrap:anywhere] leading-snug hyphens-auto ${accentClass}`}
              >
                {ol[focusKey]}
              </ComicText>
              <ComicText
                weight="normal"
                size="sm"
                className="text-[var(--comic-dark)] text-left leading-relaxed flex-grow min-w-0 px-1 break-words [overflow-wrap:anywhere]"
              >
                {ol[bodyKey]}
              </ComicText>
            </ComicCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function SubscriptionPlanPriceFooter({
  text,
  className,
}: {
  text: string;
  /** Text color utilities (tier accent). */
  className: string;
}) {
  const idx = text.indexOf(":");
  if (idx === -1) {
    return (
      <div className={`text-center comic-text font-bold text-2xl ${className}`}>
        {text}
      </div>
    );
  }
  const headline = text.slice(0, idx + 1).trim();
  const body = text.slice(idx + 1).trim();
  return (
    <div className={`text-center comic-text ${className}`}>
      <div className="font-bold text-2xl leading-tight">{headline}</div>
      {body ? (
        <div className="font-normal text-xl leading-snug mt-1">{body}</div>
      ) : null}
    </div>
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
        <ComicText
          size="lg"
          className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto whitespace-pre-line"
        >
          {t.onlineLearning.subscriptionDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-7 pb-1 text-[var(--comic-primary)]">
            {t.onlineLearning.freeTitle}
          </ComicTitle>
          <ComicFeatureChecklist
            splitLabelAfterColon
            items={[
              t.onlineLearning.freeItem1,
              t.onlineLearning.freeItem2,
              t.onlineLearning.freeItem3,
            ]}
          />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.freeItem4}
              className="text-[var(--comic-dark)]"
            />
            <ComicButton variant="secondary" size="sm">
              {t.onlineLearning.freeButton}
            </ComicButton>
          </div>
        </ComicCard>

        <ComicCard className="comic-shadow-lg text-center border-4 border-[var(--comic-warning)] flex flex-col">
          <ComicTitle level={4} className="mb-7 pb-1 text-[var(--comic-warning)]">
            {t.onlineLearning.premiumTitle}
          </ComicTitle>
          <ComicFeatureChecklist
            splitLabelAfterColon
            items={[
              t.onlineLearning.premiumItem1,
              t.onlineLearning.premiumItem2,
              t.onlineLearning.premiumItem3,
            ]}
          />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.premiumItem4}
              className="text-[var(--comic-warning)]"
            />
            <ComicButton variant="warning" size="sm">
              {t.onlineLearning.premiumButton}
            </ComicButton>
          </div>
        </ComicCard>

        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-7 pb-1 text-[var(--comic-danger)]">
            {t.onlineLearning.proTitle}
          </ComicTitle>
          <ComicFeatureChecklist
            splitLabelAfterColon
            items={[
              t.onlineLearning.proItem1,
              t.onlineLearning.proItem2,
              t.onlineLearning.proItem3,
            ]}
          />
          <div className="mt-auto flex w-full flex-col items-center gap-3">
            <SubscriptionPlanPriceFooter
              text={t.onlineLearning.proItem4}
              className="text-[var(--comic-danger)]"
            />
            <ComicButton variant="danger" size="sm">
              {t.onlineLearning.proButton}
            </ComicButton>
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

export default function OnlineLearning() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <SubscriptionPlansSection />
      <SessionTypesSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}

