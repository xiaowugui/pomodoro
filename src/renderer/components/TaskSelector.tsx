import { useMemo, useState } from 'react';
import { Plus, AlertCircle, Clock, Clock9, Square, Check, Target } from 'lucide-react';
import { useAppStore, useTimerStore } from '../stores';
import type { Task } from '@shared/types';

interface TaskSelectorProps {
  onCreateTask?: () => void;
  disabled?: boolean;
}

// 计算任务优先级分数（用于排序）
// 分数越高越应该优先执行
const getPriorityScore = (task: Task): number => {
  const isImportant = task.isImportant ?? false;
  const isUrgent = task.isUrgent ?? false;
  
  // 重要且紧急: 4分 (最高优先级)
  // 重要不紧急: 3分
  // 紧急不重要: 2分
  // 不重要不紧急: 1分
  if (isImportant && isUrgent) return 4;
  if (isImportant && !isUrgent) return 3;
  if (!isImportant && isUrgent) return 2;
  return 1;
};

// 获取优先级信息
const getPriorityInfo = (task: Task) => {
  const isImportant = task.isImportant ?? false;
  const isUrgent = task.isUrgent ?? false;
  
  if (isImportant && isUrgent) {
    return { 
      label: '紧急重要', 
      color: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
      badge: 'bg-red-500 text-white',
      icon: AlertCircle,
      sortOrder: 1
    };
  } else if (isImportant && !isUrgent) {
    return { 
      label: '重要', 
      color: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
      badge: 'bg-blue-500 text-white',
      icon: Clock9,
      sortOrder: 2
    };
  } else if (!isImportant && isUrgent) {
    return { 
      label: '紧急', 
      color: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      badge: 'bg-yellow-500 text-white',
      icon: Clock,
      sortOrder: 3
    };
  }
  return { 
    label: '普通', 
    color: 'border-l-gray-300 bg-gray-50 dark:bg-gray-800',
    badge: 'bg-gray-400 text-white',
    icon: Square,
    sortOrder: 4
  };
};

export default function TaskSelector({ onCreateTask, disabled = false }: TaskSelectorProps) {
  const { tasks, projects, getTodayPlannedTasks } = useAppStore();
  const { currentTaskId, setCurrentTask } = useTimerStore();
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  // Get today's planned tasks
  const todayPlannedTasks = getTodayPlannedTasks();
  const hasTodayPlannedTasks = todayPlannedTasks.length > 0;
  
  // 获取活跃任务并按优先级排序
  const sortedTasks = useMemo(() => {
    // If there are planned tasks for today, show only those; otherwise show all active tasks
    const baseTasks = hasTodayPlannedTasks ? todayPlannedTasks : tasks.filter((t) => t.status === 'active');
    return baseTasks.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  }, [tasks, todayPlannedTasks, hasTodayPlannedTasks]);
  
  // 显示前3个高优先级任务 + 已选任务（如果不在前3个）
  const visibleTasks = useMemo(() => {
    const priorityTasks = sortedTasks.slice(0, 3);
    const selectedTask = sortedTasks.find(t => t.id === currentTaskId);
    
    // 如果已选任务不在前3个中，加入显示
    if (selectedTask && !priorityTasks.find(t => t.id === selectedTask.id)) {
      return [...priorityTasks, selectedTask];
    }
    return priorityTasks;
  }, [sortedTasks, currentTaskId]);
  
  const displayTasks = showAllTasks ? sortedTasks : visibleTasks;
  const selectedTask = tasks.find((t) => t.id === currentTaskId);
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '无项目';
  };
  
  const handleSelect = (taskId: string | null) => {
    setCurrentTask(taskId);
  };
  
  return (
    <div className="w-full">
      {/* 已选任务显示 */}
      {selectedTask ? (
        <div className={`mb-4 p-4 rounded-lg border-l-4 ${getPriorityInfo(selectedTask).color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">当前任务</span>
                <p className="font-medium text-gray-900 dark:text-white truncate">{selectedTask.title}</p>
              </div>
            </div>
            <button
              onClick={() => handleSelect(null)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              取消选择
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-center">请选择下方任务开始专注</p>
        </div>
      )}
      
      {/* 任务卡片列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {showAllTasks 
              ? (hasTodayPlannedTasks ? '今日计划（按优先级排序）' : '全部任务（按优先级排序）') 
              : (hasTodayPlannedTasks ? '今日计划（紧急优先）' : '推荐任务（紧急优先）')}
            {hasTodayPlannedTasks && <Target className="w-4 h-4 inline ml-1 text-red-500" />}
          </h3>
          {sortedTasks.length > 3 && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="text-sm text-red-500 hover:text-red-600"
            >
              {showAllTasks ? '收起' : `显示全部 (${sortedTasks.length})`}
            </button>
          )}
        </div>
        
        {displayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            {hasTodayPlannedTasks ? '今日暂无计划任务' : '暂无活跃任务'}
          </div>
        ) : (
          displayTasks.map((task) => {
            const priority = getPriorityInfo(task);
            const Icon = priority.icon;
            const isSelected = task.id === currentTaskId;
            
            return (
              <button
                key={task.id}
                onClick={() => handleSelect(task.id)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all ${
                  isSelected 
                    ? `${priority.color} border-l-4 ring-2 ring-red-500/20` 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* 项目颜色标记 */}
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getProjectColor(task.projectId) }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {task.title}
                      </span>
                      {/* 优先级标签 */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${priority.badge} flex-shrink-0`}>
                        <Icon className="w-3 h-3" />
                        {priority.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{getProjectName(task.projectId)}</span>
                      <span>•</span>
                      <span>番茄 {task.completedPomodoros}/{task.estimatedPomodoros}</span>
                    </div>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="flex-shrink-0 w-16">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-red-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min((task.completedPomodoros / task.estimatedPomodoros) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
        
        {/* 新建任务按钮 */}
        {onCreateTask && !disabled && (
          <button
            onClick={onCreateTask}
            className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>新建任务</span>
          </button>
        )}
      </div>
      
      {/* 优先级说明 */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">优先级说明：</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
            <AlertCircle className="w-3 h-3" /> 紧急重要 - 立即执行
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            <Clock9 className="w-3 h-3" /> 重要 - 计划执行
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
            <Clock className="w-3 h-3" /> 紧急 - 委托他人
          </span>
        </div>
      </div>
    </div>
  );
}
