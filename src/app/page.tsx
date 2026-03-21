'use client';

import Link from "next/link";
import ComicButton from "../components/ComicButton";
import ComicCard from "../components/ComicCard";
import ComicTitle from "../components/ComicTitle";
import ComicText from "../components/ComicText";
import Footer from "../components/Footer";
import { HERO_BACKGROUND_URL } from "../constants/images";
import { useI18n } from "../i18n/I18nProvider";

// Home Section
function HomeSection() {
  const { t } = useI18n();

  return (
    <section id="home" className="flex flex-col items-center justify-center text-center py-24 px-4 comic-bg-primary relative overflow-hidden min-h-[420px] md:min-h-[520px]">
      {/* Hero background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BACKGROUND_URL})` }}
        aria-hidden
      />
      {/* Enhanced comic book style background elements */}
      <div className="absolute inset-0 z-10 pointer-events-none" aria-hidden>
        <div className="absolute top-10 left-10 w-24 h-24 comic-bg-warning rounded-full comic-border-thick comic-shadow-xl comic-bounce"></div>
        <div className="absolute top-20 right-20 w-20 h-20 comic-bg-success rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 left-20 w-16 h-16 comic-bg-danger rounded-full comic-border-thick comic-shadow-xl comic-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-10 w-12 h-12 comic-bg-secondary rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-[var(--comic-yellow)] rounded-full comic-border-thick comic-shadow-lg comic-bounce" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative z-10">
        <ComicTitle level={1} className="comic-text-white mb-8 comic-wiggle">
          {t.home.heroTitle}
        </ComicTitle>
        <ComicText size="xl" className="comic-text-white mb-12 font-bold max-w-3xl mx-auto">
          <span className="block bg-red-500/70 px-4 py-3 rounded-md">
            {t.home.heroDescription}
          </span>
        </ComicText>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/in-person-learning#booking-form">
            <ComicButton 
              variant="warning" 
              size="lg"
              className="comic-wiggle"
            >
              {t.home.startLearning}
            </ComicButton>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Mission Section
function MissionSection() {
  const { t } = useI18n();
  
  return (
    <section id="mission" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          {t.mission.title}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.mission.description}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <ComicCard variant="primary" animated className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="comic-text-white mb-4">
            {t.home.personalizedTitle}
          </ComicTitle>
          <ComicText className="comic-text-white font-bold">
            {t.home.personalizedDesc}
          </ComicText>
        </ComicCard>
        
        <ComicCard variant="secondary" animated className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="comic-text-white mb-4">
            {t.home.gamifiedTitle}
          </ComicTitle>
          <ComicText className="comic-text-white font-bold">
            {t.home.gamifiedDesc}
          </ComicText>
        </ComicCard>
        
        <ComicCard variant="accent" animated className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="comic-text-white mb-4">
            {t.home.careerTitle}
          </ComicTitle>
          <ComicText className="comic-text-white font-bold">
            {t.home.careerDesc}
          </ComicText>
        </ComicCard>
      </div>
    </section>
  );
}

// Tech Innovations Section
function TechInnovationsSection() {
  const { t } = useI18n();
  
  return (
    <section id="tech-innovations" className="comic-bg-accent py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            {t.techInnovations.title}
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            {t.techInnovations.description}
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              {t.home.aiVoiceCoachTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.home.aiVoiceCoachDesc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
              {t.home.smartAITitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.home.smartAIDesc}
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-danger)]">
              {t.home.aiVideoTitle}
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              {t.home.aiVideoDesc}
            </ComicText>
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
          {t.subscriptions.title}
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          {t.subscriptions.subscriptionsDesc}
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
            {t.subscriptions.freeTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.subscriptions.freeDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.subscriptions.freeItem1}</li>
            <li>{t.subscriptions.freeItem2}</li>
            <li>{t.subscriptions.freeItem4}</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            {t.subscriptions.comingSoon}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-lg text-center border-4 border-[var(--comic-warning)] flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
            {t.subscriptions.premiumTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.subscriptions.premiumDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.subscriptions.premiumItem1}</li>
            <li>{t.subscriptions.premiumItem2}</li>
            <li>{t.subscriptions.premiumItem3}</li>
            <li>{t.subscriptions.premiumItem4}</li>
            <li>{t.subscriptions.premiumItem5}</li>
          </ul>
          <ComicButton variant="warning" size="sm">
            {t.subscriptions.comingSoon}
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-lg text-center flex flex-col">
          <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
            {t.subscriptions.proTitle}
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            {t.subscriptions.proDesc}
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6 flex-grow">
            <li>{t.subscriptions.proItem1}</li>
            <li>{t.subscriptions.proItem2}</li>
            <li>{t.subscriptions.proItem3}</li>
            <li>{t.subscriptions.proItem4}</li>
          </ul>
          <ComicButton variant="danger" size="sm">
            {t.subscriptions.comingSoon}
          </ComicButton>
        </ComicCard>
      </div>
    </section>
  );
}


