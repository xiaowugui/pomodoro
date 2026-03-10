import { useState, useEffect } from 'react';
import { Layout, ProjectList, TaskList, TaskForm, ProjectForm } from '../components';
import { useAppStore } from '../stores';
import { Task, Project } from '@shared/types';
import { Plus, FolderPlus } from 'lucide-react';

export default function TasksPage() {
  const { projects, tasks, loadAllData } = useAppStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Separate filters for projects and tasks
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    // 只在组件挂载时加载数据
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
                  ? projects.find((p) => p.id === selectedProjectId)?.name || '项目任务'
                  : '全部任务'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {statusFilteredTasks.filter((t) => t.status === 'active').length} 个进行中任务
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter buttons for tasks */}
              <div className="flex items-center gap-1 mr-2">
                {(['active', 'completed', 'all'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      taskFilter === f
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {f === 'active' ? '未完成' : f === 'completed' ? '已完成' : '全部'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                新建项目
              </button>
              <button
                onClick={handleCreateTask}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </button>
            </div>
          </div>

          <TaskList
            tasks={statusFilteredTasks}
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
    </Layout>
  );
}
