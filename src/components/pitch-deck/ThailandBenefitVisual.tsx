import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartColumn, faUsers } from '@fortawesome/free-solid-svg-icons';

function ThaiFlagIcon() {
  return (
    <svg viewBox="0 0 90 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="90" height="10" y="0" fill="#A51931" />
      <rect width="90" height="10" y="10" fill="#FFFFFF" />
      <rect width="90" height="20" y="20" fill="#2D2A4A" />
      <rect width="90" height="10" y="40" fill="#FFFFFF" />
      <rect width="90" height="10" y="50" fill="#A51931" />
    </svg>
  );
}

const POINTS = [
  {
    key: 'flag',
    icon: 'flag' as const,
    copy: 'Built in Thailand for Thai learners',
  },
  {
    key: 'people',
    icon: 'people' as const,
    copy: 'Aligned with local classroom realities',
  },
  {
    key: 'chart',
    icon: 'chart' as const,
    copy: "Supporting Thailand's digital education priorities",
  },
] as const;

export default function ThailandBenefitVisual() {
  return (
    <ul className="pitch-deck-thailand-points">
      {POINTS.map((point) => (
        <li key={point.key} className="pitch-deck-thailand-point">
          <span
            className={`pitch-deck-thailand-circle${
              point.icon === 'flag' ? ' pitch-deck-thailand-circle--flag' : ''
            }`}
            aria-hidden="true"
          >
            {point.icon === 'flag' ? (
              <ThaiFlagIcon />
            ) : (
              <FontAwesomeIcon icon={point.icon === 'people' ? faUsers : faChartColumn} />
            )}
          </span>
          <p className="pitch-deck-thailand-point-copy">{point.copy}</p>
        </li>
      ))}
    </ul>
  );
}