// Situational English Game Section
function _SituationalGameSection() {
  return (
    <section id="situational-game" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-success)]">
          🎮 Situational English Game
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          Master real-world English through gamified scenarios and interactive challenges. Learn by doing!
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            🏢 Business Scenarios
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Practice professional English in realistic business situations
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• Job interviews</li>
            <li>• Client meetings</li>
            <li>• Presentations</li>
            <li>• Email writing</li>
          </ul>
          <ComicButton variant="primary" size="sm">
            Play Business Game
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            🛒 Daily Life Scenarios
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Navigate everyday situations with confidence
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• Shopping & dining</li>
            <li>• Travel & transportation</li>
            <li>• Healthcare visits</li>
            <li>• Social interactions</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            Play Daily Life Game
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            🎓 Academic Scenarios
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Excel in academic and educational settings
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• Classroom discussions</li>
            <li>• Research presentations</li>
            <li>• Group projects</li>
            <li>• Academic writing</li>
          </ul>
          <ComicButton variant="warning" size="sm">
            Play Academic Game
          </ComicButton>
        </ComicCard>
      </div>
      
      {/* Game Features */}
      <div className="comic-bg-success py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
        <ComicTitle level={3} className="comic-text-white text-center mb-8">
          🏆 Game Features & Leaderboards
        </ComicTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              🎯 AI Evaluation
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              Get instant feedback on your performance
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
              🏅 Points & Badges
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              Earn rewards for your achievements
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
              🏆 Leaderboards
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              Compete with learners worldwide
            </ComicText>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              🎮 Interactive Challenges
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold">
              Voice-based interactive scenarios
            </ComicText>
          </ComicCard>
        </div>
        
        <div className="text-center mt-8">
          <ComicButton variant="warning" size="lg">
            🚀 Start Playing Now!
          </ComicButton>
        </div>
      </div>
    </section>
  );
}

