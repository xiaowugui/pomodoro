import { Play, Pause, Square, CheckCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTimerStore, useAppStore } from '../stores';

interface TimerControlsProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function TimerControls({ size = 'md' }: TimerControlsProps) {
  const { t } = useTranslation();
  const { isRunning, phase, currentTaskId, start, pause, resume, stop, complete } = useTimerStore();
  const { completeTask, tasks } = useAppStore();
  
  // Get current task to check if it's already completed
  const currentTask = currentTaskId ? tasks.find(t => t.id === currentTaskId) : null;
  const isTaskCompleted = currentTask?.status === 'completed';
  
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
  
  const handleCompleteTask = async () => {
    if (currentTaskId && !isTaskCompleted) {
      try {
        await completeTask(currentTaskId);
      } catch (error) {
        console.error('Failed to complete task:', error);
      }
    }
  };
  
  return (
    <div className="flex items-center gap-4">
      {phase !== 'idle' && (
        <>
          <button
            onClick={stop}
            className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2`}
            aria-label={t('timer.stop')}
          >
            <Square className={iconSizes[size]} fill="currentColor" aria-hidden="true" />
          </button>
          
          <button
            onClick={complete}
            className={`${sizeClasses[size]} rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2`}
            aria-label={t('timer.skip')}
          >
            <CheckCircle className={iconSizes[size]} aria-hidden="true" />
          </button>
        </>
      )}
      
      <button
        onClick={handleMainAction}
        className={`${sizeClasses[size]} rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2`}
        aria-label={isRunning ? t('timer.pause') : phase === 'idle' ? t('timer.start') : t('timer.resume')}
      >
        {isRunning ? (
          <Pause className={iconSizes[size]} fill="currentColor" aria-hidden="true" />
        ) : (
          <Play className={iconSizes[size]} fill="currentColor" aria-hidden="true" />
        )}
      </button>

      {/* Complete Task button - shown when timer is idle and there's a current task that isn't completed */}
      {phase === 'idle' && currentTaskId && !isTaskCompleted && (
        <button
          onClick={handleCompleteTask}
          className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2`}
          aria-label={t('tasks.completedPomodoros')}
        >
          <CheckCircle2 className={iconSizes[size]} aria-hidden="true" />
        </button>
      )}
      
    </div>
  );
}
