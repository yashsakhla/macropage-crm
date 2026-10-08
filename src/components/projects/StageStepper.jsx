import { Check } from 'lucide-react';
import { PROJECT_STAGES } from '../../constants/index.js';

// Horizontal stage stepper (project lifecycle by default; pass `stages` for e.g. the lead pipeline). Pass onSelect to make the steps clickable (admin only).
export default function StageStepper({ stage, onSelect, stages = PROJECT_STAGES }) {
  const idx = stages.findIndex((s) => s.key === stage);
  return (
    <div className="stepper-wrap">
      <div className="stepper">
        {stages.map((s, i) => (
          <button
            key={s.key}
            type="button"
            title={s.hint}
            disabled={!onSelect}
            onClick={() => onSelect && onSelect(s.key)}
            className={`step ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}
          >
            <span className="dot">{i < idx ? <Check size={14} /> : i + 1}</span>
            <span className="step-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
