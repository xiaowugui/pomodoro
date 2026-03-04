import { useState } from 'react';
import { Check, Clock, Trash2, Edit2, Play, MoreVertical, AlertCircle, Clock9 } from 'lucide-react';
import { useAppStore } from '../stores';
import { Task } from '@shared/types.ts';

interface TaskListProps {
  tasks?: Task[];
  projectId?: string | null;
  onEdit?: (task: Task) => void;
  onSelect?: (task: Task) => void;
  showFilters?: boolean;
}

export default function TaskList({ 
  tasks: propTasks, 
  projectId, 
  onEdit, 
  onSelect,
  showFilters = true 
}: TaskListProps) {
  const { tasks: allTasks, projects, completeTask, deleteTask } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const tasks = propTasks || allTasks;
  
  const filteredTasks = tasks.filter((task) => {
    if (projectId && task.projectId !== projectId) return false;
    if (filter === 'active') return task.status === 'active';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };
  
  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '无项目';
  };
  
  // 获取任务优先级信息
  const getPriorityInfo = (task: Task) => {
    const isImportant = task.isImportant ?? false;
    const isUrgent = task.isUrgent ?? false;
    
    if (isImportant && isUrgent) {
      return { label: '紧急重要', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertCircle };
    } else if (isImportant && !isUrgent) {
      return { label: '重要', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock9 };
    } else if (!isImportant && isUrgent) {
      return { label: '紧急', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertCircle };
    }
    return null;
  };
  
  const handleComplete = async (taskId: string) => {
    await completeTask(taskId);
  };
  
  const handleDelete = async (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(taskId);
    }
    setMenuOpenId(null);
  };
  
  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center gap-2">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filter === f
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
            </button>
          ))}
        </div>
      )}
      
      <div className="space-y-2">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow ${
              task.status === 'completed' ? 'opacity-60' : ''
            }`}
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
                        开始专注
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
                        编辑
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
}
