import Badge from '@/components/ui/Badge';
import { formatStatusLabel } from '@/lib/utils/formatStatus';
import { statusBadgeVariant } from '@/lib/utils/projectDisplay';

export default function StatusIcon({ status }: { status: string }) {
  const label = formatStatusLabel(status);
  if (!label) return null;

  return (
    <Badge variant={statusBadgeVariant(status)} size="sm" className="capitalize shrink-0">
      {label}
    </Badge>
  );
}
