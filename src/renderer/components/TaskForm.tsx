import { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, Trash2, AlertCircle, Clock, Square, Bot, Zap, FileText } from 'lucide-react';
import { useAppStore } from '../stores';
import { Task, TaskType } from '@shared/types';

interface TaskFormProps {
  task?: Task | null;
  defaultProjectId?: string;
  onSubmit: () => void;
  onCancel: () => void;
  onCreateProject?: () => void;
}

export default function TaskForm({ 
  task, 
  defaultProjectId,
  onSubmit, 
  onCancel,
  onCreateProject
}: TaskFormProps) {
  const { projects, createTask, updateTask } = useAppStore();
  const [title, setTitle] = useState(task?.title || '');
  const [projectId, setProjectId] = useState(task?.projectId || defaultProjectId || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task?.estimatedPomodoros || 1);
  const [workDates, setWorkDates] = useState<string[]>(task?.workDates || []);
  const [newDate, setNewDate] = useState('');
  const [isImportant, setIsImportant] = useState(task?.isImportant ?? false);
  const [isUrgent, setIsUrgent] = useState(task?.isUrgent ?? false);
  const [taskType, setTaskType] = useState<TaskType>(task?.taskType || 'normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__create_new__') {
      onCreateProject?.();
      return;
    }
    setProjectId(value);
  };
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setProjectId(task.projectId);
      setEstimatedPomodoros(task.estimatedPomodoros);
      setWorkDates(task.workDates || []);
      setIsImportant(task.isImportant ?? false);
      setIsUrgent(task.isUrgent ?? false);
      setTaskType(task.taskType || 'normal');
    }
  }, [task]);
  
  useEffect(() => {
    // Delay focus slightly to ensure DOM is ready
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const handleAddDate = () => {
    if (newDate && !workDates.includes(newDate)) {
      setWorkDates([...workDates, newDate].sort());
      setNewDate('');
    }
  };
  
  const handleRemoveDate = (date: string) => {
    setWorkDates(workDates.filter(d => d !== date));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    
    setIsSubmitting(true);
    try {
      if (task) {
        await updateTask({
          ...task,
          title: title.trim(),
          projectId,
          estimatedPomodoros,
          workDates,
          isImportant,
          isUrgent,
          taskType,
        });
      } else {
        await createTask({
          title: title.trim(),
          projectId,
          estimatedPomodoros,
          completedPomodoros: 0,
          status: 'active',
          workDates: [] as string[],
          plannedDates: [] as string[],
          isImportant,
          isUrgent,
          taskType,
        });
      }
      onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const presetPomodoros = [1, 2, 3, 4, 5, 8];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task ? '编辑任务' : '新建任务'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              任务名称
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务名称..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              项目
            </label>
            <select
              value={projectId}
              onChange={handleProjectChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">选择项目...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
              <option value="__create_new__">+ 创建新项目</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              预估番茄钟
            </label>
            <div className="flex items-center gap-2">
              {presetPomodoros.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setEstimatedPomodoros(num)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    estimatedPomodoros === num
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setEstimatedPomodoros((p) => p + 1)}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 任务类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('ai')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                  taskType === 'ai'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <Bot className={`w-5 h-5 ${taskType === 'ai' ? 'text-purple-500' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${taskType === 'ai' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  AI任务
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTaskType('normal')}
                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors ${
                  taskType === 'normal'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
              >
                <FileText className={`w-5 h-5 ${taskType === 'normal' ? 'text-orange-500' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${taskType === 'normal' ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  普通任务
                </div>
              </button>
            </div>
          </div>
          
          {/* 四象限优先级选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              优先级（四象限）
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* 重要且紧急 - 第一象限 */}
              <button
                type="button"
                onClick={() => { setIsImportant(true); setIsUrgent(true); }}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                  isImportant && isUrgent
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700'
                }`}
              >
                <AlertCircle className={`w-5 h-5 ${isImportant && isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={`font-medium text-sm ${isImportant && isUrgent ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    重要且紧急
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">立即执行</div>
                </div>
              </button>
              
              {/* 重要不紧急 - 第二象限 */}
              <button
                type="button"
                onClick={() => { setIsImportant(true); setIsUrgent(false); }}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                  isImportant && !isUrgent
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <Clock className={`w-5 h-5 ${isImportant && !isUrgent ? 'text-blue-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={`font-medium text-sm ${isImportant && !isUrgent ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    重要不紧急
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">计划执行</div>
                </div>
              </button>
              
              {/* 不重要但紧急 - 第三象限 */}
              <button
                type="button"
                onClick={() => { setIsImportant(false); setIsUrgent(true); }}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                  !isImportant && isUrgent
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-700'
                }`}
              >
                <Clock className={`w-5 h-5 ${!isImportant && isUrgent ? 'text-yellow-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={`font-medium text-sm ${!isImportant && isUrgent ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    紧急不重要
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">委托他人</div>
                </div>
              </button>
              
              {/* 不重要不紧急 - 第四象限 */}
              <button
                type="button"
                onClick={() => { setIsImportant(false); setIsUrgent(false); }}
                className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                  !isImportant && !isUrgent
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-700'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <Square className={`w-5 h-5 ${!isImportant && !isUrgent ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={`font-medium text-sm ${!isImportant && !isUrgent ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    不重要不紧急
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">可删除</div>
                </div>
              </button>
            </div>
          </div>
          
          {task && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                执行日期
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!newDate}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  添加
                </button>
              </div>
              {workDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {workDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
                    >
                      {date}
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {workDates.length === 0 && (
                <p className="text-sm text-gray-500">暂无执行日期</p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !projectId || isSubmitting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : task ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
