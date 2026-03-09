import { Play, Pause, Square, CheckCircle } from 'lucide-react';
import { useTimerStore, useAppStore } from '../stores';

interface TimerControlsProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function TimerControls({ size = 'md' }: TimerControlsProps) {
  const { isRunning, phase, currentTaskId, start, pause, resume, stop, complete } = useTimerStore();
  const { completeTask, loadAllData, tasks } = useAppStore();
  
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
  
  // 获取当前任务
  const currentTask = currentTaskId ? tasks.find(t => t.id === currentTaskId) : null;
  
  // 处理完成任务
  const handleCompleteTask = async () => {
    if (!currentTaskId || !currentTask) return;
    if (confirm('确定要完成这个任务吗？')) {
      await completeTask(currentTaskId);
      loadAllData();
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
      
      {/* 完成任务按钮 - 显示在开始按钮旁边 */}
      {currentTask && currentTask.status === 'active' && (
        <button
          onClick={handleCompleteTask}
          className={`${sizeClasses[size]} rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg`}
          title="标记任务完成"
        >
          <svg 
            className={iconSizes[size]} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </button>
      )}
      
    </div>
  );
}