// Teacher Resources Section
function _TeacherResourcesSection() {
  return (
    <section id="teacher-resources" className="comic-bg-danger py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            🛍️ Teacher Resources (Shop)
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            Professional resources for English teachers. Lesson plans, worksheets, and multimedia content to enhance your teaching.
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              📋 Lesson Plans
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Ready-to-use lesson plans for all levels
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Beginner to Advanced</li>
              <li>• Grammar & Vocabulary</li>
              <li>• Speaking & Listening</li>
              <li>• Business English</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              Browse Lesson Plans
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              📄 Worksheets & Activities
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Interactive worksheets and classroom activities
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Printable worksheets</li>
              <li>• Group activities</li>
              <li>• Assessment tools</li>
              <li>• Homework assignments</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              View Worksheets
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              🎵 Audio & Video Resources
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              High-quality multimedia content for your lessons
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Pronunciation guides</li>
              <li>• Listening exercises</li>
              <li>• Video lessons</li>
              <li>• Cultural content</li>
            </ul>
            <ComicButton variant="success" size="sm">
              Explore Media
            </ComicButton>
          </ComicCard>
        </div>
        
        {/* Resource Bundles */}
        <div className="comic-bg-primary py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
          <ComicTitle level={3} className="comic-text-white text-center mb-8">
            📦 Resource Bundles
          </ComicTitle>
          <div className="grid md:grid-cols-3 gap-6">
            <ComicCard className="comic-shadow-lg text-center">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
                🎯 Starter Bundle
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Perfect for new teachers
              </ComicText>
              <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
                <li>• 50 lesson plans</li>
                <li>• 100 worksheets</li>
                <li>• Basic audio content</li>
              </ul>
              <ComicButton variant="primary" size="sm">
                Get Starter Bundle
              </ComicButton>
            </ComicCard>
            
            <ComicCard className="comic-shadow-lg text-center border-4 border-[var(--comic-warning)]">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-warning)]">
                ⭐ Professional Bundle
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Most popular choice
              </ComicText>
              <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
                <li>• 200 lesson plans</li>
                <li>• 500 worksheets</li>
                <li>• Full audio/video library</li>
                <li>• Assessment tools</li>
              </ul>
              <ComicButton variant="warning" size="sm">
                Get Professional Bundle
              </ComicButton>
            </ComicCard>
            
            <ComicCard className="comic-shadow-lg text-center">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-danger)]">
                👑 Premium Bundle
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Everything you need
              </ComicText>
              <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
                <li>• Unlimited access</li>
                <li>• Custom content creation</li>
                <li>• Priority support</li>
                <li>• New resources monthly</li>
              </ul>
              <ComicButton variant="danger" size="sm">
                Get Premium Bundle
              </ComicButton>
            </ComicCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// In-Person Learning Section
function _InPersonLearningSection() {
  return (
    <section id="in-person-learning" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-purple)]">
          👥 In-Person Learning
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          Connect with expert teachers and fellow learners through personalized in-person sessions and group classes.
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
            👤 Private Lessons
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            One-on-one personalized instruction
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• Customized curriculum</li>
            <li>• Flexible scheduling</li>
            <li>• Individual attention</li>
            <li>• Progress tracking</li>
          </ul>
          <ComicButton variant="primary" size="sm">
            Book Private Lesson
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
            👥 Small Group Classes
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Learn with peers in intimate group settings
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• 3-6 students per class</li>
            <li>• Interactive discussions</li>
            <li>• Peer learning</li>
            <li>• Affordable rates</li>
          </ul>
          <ComicButton variant="secondary" size="sm">
            Join Group Class
          </ComicButton>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl text-center">
          <ComicTitle level={3} className="mb-4 text-[var(--comic-warning)]">
            🎓 Workshops & Seminars
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Intensive learning experiences for specific skills
          </ComicText>
          <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
            <li>• Business English workshops</li>
            <li>• Pronunciation intensives</li>
            <li>• Exam preparation</li>
            <li>• Cultural immersion</li>
          </ul>
          <ComicButton variant="warning" size="sm">
            View Workshops
          </ComicButton>
        </ComicCard>
      </div>
      
      {/* Booking System */}
      <div className="comic-bg-purple py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
        <ComicTitle level={3} className="comic-text-white text-center mb-8">
          📅 Book Your Session
        </ComicTitle>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <ComicText className="comic-text-white font-bold mb-6">
              Choose your preferred learning style and schedule your session today!
            </ComicText>
            <div className="space-y-4">
              <ComicButton variant="warning" size="lg" className="w-full">
                📅 View Available Times
              </ComicButton>
              <ComicButton variant="secondary" size="lg" className="w-full">
                💬 Chat with Our Team
              </ComicButton>
            </div>
          </div>
          <div className="comic-bg-white p-6 rounded-lg comic-border comic-shadow-md">
            <ComicTitle level={4} className="text-[var(--comic-dark)] mb-4">
              🕒 Available Time Slots
            </ComicTitle>
            <div className="space-y-2 text-[var(--comic-dark)]">
              <div className="flex justify-between">
                <span>Monday - Friday:</span>
                <span className="font-bold">9 AM - 8 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-bold">10 AM - 6 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday:</span>
                <span className="font-bold">2 PM - 6 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Community Section
