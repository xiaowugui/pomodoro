import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../stores';
import { useTranslation } from 'react-i18next';
import { TaskNote, TaskLink } from '@shared/types';
import { 
  Save, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  ExternalLink,
  FileText,
  CheckSquare
} from 'lucide-react';

// 弹窗专用组件 - 只显示单个任务备注，无侧边栏
export default function TaskNotePopup() {
  const { t } = useTranslation();
  const urlParams = useParams<{ taskId: string }>();
  const { tasks, projects, taskNotes, getTaskNoteByTask, createTaskNote, updateTaskNote, addTaskLink, deleteTaskLink, loadAllData } = useAppStore();
  
  const taskId = urlParams.taskId;
  const currentTask = taskId ? tasks.find(t => t.id === taskId) : null;
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
    if (taskId) {
      let note = getTaskNoteByTask(taskId);
      if (!note) {
        createTaskNote(taskId).then((newNote) => {
          setCurrentNote(newNote);
          setNoteContent(newNote.content);
        });
      } else {
        setCurrentNote(note);
        setNoteContent(note.content);
      }
    }
  }, [taskId, taskNotes]);

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
    if (!confirm(t('notes.confirmDeleteLink'))) return;
    setIsSaving(true);
    try {
      await deleteTaskLink(currentNote.id, linkId);
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
    return project?.name || t('notes.noProject');
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.color || '#gray';
  };

  if (!taskId || !currentTask) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">{t('notes.cannotLoadTask')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getProjectColor(currentTask.projectId) }}
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentTask.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getProjectName(currentTask.projectId)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Notes Content */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('notes.noteContent')}
              </label>
              <button
                onClick={handleSaveContent}
                disabled={isSaving || !currentNote}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t('notes.saving') : t('notes.save')}
              </button>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={t('notes.notePlaceholder')}
              className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Links Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                {t('notes.relatedLinks')}
              </label>
              <button
                onClick={() => setShowLinkForm(!showLinkForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('notes.addLinkButton')}
              </button>
            </div>

            {showLinkForm && (
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder={t('notes.linkTitle')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder={t('notes.linkUrl')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddLink}
                      disabled={isSaving || !newLinkTitle.trim() || !newLinkUrl.trim()}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('notes.add')}
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkForm(false);
                        setNewLinkTitle('');
                        setNewLinkUrl('');
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t('notes.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  {t('notes.noLinks')}
                </p>
              )}
            </div>
          </div>

          {currentNote && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
              {t('notes.lastUpdated')}: {new Date(currentNote.updatedAt).toLocaleString('zh-CN')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
