import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: '待开始', color: 'bg-gray-100 text-gray-800' },
  in_progress: { text: '进行中', color: 'bg-blue-100 text-blue-800' },
  completed: { text: '已完成', color: 'bg-green-100 text-green-800' },
  delayed: { text: '已逾期', color: 'bg-red-100 text-red-800' },
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.color,
        sizeClasses[size]
      )}
    >
      {config.text}
    </span>
  );
}
