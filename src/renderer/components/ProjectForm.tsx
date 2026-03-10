import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../stores';
import { Project } from '@shared/types';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#6b7280', '#374151', '#1f2937',
];

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ProjectForm({ 
  project, 
  onSubmit, 
  onCancel 
}: ProjectFormProps) {
  const { createProject, updateProject } = useAppStore();
  const [name, setName] = useState(project?.name || '');
  const [color, setColor] = useState(project?.color || PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
    }
  }, [project]);
  
  useEffect(() => {
    // Delay focus slightly to ensure DOM is ready
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (project) {
        await updateProject({
          ...project,
          name: name.trim(),
          color,
        });
      } else {
        await createProject({
          name: name.trim(),
          color,
          status: 'active',
        });
      }
      onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project ? '编辑项目' : '新建项目'}
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
              项目名称
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              项目颜色
            </label>
            <div className="grid grid-cols-10 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              预览: {name || '项目名称'}
            </span>
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
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '保存中...' : project ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