function _CommunitySection() {
  return (
    <section id="community" className="comic-bg-pink py-24 px-4 comic-pattern-stripes">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            🌍 Community
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            Connect with fellow learners, practice together, and grow as part of our vibrant English learning community.
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              💬 Discussion Forum
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Ask questions and share knowledge with the community
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Grammar discussions</li>
              <li>• Cultural exchanges</li>
              <li>• Study tips & tricks</li>
              <li>• Success stories</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              Join Forum
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              👥 Study Groups
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Find study partners and practice together
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Language exchange partners</li>
              <li>• Group study sessions</li>
              <li>• Peer practice</li>
              <li>• Accountability buddies</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              Find Study Group
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              🎉 Events & Challenges
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Participate in community events and challenges
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Weekly speaking challenges</li>
              <li>• Writing competitions</li>
              <li>• Cultural events</li>
              <li>• Virtual meetups</li>
            </ul>
            <ComicButton variant="success" size="sm">
              View Events
            </ComicButton>
          </ComicCard>
        </div>
        
        {/* Community Stats */}
        <div className="comic-bg-primary py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
          <ComicTitle level={3} className="comic-text-white text-center mb-8">
            📊 Our Growing Community
          </ComicTitle>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <ComicTitle level={4} className="comic-text-white mb-2">
                10,000+
              </ComicTitle>
              <ComicText className="comic-text-white font-bold">
                Active Learners
              </ComicText>
            </div>
            <div className="text-center">
              <ComicTitle level={4} className="comic-text-white mb-2">
                50+
              </ComicTitle>
              <ComicText className="comic-text-white font-bold">
                Countries
              </ComicText>
            </div>
            <div className="text-center">
              <ComicTitle level={4} className="comic-text-white mb-2">
                500+
              </ComicTitle>
              <ComicText className="comic-text-white font-bold">
                Study Groups
              </ComicText>
            </div>
            <div className="text-center">
              <ComicTitle level={4} className="comic-text-white mb-2">
                24/7
              </ComicTitle>
              <ComicText className="comic-text-white font-bold">
                Community Support
              </ComicText>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// About Us Section
function _AboutUsSection() {
  return (
    <section id="about-us" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-primary)]">
          🏢 About Us
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          Learn about our company, mission, team, and the local impact we're making in English education.
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            🎯 Our Story
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            Founded in 2020, Englishfully was born from a simple belief: learning English should be fun, engaging, and accessible to everyone. We combine cutting-edge AI technology with proven teaching methods to create an unparalleled learning experience.
          </ComicText>
          <ComicText className="text-[var(--comic-dark)] font-bold">
            Our platform has helped over 50,000 learners from 100+ countries improve their English skills and achieve their goals.
          </ComicText>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            🌍 Local Impact
          </ComicTitle>
          <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
            We're committed to making a positive impact in our local community and beyond. Through partnerships with schools, community centers, and non-profit organizations, we provide free English education to underserved populations.
          </ComicText>
          <ul className="text-[var(--comic-dark)] space-y-2">
            <li>• 500+ free lessons provided monthly</li>
            <li>• 20+ local school partnerships</li>
            <li>• Community outreach programs</li>
            <li>• Scholarship opportunities</li>
          </ul>
        </ComicCard>
      </div>
      
      {/* Team Section */}
      <div className="comic-bg-accent py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
        <ComicTitle level={3} className="comic-text-white text-center mb-8">
          👥 Meet Our Team
        </ComicTitle>
        <div className="grid md:grid-cols-3 gap-8">
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
              👨‍💼 Leadership Team
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Experienced educators and tech innovators leading the future of language learning
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2">
              <li>• 15+ years in education</li>
              <li>• AI & machine learning experts</li>
              <li>• TESOL certified instructors</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
              👩‍🏫 Teaching Team
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Native English speakers and certified teachers from around the world
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2">
              <li>• 50+ certified instructors</li>
              <li>• Native speakers from 10+ countries</li>
              <li>• Specialized in various fields</li>
            </ul>
          </ComicCard>
          
          <ComicCard className="comic-shadow-lg text-center">
            <ComicTitle level={4} className="mb-4 text-[var(--comic-success)]">
              💻 Tech Team
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Innovative developers creating the next generation of learning technology
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2">
              <li>• AI & NLP specialists</li>
              <li>• Full-stack developers</li>
              <li>• UX/UI designers</li>
            </ul>
          </ComicCard>
        </div>
      </div>
    </section>
  );
}

