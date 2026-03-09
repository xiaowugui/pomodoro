import { Folder, MoreVertical, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../stores';
import { Project } from '@shared/types';

interface ProjectListProps {
  onEdit?: (project: Project) => void;
  onCreate?: () => void;
  selectedId?: string | null;
  onSelect?: (projectId: string | null) => void;
}

export default function ProjectList({ 
  onEdit, 
  onCreate, 
  selectedId, 
  onSelect 
}: ProjectListProps) {
  const { projects, tasks, deleteProject, completeProject } = useAppStore();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  
  const getTaskCount = (projectId: string) => {
    return tasks.filter((t) => t.projectId === projectId && t.status === 'active').length;
  };
  
  const handleDelete = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？相关任务也会被删除。')) {
      await deleteProject(projectId);
    }
    setMenuOpenId(null);
  };
  
  const handleComplete = async (projectId: string) => {
    if (confirm('确定要完成这个项目吗？这将标记项目及其所有任务为已完成。')) {
      // Complete all tasks in the project first
      const projectTasks = tasks.filter(t => t.projectId === projectId && t.status === 'active');
      for (const task of projectTasks) {
        await useAppStore.getState().completeTask(task.id);
      }
      // Then mark the project as complete
      await completeProject(projectId);
    }
    setMenuOpenId(null);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          项目
        </h3>
        {onCreate && (
          <button
            onClick={onCreate}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {onSelect && (
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            selectedId === null
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="flex-1 text-left">全部任务</span>
          <span className="text-xs text-gray-400">{tasks.filter((t) => t.status === 'active').length}</span>
        </button>
      )}
      
      {projects.map((project) => (
        <div
          key={project.id}
          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            selectedId === project.id
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <button
            onClick={() => onSelect?.(project.id)}
            className="flex-1 flex items-center gap-3"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className={`flex-1 text-left truncate ${
              selectedId === project.id
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {project.name}
            </span>
            <span className="text-xs text-gray-400">{getTaskCount(project.id)}</span>
          </button>
          
          {/* Always show menu since delete is available */}
          {true && (
            <div className="relative">
              <button
                onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {menuOpenId === project.id && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  {project.status !== 'completed' && (
                    <button
                      onClick={() => handleComplete(project.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-t-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      完成项目
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(project);
                        setMenuOpenId(null);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {projects.length === 0 && (
        <div className="text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
          暂无项目
        </div>
      )}
    </div>
  );
}
