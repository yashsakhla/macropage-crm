import { LEAD_STAGE_MAP, PROJECT_STAGE_MAP } from '../../constants/index.js';
import { Badge } from './index.jsx';

export function LeadStageBadge({ stage }) {
  const s = LEAD_STAGE_MAP[stage];
  return <Badge color={s?.color}>{s?.label || stage}</Badge>;
}

export function ProjectStageBadge({ stage }) {
  const s = PROJECT_STAGE_MAP[stage];
  return <Badge color={s?.color}>{s?.label || stage}</Badge>;
}