// Blog Section
function _BlogSection() {
  return (
    <section id="blog" className="comic-bg-yellow py-24 px-4 comic-pattern-dots">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            📝 Blog & Insights
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            Stay updated with the latest tips, AI in education insights, and gamified learning strategies.
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              💡 Learning Tips
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Expert advice to accelerate your English learning journey
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Study techniques that work</li>
              <li>• Memory improvement strategies</li>
              <li>• Time management for learners</li>
              <li>• Motivation and goal setting</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              Read Learning Tips
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              🤖 AI in Education
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Explore how artificial intelligence is revolutionizing language learning
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Voice recognition technology</li>
              <li>• Personalized learning paths</li>
              <li>• Automated assessment tools</li>
              <li>• Future of AI in education</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              Explore AI Insights
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              🎮 Gamified Learning
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Discover how gamification makes learning more engaging and effective
            </ComicText>
            <ul className="text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Game design principles</li>
              <li>• Motivation psychology</li>
              <li>• Progress tracking systems</li>
              <li>• Community challenges</li>
            </ul>
            <ComicButton variant="success" size="sm">
              Learn About Gamification
            </ComicButton>
          </ComicCard>
        </div>
        
        {/* Featured Articles */}
        <div className="comic-bg-primary py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
          <ComicTitle level={3} className="comic-text-white text-center mb-8">
            🌟 Featured Articles
          </ComicTitle>
          <div className="grid md:grid-cols-2 gap-8">
            <ComicCard className="comic-shadow-lg">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-primary)]">
                🚀 "How AI is Transforming English Learning in 2024"
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Discover the latest AI innovations that are making English learning more personalized and effective than ever before.
              </ComicText>
              <ComicButton variant="primary" size="sm">
                Read Full Article
              </ComicButton>
            </ComicCard>
            
            <ComicCard className="comic-shadow-lg">
              <ComicTitle level={4} className="mb-4 text-[var(--comic-secondary)]">
                🎯 "5 Gamification Strategies That Actually Work"
              </ComicTitle>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
                Learn about proven gamification techniques that keep learners engaged and motivated throughout their English journey.
              </ComicText>
              <ComicButton variant="secondary" size="sm">
                Read Full Article
              </ComicButton>
            </ComicCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Section
function _ContactSection() {
  return (
    <section id="contact" className="max-w-6xl mx-auto py-24 px-4">
      <div className="text-center mb-16">
        <ComicTitle level={2} className="mb-8 text-[var(--comic-dark)]">
          📞 Contact Us
        </ComicTitle>
        <ComicText size="lg" className="text-[var(--comic-dark)] font-bold max-w-4xl mx-auto">
          Get in touch with our support team, send inquiries, or share your feedback. We're here to help!
        </ComicText>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-primary)]">
            💬 Get Support
          </ComicTitle>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 comic-bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">📧</span>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold">Email Support</ComicText>
                <ComicText className="text-[var(--comic-dark)]">support@englishfully.com</ComicText>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 comic-bg-secondary rounded-full flex items-center justify-center">
                <span className="text-white font-bold">💬</span>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold">Live Chat</ComicText>
                <ComicText className="text-[var(--comic-dark)]">Available 24/7</ComicText>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 comic-bg-warning rounded-full flex items-center justify-center">
                <span className="text-white font-bold">📱</span>
              </div>
              <div>
                <ComicText className="text-[var(--comic-dark)] font-bold">Phone Support</ComicText>
                <ComicText className="text-[var(--comic-dark)]">+1 (555) 123-4567</ComicText>
              </div>
            </div>
          </div>
        </ComicCard>
        
        <ComicCard className="comic-shadow-xl">
          <ComicTitle level={3} className="mb-6 text-[var(--comic-secondary)]">
            📝 Send Feedback
          </ComicTitle>
          <div className="space-y-4">
            <div>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Name</ComicText>
              <input type="text" className="w-full comic-input" placeholder="Your name" />
            </div>
            <div>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Email</ComicText>
              <input type="email" className="w-full comic-input" placeholder="your@email.com" />
            </div>
            <div>
              <ComicText className="text-[var(--comic-dark)] font-bold mb-2">Message</ComicText>
              <textarea className="w-full comic-textarea h-24" placeholder="Your message..."></textarea>
            </div>
            <ComicButton variant="primary" size="lg" className="w-full">
              Send Message
            </ComicButton>
          </div>
        </ComicCard>
      </div>
    </section>
  );
}

