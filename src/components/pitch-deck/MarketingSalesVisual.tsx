const AUDIENCES = ['Learners', 'Teachers & Schools', 'Parents & Professionals'] as const;

const CHANNELS = [
  'englishfully.com',
  'Social & content',
  'Teacher outreach',
  'School partnerships',
  'Product demos',
] as const;

const STEPS = [
  { n: '1', title: 'Try', copy: 'Freemium or trial where it fits' },
  { n: '2', title: 'Choose', copy: 'Clear EnglishFeed and Homeroom plans' },
  { n: '3', title: 'Adopt', copy: 'Consult, messaging, teacher-led value' },
  { n: '4', title: 'Expand', copy: 'Coaching tiers and Homeroom memberships' },
] as const;

const OUTCOMES = [
  'Daily engagement',
  'Skill progress',
  'Faster prep',
  'Simpler grading',
] as const;

export function MarketAudienceStamps() {
  return (
    <ul className="pitch-deck-market-audiences">
      {AUDIENCES.map((audience) => (
        <li key={audience} className="pitch-deck-market-stamp">
          {audience}
        </li>
      ))}
    </ul>
  );
}

export function StampFlow({
  steps,
  className = '',
}: {
  steps: readonly string[];
  className?: string;
}) {
  return (
    <ol className={`pitch-deck-market-flow${className ? ` ${className}` : ''}`}>
      {steps.map((label, index) => (
        <li key={label} className="pitch-deck-market-flow-item">
          <span className="pitch-deck-market-flow-stamp">{label}</span>
          {index < steps.length - 1 ? (
            <span className="pitch-deck-market-flow-arrow" aria-hidden="true">
              <svg viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 8.5h18V2.2L35.2 14 18 25.8v-6.3H0z"
                  fill="var(--brand-red)"
                  stroke="var(--brand-navy)"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function MarketChannelStamps() {
  return (
    <ul className="pitch-deck-market-channels">
      {CHANNELS.map((channel) => (
        <li key={channel} className="pitch-deck-market-channel">
          {channel}
        </li>
      ))}
    </ul>
  );
}

export default function MarketingSalesVisual() {
  return (
    <div className="pitch-deck-market">
      <section className="pitch-deck-market-band">
        <p className="pitch-deck-market-label">How they convert</p>
        <ol className="pitch-deck-market-steps">
          {STEPS.map((step) => (
            <li key={step.n} className="pitch-deck-market-step">
              <div className="pitch-deck-market-step-head">
                <span className="pitch-deck-market-step-n" aria-hidden="true">
                  {step.n}
                </span>
                <p className="pitch-deck-market-step-title">{step.title}</p>
              </div>
              <p className="pitch-deck-market-copy">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="pitch-deck-market-band">
        <p className="pitch-deck-market-label">Sold on outcomes</p>
        <ul className="pitch-deck-market-outcomes">
          {OUTCOMES.map((outcome) => (
            <li key={outcome} className="pitch-deck-market-outcome">
              {outcome}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
