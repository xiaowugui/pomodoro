import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Clock, Trash2, Edit2, Play, MoreVertical, AlertCircle, Clock9, Bot, Zap, FileText } from 'lucide-react';
import { useAppStore } from '../stores';
import { Task, TaskType } from '@shared/types';

interface TaskListProps {
  tasks?: Task[];
  projectId?: string | null;
  onEdit?: (task: Task) => void;
  onSelect?: (task: Task) => void;
  showFilters?: boolean;
  onOpenNotes?: (taskId: string) => void;
  externalFilter?: 'all' | 'active' | 'completed';
}

export default function TaskList({ 
  tasks: propTasks, 
  projectId, 
  onEdit, 
  onSelect,
  showFilters = true,
  onOpenNotes,
  externalFilter
}: TaskListProps) {
  const { tasks: allTasks, projects, completeTask, deleteTask } = useAppStore();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');
  const { t } = useTranslation();
  
  const tasks = propTasks || allTasks;
  
  // Use external filter if provided, otherwise default to 'active'
  const effectiveFilter = externalFilter || 'active';
  
  const filteredTasks = tasks.filter((task) => {
    if (projectId && task.projectId !== projectId) return false;
    if (effectiveFilter === 'active') return task.status === 'active';
    if (effectiveFilter === 'completed') return task.status === 'completed';
    if (typeFilter !== 'all') return (task.taskType || 'normal') === typeFilter;
    return true;
  });
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || t('tasks.noProject');
  };
  
  // 获取任务类型信息
  const getTaskTypeInfo = (task: Task): { label: string; color: string; icon: typeof Bot } | null => {
    const taskType = task.taskType || 'normal';
    if (taskType === 'ai') {
      return { label: t('tasks.ai'), color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Bot };
    }
    if (taskType === 'normal') {
      return { label: t('tasks.normal'), color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', icon: FileText };
    }
    return null;
  };

  // 获取任务优先级信息
  const getPriorityInfo = (task: Task) => {
    const isImportant = task.isImportant ?? false;
    const isUrgent = task.isUrgent ?? false;
    
    if (isImportant && isUrgent) {
      return { label: t('tasks.quadrant.importantUrgent'), color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle };
    } else if (isImportant && !isUrgent) {
      return { label: t('tasks.quadrant.important'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock9 };
    } else if (!isImportant && isUrgent) {
      return { label: t('tasks.quadrant.urgent'), color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertCircle };
    }
    return null;
  };
  
  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };
  
  const handleDelete = async (taskId: string) => {
    if (confirm(t('tasks.confirmDelete'))) {
      await deleteTask(taskId);
    }
    setMenuOpenId(null);
  };
  
  return (
    <div className="space-y-4">
      {showFilters && !externalFilter && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  // This branch won't be reached when externalFilter is provided
                  // But we need a valid handler
                }}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                  effectiveFilter === f
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f === 'all' ? t('tasks.all') : f === 'active' ? t('tasks.active') : t('tasks.completed')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('tasks.normal')}:</span>
            {(['all', 'ai', 'normal'] as const).map((taskType) => (
              <button
                key={taskType}
                onClick={() => setTypeFilter(taskType)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  typeFilter === taskType
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {taskType === 'all' ? t('tasks.all') : taskType === 'ai' ? t('tasks.ai') : t('tasks.normal')}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow ${
              task.status === 'completed' ? 'opacity-60' : ''
            }`}
            onDoubleClick={() => onOpenNotes?.(task.id)}
          >
            <button
              onClick={() => handleComplete(task.id)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
              }`}
            >
              {task.status === 'completed' && <Check className="w-3 h-3 text-white" />}
            </button>
            
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => onSelect?.(task)}
            >
              <p className={`font-medium truncate ${
                task.status === 'completed'
                  ? 'text-gray-500 dark:text-gray-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span 
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: getProjectColor(task.projectId) }}
                />
                <span>{getProjectName(task.projectId)}</span>
                {(() => {
                  const taskTypeInfo = getTaskTypeInfo(task);
                  if (!taskTypeInfo) return null;
                  const Icon = taskTypeInfo.icon;
                  return (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${taskTypeInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      {taskTypeInfo.label}
                    </span>
                  );
                })()}
                {(() => {
                  const priority = getPriorityInfo(task);
                  if (!priority) return null;
                  const Icon = priority.icon;
                  return (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${priority.color}`}>
                      <Icon className="w-3 h-3" />
                      {priority.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{task.completedPomodoros}/{task.estimatedPomodoros}</span>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setMenuOpenId(menuOpenId === task.id ? null : task.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {menuOpenId === task.id && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    {onSelect && task.status === 'active' && (
                      <button
                        onClick={() => {
                          onSelect(task);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        <Play className="w-4 h-4" />
                        {t('timer.start')}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(task);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        {t('common.edit')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            {t('tasks.noTasks')}
          </div>
        )}
      </div>
    </div>
  );
}
