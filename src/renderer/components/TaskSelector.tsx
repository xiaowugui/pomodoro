import { useState } from 'react';
import { ChevronDown, Plus, Target } from 'lucide-react';
import { useAppStore, useTimerStore } from '../stores';
import type { Task } from '@shared/types';

interface TaskSelectorProps {
  onCreateTask?: () => void;
  disabled?: boolean;
}

export default function TaskSelector({ onCreateTask, disabled = false }: TaskSelectorProps) {
  const { tasks, projects, getTodayPlannedTasks } = useAppStore();
  const { currentTaskId, setCurrentTask } = useTimerStore();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get today's planned tasks
  const todayPlannedTasks = getTodayPlannedTasks();
  
  // If there are planned tasks for today, show only those; otherwise show all active tasks
  const hasTodayPlannedTasks = todayPlannedTasks.length > 0;
  const displayTasks = hasTodayPlannedTasks ? todayPlannedTasks : tasks.filter((t) => t.status === 'active');
  const selectedTask = tasks.find((t) => t.id === currentTaskId);
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };
  
  const handleSelect = (taskId: string | null) => {
    setCurrentTask(taskId);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300 dark:hover:border-gray-600'}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {hasTodayPlannedTasks && (
            <span title="今日计划任务">
              <Target className="w-4 h-4 text-red-500 flex-shrink-0" />
            </span>
          )}
          {selectedTask ? (
            <>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getProjectColor(selectedTask.projectId) }}
              />
              <span className="text-gray-900 dark:text-white truncate">
                {selectedTask.title}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {selectedTask.completedPomodoros}/{selectedTask.estimatedPomodoros}
              </span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {hasTodayPlannedTasks ? '选择今日计划任务...' : '选择任务...'}
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-auto">
          {/* Header showing filter status */}
          {hasTodayPlannedTasks && (
            <div className="px-4 py-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 flex items-center gap-1">
              <Target className="w-3 h-3" />
              今日计划任务
            </div>
          )}
          <button
            onClick={() => handleSelect(null)}
            className="w-full px-4 py-2 text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            无任务
          </button>
          
          {displayTasks.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
              {hasTodayPlannedTasks ? '今日暂无计划任务' : '暂无活跃任务'}
            </div>
          ) : (
            displayTasks.map((task: Task) => (
              <button
                key={task.id}
                onClick={() => handleSelect(task.id)}
                className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  task.id === currentTaskId ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getProjectColor(task.projectId) }}
                />
                <span className="flex-1 truncate text-gray-900 dark:text-white">
                  {task.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {task.completedPomodoros}/{task.estimatedPomodoros}
                </span>
              </button>
            ))
          )}
          
          {onCreateTask && (
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateTask();
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
            >
              <Plus className="w-4 h-4" />
              <span>新建任务</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
