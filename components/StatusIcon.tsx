import Badge from '@/components/ui/Badge';
import { statusBadgeVariant } from '@/lib/utils/projectDisplay';
import { formatProjectStageLabel } from '@/lib/utils/projectStage';

export default function StatusIcon({ status }: { status: string }) {
  const label = formatProjectStageLabel(status);
  if (!label) return null;

  return (
    <Badge variant={statusBadgeVariant(status)} size="sm" className="shrink-0">
      {label}
    </Badge>
  );
}
