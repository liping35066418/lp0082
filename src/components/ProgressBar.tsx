import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const heightClasses: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

function getProgressColor(progress: number): string {
  if (progress < 30) return 'from-red-500 to-orange-500';
  if (progress < 60) return 'from-orange-500 to-yellow-500';
  if (progress < 80) return 'from-yellow-500 to-green-500';
  return 'from-green-500 to-emerald-500';
}

export default function ProgressBar({
  progress,
  color,
  height = 'md',
  showLabel = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const gradientColor = color || getProgressColor(clampedProgress);

  return (
    <div className="w-full">
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          heightClasses[height]
        )}
      >
        <div
          className={cn(
            'h-full bg-gradient-to-r rounded-full transition-all duration-500 ease-out',
            gradientColor
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-xs font-medium text-gray-500">
            {clampedProgress}%
          </span>
        </div>
      )}
    </div>
  );
}
