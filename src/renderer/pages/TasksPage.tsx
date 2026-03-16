import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, ProjectList, TaskList, TaskForm, ProjectForm } from '../components';
import { useAppStore } from '../stores';
import { Task, Project, TaskType, IdleLog } from '@shared/types';
import { Plus, FolderPlus, Clock, AlertCircle, Lock, X } from 'lucide-react';

export default function TasksPage() {
  const { t } = useTranslation();
  const { projects, tasks, loadAllData } = useAppStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIdleHistory, setShowIdleHistory] = useState(false);
  // Separate filters for projects and tasks
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');

  useEffect(() => {
    // Load data only on component mount
    const loadData = async () => {
      setIsLoading(true);
      await loadAllData();
      setIsLoading(false);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setIsProjectFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  // Handle opening task notes in a new window
  const handleOpenTaskNotes = async (taskId: string) => {
    if (window.electronAPI?.openTaskNoteWindow) {
      await window.electronAPI.openTaskNoteWindow(taskId);
    }
  };

  const handleProjectFormClose = () => {
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : tasks;

  // Apply task filter
  const statusFilteredTasks = filteredTasks.filter((t) => {
    if (taskFilter === 'active') return t.status === 'active';
    if (taskFilter === 'completed') return t.status === 'completed';
    return true;
  });

  // Apply type filter
  const typeFilteredTasks = statusFilteredTasks.filter((t) => {
    if (typeFilter === 'all') return true;
    return (t.taskType || 'normal') === typeFilter;
  });

  // Apply project filter
  const statusFilteredProjects = projects.filter((p) => {
    if (projectFilter === 'active') return p.status === 'active';
    if (projectFilter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Sidebar with Projects */}
        <aside className="w-64 pr-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="mb-6">
            <ProjectList
              onEdit={handleEditProject}
              onCreate={handleCreateProject}
              selectedId={selectedProjectId}
              onSelect={setSelectedProjectId}
              filter={projectFilter}
              onFilterChange={setProjectFilter}
            />
          </div>
        </aside>

        {/* Main Task List */}
        <main className="flex-1 pl-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name || t('tasks.projectTasks')
                  : t('tasks.allTasks')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('tasks.inProgressTasks', { count: statusFilteredTasks.filter((t) => t.status === 'active').length })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIdleHistory(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                {t('tasks.idleRecords')}
              </button>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                {t('tasks.newProject')}
              </button>
              <button
                onClick={handleCreateTask}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('tasks.newTask')}
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 whitespace-nowrap">
              {(['active', 'completed', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap ${
                    taskFilter === f
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {f === 'active' ? t('tasks.incomplete') : f === 'completed' ? t('tasks.completed') : t('tasks.all')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              {(['all', 'ai', 'normal'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                    typeFilter === type
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {type === 'all' ? t('tasks.allTypes') : type === 'ai' ? 'AI' : t('tasks.normal')}
                </button>
              ))}
            </div>
          </div>

          <TaskList
            tasks={typeFilteredTasks}
            projectId={selectedProjectId}
            onEdit={handleEditTask}
            onOpenNotes={handleOpenTaskNotes}
            showFilters={false}
            externalFilter={taskFilter}
          />
        </main>
      </div>

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          task={editingTask}
          defaultProjectId={selectedProjectId || undefined}
          onSubmit={handleTaskFormClose}
          onCancel={handleTaskFormClose}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* Project Form Modal */}
      {isProjectFormOpen && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleProjectFormClose}
          onCancel={handleProjectFormClose}
        />
      )}

      {/* Idle History Modal */}
      {showIdleHistory && (
        <IdleHistoryModal onClose={() => setShowIdleHistory(false)} />
      )}
    </Layout>
  );
}

// Idle History Modal Component
function IdleHistoryModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [idleLogs, setIdleLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIdleLogs = async () => {
      try {
        if (window.electronAPI?.getIdleLogs) {
          const logs = await window.electronAPI.getIdleLogs();
          setIdleLogs(logs || []);
        }
      } catch (error) {
        console.error('Failed to load idle logs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadIdleLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {t('tasks.idleRecords')}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
          ) : idleLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{t('tasks.noIdleRecords')}</p>
          ) : (
            <div className="space-y-3">
              {idleLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {log.reason === 'locked' ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {log.taskId === 'no-task' ? t('tasks.noRelatedTask') : `${t('tasks.taskId')}: ${log.taskId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(log.startTime)} - {formatDate(log.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.durationMinutes} {t('common.minutes')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.reason === 'locked' ? t('tasks.locked') : t('tasks.idle')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
