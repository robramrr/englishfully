export type Language = 'en' | 'th';

export interface Translations {
  nav: {
    aiFeatures: string;
    students: string;
    teachers: string;
    about: string;
    companyOverview: string;
    blog: string;
    contact: string;
    downloadApp: string;
    onlineLearning: string;
    inPersonLearning: string;
    lessonPlans: string;
    worksheets: string;
    rdTechnology: string;
  };
  ai: {
    voiceCoach: string;
    visualPhonics: string;
    chatSimulator: string;
    lessonGenerator: string;
    storyLearning: string;
    videoLearning: string;
  };
  home: {
    heroTitle: string;
    heroDescription: string;
    startLearning: string;
    personalizedTitle: string;
    personalizedDesc: string;
    gamifiedTitle: string;
    gamifiedDesc: string;
    careerTitle: string;
    careerDesc: string;
    aiVoiceCoachTitle: string;
    aiVoiceCoachDesc: string;
    visualPhonicsTitle: string;
    visualPhonicsDesc: string;
    aiConversationTitle: string;
    aiConversationDesc: string;
    smartAITitle: string;
    smartAIDesc: string;
    narrativeAITitle: string;
    narrativeAIDesc: string;
    aiVideoTitle: string;
    aiVideoDesc: string;
  };
  mission: {
    title: string;
    description: string;
  };
  techInnovations: {
    title: string;
    description: string;
  };
  courses: {
    title: string;
    description: string;
    beginnerTitle: string;
    beginnerDesc: string;
    beginnerItem1: string;
    beginnerItem2: string;
    beginnerItem3: string;
    beginnerItem4: string;
    beginnerButton: string;
    intermediateTitle: string;
    intermediateDesc: string;
    intermediateItem1: string;
    intermediateItem2: string;
    intermediateItem3: string;
    intermediateItem4: string;
    intermediateButton: string;
    advancedTitle: string;
    advancedDesc: string;
    advancedItem1: string;
    advancedItem2: string;
    advancedItem3: string;
    advancedItem4: string;
    advancedButton: string;
  };
  subscriptions: {
    title: string;
    subscriptionsDesc: string;
    freeTitle: string;
    freeDesc: string;
    freeItem1: string;
    freeItem2: string;
    freeItem3?: string;
    freeItem4: string;
    freeButton: string;
    comingSoon: string;
    premiumTitle: string;
    premiumDesc: string;
    premiumItem1: string;
    premiumItem2: string;
    premiumItem3: string;
    premiumItem4: string;
    premiumItem5: string;
    premiumButton: string;
    proTitle: string;
    proDesc: string;
    proItem1: string;
    proItem2: string;
    proItem3: string;
    proItem4: string;
    proButton: string;
  };
  footer: {
    getInTouch: string;
    contactUs: string;
    chatWithUs: string;
    followUs: string;
    readyToStart: string;
    joinNow: string;
    downloadApp: string;
    appStore: string;
    googlePlay: string;
    copyright: string;
  };
  about: Record<string, string>;
  rdTechnology: Record<string, string>;
  onlineLearning: Record<string, string>;
  blog: Record<string, string>;
  contact: Record<string, string>;
  community: Record<string, string>;
  inPersonLearning: Record<string, string>;
  teacherResources: Record<string, string>;
  aiVoiceCoach: Record<string, string>;
  aiConversationSimulator: Record<string, string>;
  aiLessonGenerator: Record<string, string>;
  aiStoryLearning: Record<string, string>;
  aiVideoLearning: Record<string, string>;
  aiVisualPhonics: Record<string, string>;
}

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}
