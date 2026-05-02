/**
 * Centralized static image URLs.
 * Logo is served directly from Cloudinary (no next/image / Vercel optimization).
 */
export const LOGO_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/englishfully/logo/logo-englishfully.png";

/** Hero background (CSS url) — not passed through next/image; no Vercel optimization. */
export const HERO_BACKGROUND_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1770485941/englishfully/hero/hero-image.jpg";

/** Onsite 1-on-1 native practice photo (in-person learning pricing card). */
export const ONSITE_ONE_ON_ONE_PRACTICE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777748303/englishfully/service/english-speaking-practic-1-and-1-coaching.png";

/** Onsite small group speaking lab photo (in-person learning pricing card). */
export const ONSITE_SMALL_GROUP_SPEAKING_LAB_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/v1777748303/englishfully/service/english-speaking-lab-small-group.png";

/** “How It Works” hero illustrations (slideshow, in-person learning). */
export const HOW_IT_WORKS_SLIDE_APP_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777756763/englishfully/service/english-learning-app.png";

export const HOW_IT_WORKS_SLIDE_ONE_ON_ONE_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777756763/englishfully/service/1-and-1-practice.png";

export const HOW_IT_WORKS_SLIDE_GOAL_URL =
  "https://res.cloudinary.com/dkbf7tvcx/image/upload/c_crop,g_north,h_0.92/v1777756763/englishfully/service/english-learning-goal.png";

export const HOW_IT_WORKS_SLIDE_URLS = [
  HOW_IT_WORKS_SLIDE_APP_URL,
  HOW_IT_WORKS_SLIDE_ONE_ON_ONE_URL,
  HOW_IT_WORKS_SLIDE_GOAL_URL,
] as const;
