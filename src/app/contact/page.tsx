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
    <section className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden comic-pattern-zigzag">
      {/* Enhanced comic book style background elements */}
      <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
      <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-0">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.contact.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          {t.contact.heroDesc}
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/online-learning">
            <ComicButton 
              variant="warning" 
              size="lg"
              className="comic-wiggle"
            >
              {t.contact.startLearning}
            </ComicButton>
          </Link>
          <Link href="/about">
            <ComicButton 
              variant="secondary" 
              size="lg"
              className="comic-wiggle"
            >
              {t.contact.learnAboutUs}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Contact Information Section
function ContactInfoSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.contact.getInTouchTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.contact.getInTouchDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.contact.emailSupportTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.contact.emailSupportDesc}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4">
            {t.contact.emailAddress}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.contact.responseTime}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.contact.liveChatTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.contact.liveChatDesc}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4">
            {t.contact.chatAvailable}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.contact.chatDays}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.contact.phoneSupportTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.contact.phoneSupportDesc}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4">
            {t.contact.phoneNumber}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.contact.phoneAvailable}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            {t.contact.officeVisitTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.contact.officeVisitDesc}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] mb-4">
            {t.contact.officeAddress}<br />
            {t.contact.officeCity}
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] text-sm">
            {t.contact.byAppointment}
          </ComicText>
        </ComicCard>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const { t } = useI18n();
  
  // General form state
  const [generalForm, setGeneralForm] = useState({
    name: '',
    email: '',
    subject: t.contact.subjectGeneral,
    message: ''
  });
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalMessage, setGeneralMessage] = useState('');

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    phone: '',
    experienceLevel: t.contact.expNew,
    message: ''
  });
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState('');

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralLoading(true);
    setGeneralMessage('');

    try {
      const response = await fetch('/api/contact/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generalForm),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneralMessage(t.contact.messageSuccess);
        setGeneralForm({ name: '', email: '', subject: t.contact.subjectGeneral, message: '' });
      } else {
        setGeneralMessage(data.error || t.contact.messageFailed);
      }
    } catch {
      setGeneralMessage(t.contact.messageFailed);
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherLoading(true);
    setTeacherMessage('');

    try {
      const response = await fetch('/api/contact/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teacherForm),
      });

      const data = await response.json();

      if (response.ok) {
        setTeacherMessage(t.contact.applicationSuccess);
        setTeacherForm({ name: '', email: '', phone: '', experienceLevel: t.contact.expNew, message: '' });
      } else {
        setTeacherMessage(data.error || t.contact.applicationFailed);
      }
    } catch {
      setTeacherMessage(t.contact.applicationFailed);
    } finally {
      setTeacherLoading(false);
    }
  };

  return (
    <section id="become-teacher" className="comic-bg-accent py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.contact.sendMessageTitle}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.contact.sendMessageDesc}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
              {t.contact.generalInquiry}
            </ComicTitle>
            <form onSubmit={handleGeneralSubmit} className="space-y-4">
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.name}</ComicText>
                <input 
                  type="text" 
                  className="w-full comic-input" 
                  placeholder={t.contact.namePlaceholder}
                  value={generalForm.name}
                  onChange={(e) => setGeneralForm({...generalForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.email}</ComicText>
                <input 
                  type="email" 
                  className="w-full comic-input" 
                  placeholder={t.contact.emailPlaceholder}
                  value={generalForm.email}
                  onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.subject}</ComicText>
                <select 
                  className="w-full comic-input"
                  value={generalForm.subject}
                  onChange={(e) => setGeneralForm({...generalForm, subject: e.target.value})}
                >
                  <option>{t.contact.subjectGeneral}</option>
                  <option>{t.contact.subjectTech}</option>
                  <option>{t.contact.subjectBilling}</option>
                  <option>{t.contact.subjectPartnership}</option>
                  <option>{t.contact.subjectFeedback}</option>
                </select>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.message}</ComicText>
                <textarea 
                  className="w-full comic-textarea h-32" 
                  placeholder={t.contact.messagePlaceholder}
                  value={generalForm.message}
                  onChange={(e) => setGeneralForm({...generalForm, message: e.target.value})}
                  required
                ></textarea>
              </div>
              {generalMessage && (
                <div className={`p-3 rounded-lg text-sm font-bold ${
                  generalMessage.includes(t.contact.messageSuccess) 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {generalMessage}
                </div>
              )}
              <ComicButton 
                variant="primary" 
                size="lg" 
                className="w-full"
                disabled={generalLoading}
              >
                {generalLoading ? t.contact.sending : t.contact.sendMessage}
              </ComicButton>
            </form>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
              {t.contact.becomeTeacher}
            </ComicTitle>
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.name}</ComicText>
                <input 
                  type="text" 
                  className="w-full comic-input" 
                  placeholder={t.contact.namePlaceholder}
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({...teacherForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.email}</ComicText>
                <input 
                  type="email" 
                  className="w-full comic-input" 
                  placeholder={t.contact.emailPlaceholder}
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.phone}</ComicText>
                <input 
                  type="tel" 
                  className="w-full comic-input" 
                  placeholder={t.contact.phonePlaceholder}
                  value={teacherForm.phone}
                  onChange={(e) => setTeacherForm({...teacherForm, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.experienceLevel}</ComicText>
                <select 
                  className="w-full comic-input"
                  value={teacherForm.experienceLevel}
                  onChange={(e) => setTeacherForm({...teacherForm, experienceLevel: e.target.value})}
                >
                  <option>{t.contact.expNew}</option>
                  <option>{t.contact.exp1to2}</option>
                  <option>{t.contact.exp3to5}</option>
                  <option>{t.contact.exp5plus}</option>
                  <option>{t.contact.expNative}</option>
                </select>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold mb-2">{t.contact.tellUsAbout}</ComicText>
                <textarea 
                  className="w-full comic-textarea h-24" 
                  placeholder={t.contact.teacherPlaceholder}
                  value={teacherForm.message}
                  onChange={(e) => setTeacherForm({...teacherForm, message: e.target.value})}
                  required
                ></textarea>
              </div>
              {teacherMessage && (
                <div className={`p-3 rounded-lg text-sm font-bold ${
                  teacherMessage.includes(t.contact.applicationSuccess) 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  {teacherMessage}
                </div>
              )}
              <ComicButton 
                variant="secondary" 
                size="lg" 
                className="w-full"
                disabled={teacherLoading}
              >
                {teacherLoading ? t.contact.submitting : t.contact.applyToTeach}
              </ComicButton>
            </form>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const { t } = useI18n();
  
  return (
    <section className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-success)]">
          {t.contact.faqTitle}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.contact.faqDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            {t.contact.faq1Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq1Answer}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            {t.contact.faq2Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq2Answer}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
            {t.contact.faq3Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq3Answer}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            {t.contact.faq4Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq4Answer}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
            {t.contact.faq5Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq5Answer}
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-accent)]">
            {t.contact.faq6Question}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            {t.contact.faq6Answer}
          </ComicText>
        </ComicCard>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HeroSection />
      <ContactInfoSection />
      <ContactFormSection />
      <FAQSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
