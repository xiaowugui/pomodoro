import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { useAppStore } from '../stores';
import { Task } from '@shared/types';

interface TaskFormProps {
  task?: Task | null;
  defaultProjectId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function TaskForm({ 
  task, 
  defaultProjectId,
  onSubmit, 
  onCancel 
}: TaskFormProps) {
  const { projects, createTask, updateTask } = useAppStore();
  const [title, setTitle] = useState(task?.title || '');
  const [projectId, setProjectId] = useState(task?.projectId || defaultProjectId || '');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(task?.estimatedPomodoros || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setProjectId(task.projectId);
      setEstimatedPomodoros(task.estimatedPomodoros);
    }
  }, [task]);
  
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);
  
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
        });
      } else {
        await createTask({
          title: title.trim(),
          projectId,
          estimatedPomodoros,
          completedPomodoros: 0,
          status: 'active',
        });
      }
      onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const presetPomodoros = [1, 2, 3, 4, 5, 8];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
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
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">选择项目...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
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
