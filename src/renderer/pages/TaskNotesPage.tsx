import { useState, useEffect } from 'react';
import { Layout } from '../components';
import { useAppStore } from '../stores';
import { Task, TaskNote, TaskLink } from '@shared/types';
import { 
  ArrowLeft, 
  Save, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  ExternalLink,
  FileText,
  CheckSquare
} from 'lucide-react';

interface TaskNotesPageProps {
  taskId?: string;
}

export default function TaskNotesPage({ taskId: propTaskId }: TaskNotesPageProps) {
  const { tasks, projects, taskNotes, getTaskNoteByTask, createTaskNote, updateTaskNote, addTaskLink, deleteTaskLink, loadAllData } = useAppStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(propTaskId || null);
  const [currentNote, setCurrentNote] = useState<TaskNote | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      let note = getTaskNoteByTask(selectedTaskId);
      if (!note) {
        // Create note for task if doesn't exist
        createTaskNote(selectedTaskId).then((newNote) => {
          setCurrentNote(newNote);
          setNoteContent(newNote.content);
        });
      } else {
        setCurrentNote(note);
        setNoteContent(note.content);
      }
    }
  }, [selectedTaskId, taskNotes]);

  const handleSaveContent = async () => {
    if (!currentNote) return;
    setIsSaving(true);
    try {
      const updated = await updateTaskNote({
        ...currentNote,
        content: noteContent,
      });
      setCurrentNote(updated);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLink = async () => {
    if (!currentNote || !newLinkTitle.trim() || !newLinkUrl.trim()) return;
    setIsSaving(true);
    try {
      await addTaskLink(currentNote.id, {
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim(),
      });
      // Reload to get updated note
      const notes = await window.electronAPI.getTaskNotes();
      const updatedNote = notes.find((n: TaskNote) => n.id === currentNote.id);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
      setNewLinkTitle('');
      setNewLinkUrl('');
      setShowLinkForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!currentNote) return;
    if (!confirm('确定要删除这个链接吗？')) return;
    setIsSaving(true);
    try {
      await deleteTaskLink(currentNote.id, linkId);
      // Reload to get updated note
      const notes = await window.electronAPI.getTaskNotes();
      const updatedNote = notes.find((n: TaskNote) => n.id === currentNote.id);
      if (updatedNote) {
        setCurrentNote(updatedNote);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.name || '无项目';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };

  const activeTasks = tasks.filter((t) => t.status === 'active');

  return (
    <Layout>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Task List Sidebar */}
        <aside className="w-72 pr-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              选择任务
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              选择一个任务来查看/编辑备注
            </p>
          </div>
          
          <div className="space-y-1">
            {activeTasks.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">
                暂无进行中的任务
              </p>
            ) : (
              activeTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTaskId === task.id
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getProjectColor(task.projectId) }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                    {getProjectName(task.projectId)}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Notes Content Area */}
        <main className="flex-1 pl-6 overflow-y-auto">
          {!selectedTaskId ? (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>请从左侧选择一个任务</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl">
              {/* Task Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tasks.find((t) => t.id === selectedTaskId)?.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  项目: {getProjectName(tasks.find((t) => t.id === selectedTaskId)?.projectId || '')}
                </p>
              </div>

              {/* Notes Content */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    备注内容
                  </label>
                  <button
                    onClick={handleSaveContent}
                    disabled={isSaving || !currentNote}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="在此输入任务的详细备注..."
                  className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Links Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    相关链接
                  </label>
                  <button
                    onClick={() => setShowLinkForm(!showLinkForm)}
                    className="flex items-center gap-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    添加链接
                  </button>
                </div>

                {/* Add Link Form */}
                {showLinkForm && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder="链接标题"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="url"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="链接地址 (https://...)"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddLink}
                          disabled={isSaving || !newLinkTitle.trim() || !newLinkUrl.trim()}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          添加
                        </button>
                        <button
                          onClick={() => {
                            setShowLinkForm(false);
                            setNewLinkTitle('');
                            setNewLinkUrl('');
                          }}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Links List */}
                <div className="space-y-2">
                  {currentNote?.links && currentNote.links.length > 0 ? (
                    currentNote.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow group"
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-white truncate">
                            {link.title}
                          </span>
                          <span className="text-xs text-gray-400 truncate">
                            {link.url}
                          </span>
                        </a>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">
                      暂无关联链接
                    </p>
                  )}
                </div>
              </div>

              {/* Last Updated */}
              {currentNote && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
                  最后更新: {new Date(currentNote.updatedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
}
