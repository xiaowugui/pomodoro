import { useTimerStore } from '../stores';

interface TimerDisplayProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function TimerDisplay({ size = 'lg' }: TimerDisplayProps) {
  const { timeRemaining, totalTime, phase, getFormattedTime, getPhaseLabel } = useTimerStore();
  
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const sizeClasses = {
    sm: { container: 'w-32 h-32', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'w-48 h-48', text: 'text-4xl', label: 'text-sm' },
    lg: { container: 'w-72 h-72', text: 'text-6xl', label: 'text-base' },
  };
  
  const classes = sizeClasses[size];
  
  const getPhaseColor = () => {
    switch (phase) {
      case 'work':
        return 'stroke-red-500';
      case 'short_break':
        return 'stroke-green-500';
      case 'long_break':
        return 'stroke-blue-500';
      default:
        return 'stroke-gray-400';
    }
  };
  
  return (
    <div className={`relative ${classes.container} flex items-center justify-center`}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
        <circle
          cx="130"
          cy="130"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="130"
          cy="130"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={`${getPhaseColor()} transition-all duration-1000 ease-linear`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-mono font-bold text-gray-900 dark:text-white ${classes.text}`}>
          {getFormattedTime()}
        </span>
        <span className={`mt-2 text-gray-500 dark:text-gray-400 ${classes.label}`}>
          {getPhaseLabel()}
        </span>
      </div>
    </div>
  );
}
