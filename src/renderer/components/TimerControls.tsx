import { Play, Pause, Square, CheckCircle } from 'lucide-react';
import { useTimerStore } from '../stores';

interface TimerControlsProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function TimerControls({ size = 'md' }: TimerControlsProps) {
  const { isRunning, phase, currentTaskId, start, pause, resume, stop, complete } = useTimerStore();
  
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const handleMainAction = () => {
    if (phase === 'idle') {
      // 传递当前选中的任务ID
      start(currentTaskId || undefined);
    } else if (isRunning) {
      pause();
    } else {
      resume();
    }
  };
  
  return (
    <div className="flex items-center gap-4">
      {phase !== 'idle' && (
        <>
          <button
            onClick={stop}
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
            title="停止"
          >
            <Square className={iconSizes[size]} fill="currentColor" />
          </button>
          
          <button
            onClick={complete}
            className={`${sizeClasses[size]} rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg`}
            title="完成"
          >
            <CheckCircle className={iconSizes[size]} />
          </button>
        </>
      )}
      
      <button
        onClick={handleMainAction}
        className={`${sizeClasses[size]} rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl`}
        title={isRunning ? '暂停' : phase === 'idle' ? '开始' : '继续'}
      >
        {isRunning ? (
          <Pause className={iconSizes[size]} fill="currentColor" />
        ) : (
          <Play className={iconSizes[size]} fill="currentColor" />
        )}
      </button>
      

    </div>
  );
}