// Smart Visa Info Section
function _SmartVisaInfoSection() {
  return (
    <section id="smart-visa" className="comic-bg-accent py-24 px-4 comic-pattern-zigzag">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <ComicTitle level={2} className="comic-text-white mb-8">
            🚀 Smart Visa Info
          </ComicTitle>
          <ComicText size="lg" className="comic-text-white font-bold max-w-4xl mx-auto">
            Discover how our innovative AI technology, situational game, and local impact make Englishfully a standout choice for Smart Visa applications.
          </ComicText>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-primary)]">
              🤖 AI Innovation
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Cutting-edge artificial intelligence that revolutionizes language learning
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Advanced voice recognition</li>
              <li>• Personalized learning paths</li>
              <li>• Real-time feedback systems</li>
              <li>• Machine learning algorithms</li>
            </ul>
            <ComicButton variant="primary" size="sm">
              Learn More About AI
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-secondary)]">
              🎮 Situational Game
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Revolutionary gamified learning experience with real-world scenarios
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Interactive voice challenges</li>
              <li>• AI-powered evaluation</li>
              <li>• Global leaderboards</li>
              <li>• Real-world applications</li>
            </ul>
            <ComicButton variant="secondary" size="sm">
              Try the Game
            </ComicButton>
          </ComicCard>
          
          <ComicCard className="comic-shadow-xl text-center">
            <ComicTitle level={3} className="mb-4 text-[var(--comic-success)]">
              🌍 Local Impact
            </ComicTitle>
            <ComicText className="text-[var(--comic-dark)] font-bold mb-4">
              Making a positive difference in our community and beyond
            </ComicText>
            <ul className="text-left text-[var(--comic-dark)] space-y-2 mb-6">
              <li>• Free education programs</li>
              <li>• School partnerships</li>
              <li>• Community outreach</li>
              <li>• Social responsibility</li>
            </ul>
            <ComicButton variant="success" size="sm">
              View Our Impact
            </ComicButton>
          </ComicCard>
        </div>
        
        {/* Innovation Highlights */}
        <div className="comic-bg-primary py-12 px-8 rounded-xl comic-border-thick comic-shadow-xl">
          <ComicTitle level={3} className="comic-text-white text-center mb-8">
            🏆 Innovation Highlights
          </ComicTitle>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <ComicText className="comic-text-white font-bold mb-4">
                Our platform represents the future of language education, combining:
              </ComicText>
              <ul className="comic-text-white space-y-2">
                <li>• AI-powered personalized learning</li>
                <li>• Gamified real-world scenarios</li>
                <li>• Advanced speech recognition</li>
                <li>• Global community building</li>
                <li>• Local community impact</li>
              </ul>
            </div>
            <div className="comic-bg-white p-6 rounded-lg comic-border comic-shadow-md">
              <ComicTitle level={4} className="text-[var(--comic-dark)] mb-4">
                📊 Key Metrics
              </ComicTitle>
              <div className="space-y-2 text-[var(--comic-dark)]">
                <div className="flex justify-between">
                  <span>Active Users:</span>
                  <span className="font-bold">50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span>Countries Served:</span>
                  <span className="font-bold">100+</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Accuracy:</span>
                  <span className="font-bold">95%+</span>
                </div>
                <div className="flex justify-between">
                  <span>User Satisfaction:</span>
                  <span className="font-bold">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--comic-light)]">
      <HomeSection />
      <MissionSection />
      <TechInnovationsSection />
      <SubscriptionPlansSection />
      <div className="flex-grow" />
      <Footer />
    </div>
  );
}
