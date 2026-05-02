"use client";

import Link from "next/link";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import ComicButton from "../../components/ComicButton";
import ComicCard from "../../components/ComicCard";
import ComicFeatureChecklist from "../../components/ComicFeatureChecklist";
import ComicTitle from "../../components/ComicTitle";
import ComicText from "../../components/ComicText";
import Footer from "../../components/Footer";
import {
  HOW_IT_WORKS_SLIDE_URLS,
  ONSITE_ONE_ON_ONE_PRACTICE_URL,
  ONSITE_SMALL_GROUP_SPEAKING_LAB_URL,
} from "../../constants/images";
import { useI18n } from "../../i18n/I18nProvider";

const PRIVATE_PRICING_FEATURES = [
  "privateItem1",
  "privateItem2",
  "privateItem3",
  "privateItem4",
  "privateItem5",
  "privateItem6",
] as const;

const GROUP_PRICING_FEATURES = [
  "groupItem1",
  "groupItem2",
  "groupItem3",
  "groupItem4",
  "groupItem5",
  "groupItem6",
] as const;

function PricingFeatureChecklist({
  translationKeys,
}: {
  translationKeys: readonly string[];
}) {
  const { t } = useI18n();
  const items = translationKeys.map((itemKey) =>
    String(t.inPersonLearning[itemKey as keyof typeof t.inPersonLearning])
  );

  return <ComicFeatureChecklist items={items} />;
}

