import type { BadgeVariant } from '@/components/ui/Badge';
import { formatStatusLabel } from '@/lib/utils/formatStatus';

export function defenseStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case 'pending':
      return { label: formatStatusLabel('pending'), variant: 'warning' };
    case 'approved':
      return { label: formatStatusLabel('approved'), variant: 'success' };
    case 'moved':
      return { label: formatStatusLabel('moved'), variant: 'primary' };
    case 'rejected':
      return { label: formatStatusLabel('rejected'), variant: 'error' };
    case 'scheduled':
      return { label: formatStatusLabel('scheduled'), variant: 'default' };
    case 'completed':
      return { label: formatStatusLabel('completed'), variant: 'success' };
    case 'cancelled':
      return { label: formatStatusLabel('cancelled'), variant: 'error' };
    default:
      return { label: formatStatusLabel(status), variant: 'default' };
  }
}
