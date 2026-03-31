'use client';

type ProgressSize = 'sm' | 'md' | 'lg';
type ProgressColor = 'blue' | 'green' | 'red' | 'yellow';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: ProgressColor | string;
  size?: ProgressSize;
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: 'h-1.5',
  md: 'h-3',
  lg: 'h-5',
};

const presetColors: Record<ProgressColor, string> = {
  blue: '#e58300',
  green: '#4CAF50',
  red: '#ef4444',
  yellow: '#f59e0b',
};

export default function ProgressBar({
  value,
  label,
  color = 'blue',
  size = 'md',
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const fillColor = presetColors[color as ProgressColor] || color;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-[#3d6b6b]/70">
            {label}
          </span>
          <span className="text-sm font-medium text-[#3d6b6b] tabular-nums">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div
        className={`
          relative w-full rounded-full overflow-hidden
          bg-gray-200
          ${sizeStyles[size]}
        `}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${clampedValue}%`,
            backgroundColor: fillColor,
          }}
        />
      </div>
    </div>
  );
}