function HowItWorksImageCarousel({
  slideIndex,
  setSlideIndex,
  ariaLabel,
  wrapperClassName = "",
}: {
  slideIndex: number;
  setSlideIndex: Dispatch<SetStateAction<number>>;
  ariaLabel: string;
  wrapperClassName?: string;
}) {
  const { t } = useI18n();

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % HOW_IT_WORKS_SLIDE_URLS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [setSlideIndex]);

  const slideAlts = [
    t.inPersonLearning.howItWorksSlideAlt1,
    t.inPersonLearning.howItWorksSlideAlt2,
    t.inPersonLearning.howItWorksSlideAlt3,
  ] as const;

  const slideHeads = [
    t.inPersonLearning.howItWorksSlideHead1,
    t.inPersonLearning.howItWorksSlideHead2,
    t.inPersonLearning.howItWorksSlideHead3,
  ] as const;

  return (
    <div className={`mx-auto w-full max-w-[min(100%,560px)] ${wrapperClassName}`}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className="relative"
      >
        <figure className="relative mx-auto aspect-square w-full max-h-[min(330px,60vw)] overflow-hidden rounded-2xl border-4 border-[var(--comic-black)] bg-[var(--comic-white)] comic-shadow-xl sm:max-h-[345px]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(repeating-linear-gradient(135deg,#00000006_0_10px,#00000006_10px_20px))]" />
          {HOW_IT_WORKS_SLIDE_URLS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={slideAlts[i]}
              width={900}
              height={900}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                slideIndex === i ? "opacity-100 z-[1]" : "opacity-0 z-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          ))}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-16 sm:pt-[4.25rem]"
            aria-hidden
          />
          <p
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] comic-title px-4 pb-4 pt-12 text-center text-2xl leading-tight tracking-tight text-[var(--comic-yellow)] sm:text-3xl md:pb-5 md:text-4xl"
          >
            {slideHeads[slideIndex]}
          </p>
        </figure>
        <div
          className="mt-5 flex justify-center gap-3"
          role="tablist"
          aria-label={ariaLabel}
        >
          {HOW_IT_WORKS_SLIDE_URLS.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={slideIndex === i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setSlideIndex(i)}
              className={`h-4 w-4 rounded-full border-2 border-[var(--comic-black)] transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--comic-accent)] ${
                slideIndex === i
                  ? "comic-bg-primary scale-110 comic-shadow-sm"
                  : "comic-bg-light"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hero Section
function HeroSection({
  howItWorksSlideIndex,
  setHowItWorksSlideIndex,
}: {
  howItWorksSlideIndex: number;
  setHowItWorksSlideIndex: Dispatch<SetStateAction<number>>;
}) {
  const { t } = useI18n();
  return (
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-purple relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle whitespace-pre-line">
          {t.inPersonLearning.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-10 font-bold max-w-3xl mx-auto">
          {t.inPersonLearning.heroDesc}
        </ComicText>
        <HowItWorksImageCarousel
          slideIndex={howItWorksSlideIndex}
          setSlideIndex={setHowItWorksSlideIndex}
          ariaLabel={t.inPersonLearning.howDifferentTitle}
          wrapperClassName="mb-12"
        />
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#booking-form">
            <ComicButton 
              variant="warning" 
              size="lg"
              className="comic-wiggle"
            >
              {t.inPersonLearning.bookASession}
            </ComicButton>
          </a>
        </div>
      </div>
    </section>
  );
}

function HowWeAreDifferentSection({
  slideIndex,
  setSlideIndex,
}: {
  slideIndex: number;
  setSlideIndex: Dispatch<SetStateAction<number>>;
}) {
  const { t } = useI18n();

  const cardConfig = (
    [
      {
        titleKey: "howDifferentCard1Title" as const,
        subtitleKey: "howDifferentCard1Subtitle" as const,
        bodyKey: "howDifferentCard1Body" as const,
      },
      {
        titleKey: "howDifferentCard2Title" as const,
        subtitleKey: "howDifferentCard2Subtitle" as const,
        bodyKey: "howDifferentCard2Body" as const,
      },
      {
        titleKey: "howDifferentCard3Title" as const,
        subtitleKey: "howDifferentCard3Subtitle" as const,
        bodyKey: "howDifferentCard3Body" as const,
      },
    ] as const
  ).map((c, slideIdx) => ({ ...c, slideIdx }));

  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-10 lg:mb-12">
        <ComicTitle level={2} className="mb-4 text-[var(--comic-primary)]">
          {t.inPersonLearning.howDifferentTitle}
        </ComicTitle>
      </div>

      {/* Three equal columns */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
        {cardConfig.map(({ titleKey, subtitleKey, bodyKey, slideIdx }) => (
          <div
            key={titleKey}
            role="button"
            tabIndex={0}
            onClick={() => setSlideIndex(slideIdx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSlideIndex(slideIdx);
              }
            }}
            className={`h-full min-h-0 cursor-pointer rounded-2xl outline-offset-4 transition-[box-shadow,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--comic-accent)] ${
              slideIndex === slideIdx
                ? "[&_.comic-card]:ring-4 [&_.comic-card]:ring-[var(--comic-yellow)] [&_.comic-card]:border-[var(--comic-black)]"
                : "hover:[&_.comic-card]:-translate-y-0.5"
            }`}
          >
            <ComicCard className="flex h-full min-h-[12rem] flex-col comic-shadow-xl transition-shadow">
              <ComicTitle
                level={3}
                className={`text-[var(--comic-primary)] text-center leading-tight ${subtitleKey ? "mb-2" : "mb-4"}`}
              >
                {t.inPersonLearning[titleKey]}
              </ComicTitle>
              {subtitleKey ? (
                <ComicText
                  size="sm"
                  weight="bold"
                  className="text-[var(--comic-accent)] mb-4 text-center"
                >
                  {t.inPersonLearning[subtitleKey]}
                </ComicText>
              ) : null}
              <p className="comic-text text-[var(--comic-dark)] flex-grow text-center text-base font-semibold leading-relaxed sm:text-lg">
                {t.inPersonLearning[bodyKey]}
              </p>
            </ComicCard>
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingPracticePhotoFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="mb-6 w-full mx-auto rounded-xl bg-[#e8c9a8] p-3 sm:p-3.5 comic-border-thick comic-shadow-xl">
      <div className="rounded-lg overflow-hidden border-4 border-[var(--comic-black)] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),inset_0_-3px_0_rgba(0,0,0,0.18)]">
        <img
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className="w-full aspect-[3/2] object-cover block"
          loading="lazy"
          decoding="async"
        />
      </div>
    </figure>
  );
}

// Pricing & Packages Section
function PricingPackagesSection() {
  const { t } = useI18n();
  return (
    <section className="w-full comic-bg-secondary py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
            {t.inPersonLearning.pricingTitle}
          </ComicTitle>
          <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
            {t.inPersonLearning.pricingDesc}
          </ComicText>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-0 max-w-5xl mx-auto md:items-stretch">
        <ComicCard className="comic-shadow-xl text-center flex flex-col flex-1 min-w-0 overflow-hidden">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.inPersonLearning.privateTitle}
          </ComicTitle>
          <PricingPracticePhotoFrame
            src={ONSITE_ONE_ON_ONE_PRACTICE_URL}
            alt={t.inPersonLearning.privatePhotoAlt}
          />
          <ComicText size="sm" className="text-[var(--comic-dark)] font-bold mb-4">
            {t.inPersonLearning.privateSubtitle}
          </ComicText>
          <div className="mb-4">
            <ComicText className="text-[var(--comic-dark)] font-bold text-2xl">{t.inPersonLearning.privatePrice}</ComicText>
          </div>
          <PricingFeatureChecklist translationKeys={PRIVATE_PRICING_FEATURES} />
          <ComicButton variant="primary" size="sm" href="#booking-form">
            {t.inPersonLearning.bookPrivate}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center flex flex-col flex-1 min-w-0 overflow-hidden">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.inPersonLearning.groupTitle}
          </ComicTitle>
          <PricingPracticePhotoFrame
            src={ONSITE_SMALL_GROUP_SPEAKING_LAB_URL}
            alt={t.inPersonLearning.groupPhotoAlt}
          />
          <ComicText size="sm" className="text-[var(--comic-dark)] font-bold mb-4">
            {t.inPersonLearning.groupSubtitle}
          </ComicText>
          <div className="mb-4">
            <ComicText className="text-[var(--comic-dark)] font-bold text-2xl">{t.inPersonLearning.groupPrice}</ComicText>
          </div>
          <PricingFeatureChecklist translationKeys={GROUP_PRICING_FEATURES} />
          <ComicButton variant="secondary" size="sm" href="#booking-form">
            {t.inPersonLearning.joinGroup}
          </ComicButton>
        </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Booking System Section
function BookingSystemSection() {
  const { t } = useI18n();
  // Form state
  type SessionTypeKey = 'learningType1' | 'learningType2' | 'learningType3';

  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    learningTypeOption: 'learningType1' as SessionTypeKey,
    englishLevel: 'Beginner'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/contact/in-person-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone,
          learningType: t.inPersonLearning[bookingForm.learningTypeOption],
          englishLevel: bookingForm.englishLevel,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Booking request submitted successfully! We\'ll contact you soon to confirm your session.');
        setBookingForm({ name: '', email: '', phone: '', learningTypeOption: 'learningType1', englishLevel: 'Beginner' });
      } else {
        setMessage(data.error || 'Failed to submit booking request. Please try again.');
      }
    } catch {
      setMessage('Failed to submit booking request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking-form" className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.inPersonLearning.bookTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.inPersonLearning.bookDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.inPersonLearning.timeSlotsTitle}
            </ComicTitle>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-4 comic-bg-light rounded-lg comic-border">
                <div>
                  <ComicText className="text-[var(--comic-dark)] font-bold">{t.inPersonLearning.mondayFriday}</ComicText>
                  <ComicText className="text-[var(--comic-dark)]">{t.inPersonLearning.morningEvening}</ComicText>
                </div>
                <ComicText className="text-[var(--comic-primary)] font-bold">{t.inPersonLearning.time1}</ComicText>
              </div>
              <div className="flex justify-between items-center p-4 comic-bg-light rounded-lg comic-border">
                <div>
                  <ComicText className="text-[var(--comic-dark)] font-bold">{t.inPersonLearning.saturday}</ComicText>
                  <ComicText className="text-[var(--comic-dark)]">{t.inPersonLearning.weekendSessions}</ComicText>
                </div>
                <ComicText className="text-[var(--comic-primary)] font-bold">{t.inPersonLearning.time2}</ComicText>
              </div>
              <div className="flex justify-between items-center p-4 comic-bg-light rounded-lg comic-border">
                <div>
                  <ComicText className="text-[var(--comic-dark)] font-bold">{t.inPersonLearning.sunday}</ComicText>
                  <ComicText className="text-[var(--comic-dark)]">{t.inPersonLearning.limitedSessions}</ComicText>
                </div>
                <ComicText className="text-[var(--comic-primary)] font-bold">{t.inPersonLearning.time3}</ComicText>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link href="https://calendly.com/hello-englishfully/1-hour-in-person-meeting" target="_blank" rel="noopener noreferrer">
                <ComicButton variant="warning" size="lg" className="w-full mb-6">
                  {t.inPersonLearning.viewOnlineAvailability}
                </ComicButton>
              </Link>
              <Link href="https://calendly.com/hello-englishfully/1-hour-in-person-meeting" target="_blank" rel="noopener noreferrer">
                <ComicButton variant="secondary" size="lg" className="w-full">
                  {t.inPersonLearning.viewInPersonAvailability}
                </ComicButton>
              </Link>
            </div>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.inPersonLearning.bookingFormTitle}
            </ComicTitle>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.inPersonLearning.nameLabel}</ComicText>
                <input 
                  type="text" 
                  className="w-full comic-input" 
                  placeholder={t.inPersonLearning.namePlaceholder}
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.inPersonLearning.emailLabel}</ComicText>
                <input 
                  type="email" 
                  className="w-full comic-input" 
                  placeholder={t.inPersonLearning.emailPlaceholder}
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.inPersonLearning.phoneLabel}</ComicText>
                <input 
                  type="tel" 
                  className="w-full comic-input" 
                  placeholder={t.inPersonLearning.phonePlaceholder}
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.inPersonLearning.learningTypeLabel}</ComicText>
                <select 
                  className="w-full comic-input"
                  value={bookingForm.learningTypeOption}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      learningTypeOption: e.target.value as SessionTypeKey,
                    })
                  }
                >
                  <option value="learningType1">{t.inPersonLearning.learningType1}</option>
                  <option value="learningType2">{t.inPersonLearning.learningType2}</option>
                  <option value="learningType3">{t.inPersonLearning.learningType3}</option>
                </select>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.inPersonLearning.englishLevelLabel}</ComicText>
                <select 
                  className="w-full comic-input"
                  value={bookingForm.englishLevel}
                  onChange={(e) => setBookingForm({...bookingForm, englishLevel: e.target.value})}
                >
                  <option>{t.inPersonLearning.levelBeginner}</option>
                  <option>{t.inPersonLearning.levelIntermediate}</option>
                  <option>{t.inPersonLearning.levelAdvanced}</option>
                  <option>{t.inPersonLearning.levelNotSure}</option>
                </select>
              </div>
              {message && (
                <p
                  role="status"
                  className={`comic-text p-3 rounded-lg text-sm font-bold leading-snug ${
                    message.includes('successfully')
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {message}
                </p>
              )}
              <ComicButton 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={loading}
              >
                {loading ? t.inPersonLearning.submitting : t.inPersonLearning.requestBooking}
              </ComicButton>
            </form>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}


export default function InPersonLearning() {
  const [howItWorksSlideIndex, setHowItWorksSlideIndex] = useState(0);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection
        howItWorksSlideIndex={howItWorksSlideIndex}
        setHowItWorksSlideIndex={setHowItWorksSlideIndex}
      />
      <HowWeAreDifferentSection
        slideIndex={howItWorksSlideIndex}
        setSlideIndex={setHowItWorksSlideIndex}
      />
      <PricingPackagesSection />
      <BookingSystemSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
