import { ROStatus } from '@/types/repair-order';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<ROStatus, string> = {
  'Open': 'status-open',
  'In Progress': 'status-in-progress',
  'Waiting for Parts': 'status-waiting',
  'Ready for Delivery': 'status-ready',
  'Delivered': 'status-delivered',
};

export function StatusBadge({ status }: { status: ROStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig[status]}`}>
      {status}
    </span>
  );
}
