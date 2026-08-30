import { StampFlow } from './MarketingSalesVisual';

const AFTER_FLOW = [
  'Input',
  'Create',
  'Present',
  'Assign',
  'Assess',
  'Track',
] as const;

const PRACTICE_STAMPS = [
  'Presentation',
  'QR Speaking',
  'Listening',
  'Gradebook',
] as const;

const METRICS = [
  { value: '100+', label: 'Students reached', fill: 100 },
  { value: '100+', label: 'Speaking submissions', fill: 100 },
  { value: '5+', label: 'Activities created', fill: 18 },
  { value: '2', label: 'Assessments', fill: 12 },
  { value: '1', label: 'Live classroom', fill: 8 },
] as const;

export default function HomeroomCaseStudy() {
  return (
    <div className="pitch-deck-case">
      <div className="pitch-deck-case-setup">
        <article className="pitch-deck-case-card">
          <p className="pitch-deck-case-stamp">Environment</p>
          <p className="pitch-deck-case-copy">Thai secondary-school English classroom</p>
        </article>
        <article className="pitch-deck-case-card">
          <p className="pitch-deck-case-stamp">Challenge</p>
          <p className="pitch-deck-case-copy">
            Limited preparation time, mixed proficiency levels, and the need for engaging
            speaking/listening activities and structured assessment.
          </p>
        </article>
        <article className="pitch-deck-case-card pitch-deck-case-card--solution">
          <p className="pitch-deck-case-stamp">Solution</p>
          <p className="pitch-deck-case-copy">
            Homeroom Tools — a unified workflow. Tool used in practice:
          </p>
          <ul className="pitch-deck-case-practice">
            {PRACTICE_STAMPS.map((label) => (
              <li key={label} className="pitch-deck-market-flow-stamp">
                {label}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="pitch-deck-case-band">
        <p className="pitch-deck-case-label">Workflow</p>
        <div className="pitch-deck-case-workflow">
          <article className="pitch-deck-case-card pitch-deck-case-card--before">
            <p className="pitch-deck-case-stamp pitch-deck-case-stamp--muted">Before</p>
            <p className="pitch-deck-case-copy">
              Multiple resources · Manual preparation · Separate assessment
            </p>
          </article>
          <article className="pitch-deck-case-card">
            <div className="pitch-deck-case-card-head">
              <p className="pitch-deck-case-stamp">After</p>
              <p className="pitch-deck-case-copy">
                <strong>Homeroom Tools</strong>
              </p>
            </div>
            <StampFlow steps={AFTER_FLOW} />
          </article>
          <article className="pitch-deck-case-card">
            <p className="pitch-deck-case-stamp">Result</p>
            <p className="pitch-deck-case-copy">
              More structured lessons · Easier student participation · Centralized assessment
            </p>
          </article>
        </div>
      </section>

      <section className="pitch-deck-case-band">
        <p className="pitch-deck-case-label">Evidence</p>
        <ul className="pitch-deck-case-metrics">
          {METRICS.map((metric) => (
            <li key={metric.label} className="pitch-deck-case-metric">
              <p className="pitch-deck-case-metric-value">{metric.value}</p>
              <p className="pitch-deck-case-metric-label">{metric.label}</p>
              <div className="pitch-deck-case-metric-bar" aria-hidden="true">
                <span style={{ width: `${metric.fill}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
