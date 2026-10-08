import { DEV_TRACKS } from '../../constants/index.js';
import { devAverage } from '../../utils/metrics.js';
import { ProgressBar } from '../ui/index.jsx';

// The four "In Progress" sub-levels, each tracked as an independent percentage.
// Frontend and Backend move independently of each other.
export default function DevProgress({ project, onChange }) {
  return (
    <div>
      {DEV_TRACKS.map((t) => {
        const v = Number(project.dev?.[t.key]) || 0;
        return (
          <div className="track-row" key={t.key}>
            <div className="top">
              <div>
                <div className="bold">{t.label}</div>
                {(t.key === 'frontend' || t.key === 'backend') && <div className="small muted">Independent track</div>}
              </div>
              {onChange ? (
                <div className="row">
                  <input
                    className="input pct"
                    type="number"
                    min="0"
                    max="100"
                    value={v}
                    onChange={(e) => onChange(t.key, e.target.value)}
                    aria-label={`${t.label} percent`}
                  />
                  <span className="muted">%</span>
                </div>
              ) : (
                <b>{v}%</b>
              )}
            </div>
            {onChange ? (
              <input className="range" type="range" min="0" max="100" step="5" value={v} onChange={(e) => onChange(t.key, e.target.value)} />
            ) : (
              <ProgressBar value={v} color={t.color} />
            )}
          </div>
        );
      })}
      <div className="row between" style={{ marginTop: 10 }}>
        <span className="muted">Average of the four tracks</span>
        <b>{devAverage(project)}%</b>
      </div>
    </div>
  );
}
