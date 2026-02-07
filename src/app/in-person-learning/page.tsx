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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-purple relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.inPersonLearning.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.inPersonLearning.heroDesc}
        </ComicText>
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

// Pricing & Packages Section
function PricingPackagesSection() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.inPersonLearning.pricingTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.inPersonLearning.pricingDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.inPersonLearning.privateTitle}
          </ComicTitle>
          <div className="mb-4">
            <ComicText className="text-[var(--comic-dark)] font-bold text-2xl">{t.inPersonLearning.privatePrice}</ComicText>
          </div>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>• {t.inPersonLearning.privateItem1}</li>
            <li>• {t.inPersonLearning.privateItem2}</li>
            <li>• {t.inPersonLearning.privateItem3}</li>
            <li>• {t.inPersonLearning.privateItem4}</li>
            <li>• {t.inPersonLearning.privateItem5}</li>
            <li>• {t.inPersonLearning.privateItem6}</li>
          </ul>
          <ComicButton variant="primary" size="sm">
            {t.inPersonLearning.bookPrivate}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.inPersonLearning.groupTitle}
          </ComicTitle>
          <div className="mb-4">
            <ComicText className="text-[var(--comic-dark)] font-bold text-2xl">{t.inPersonLearning.groupPrice}</ComicText>
          </div>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>• {t.inPersonLearning.groupItem1}</li>
            <li>• {t.inPersonLearning.groupItem2}</li>
            <li>• {t.inPersonLearning.groupItem3}</li>
            <li>• {t.inPersonLearning.groupItem4}</li>
            <li>• {t.inPersonLearning.groupItem5}</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            {t.inPersonLearning.joinGroup}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center flex flex-col">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            {t.inPersonLearning.tenSessionTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.inPersonLearning.tenSessionDesc}
          </ComicText>
          <div className="mb-6 flex-grow">
            <ComicText className="text-[var(--comic-dark)] font-bold text-2xl">{t.inPersonLearning.tenSessionPrice}</ComicText>
            <ComicText className="text-[var(--comic-dark)]">{t.inPersonLearning.tenSessionRegular}</ComicText>
          </div>
          <ComicButton variant="warning" size="sm">
            {t.inPersonLearning.getPackageDeal}
          </ComicButton>
        </ComicCard>
      </div>
    </section>
  );
}

// Booking System Section
function BookingSystemSection() {
  const { t } = useI18n();
  // Form state
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    learningType: 'Private Lesson',
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
        body: JSON.stringify(bookingForm),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Booking request submitted successfully! We\'ll contact you soon to confirm your session.');
        setBookingForm({ name: '', email: '', phone: '', learningType: 'Private Lesson', englishLevel: 'Beginner' });
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
                  value={bookingForm.learningType}
                  onChange={(e) => setBookingForm({...bookingForm, learningType: e.target.value})}
                >
                  <option>{t.inPersonLearning.learningType1}</option>
                  <option>{t.inPersonLearning.learningType2}</option>
                  <option>{t.inPersonLearning.learningType3}</option>
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
                <div className={`p-3 rounded-lg text-sm font-bold ${
                  message.includes('successfully') 
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
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <PricingPackagesSection />
      <BookingSystemSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
