import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout, TimerDisplay, TimerControls, TaskSelector, TaskForm } from '../components';
import { useTimerStore, useAppStore, useSettingsStore } from '../stores';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Bot, Check, Circle, AlertCircle, X, Plus } from 'lucide-react';

export default function TimerPage() {
  const { t } = useTranslation();
  const { initializeListeners, currentTaskId, phase, updateState, isPostponed, postponeEndTime, getFormattedPostponeTime } = useTimerStore();
  const { loadAllData, tasks } = useAppStore();
  const { loadSettings, initializeListeners: initSettingsListeners, pomodoroDuration, hasLoaded } = useSettingsStore();
  const prevPomodoroDuration = useRef(pomodoroDuration);
  const [postponeTimeLeft, setPostponeTimeLeft] = useState('00:00');
  const [showIdleAlert, setShowIdleAlert] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  // Update postpone time every second
  useEffect(() => {
    if (!isPostponed) {
      setPostponeTimeLeft('00:00');
      return;
    }

    const updatePostponeTime = () => {
      if (postponeEndTime > 0) {
        const remaining = Math.max(0, postponeEndTime - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setPostponeTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updatePostponeTime();
    const intervalId = setInterval(updatePostponeTime, 1000);
    return () => clearInterval(intervalId);
  }, [isPostponed, postponeEndTime]);

  // Get current task info
  const currentTask = useMemo(() => {
    if (!currentTaskId) return null;
    return tasks.find(t => t.id === currentTaskId) || null;
  }, [currentTaskId, tasks]);

  useEffect(() => {
    // Initialize data
    loadAllData();
    loadSettings();

    // Setup timer listeners
    const cleanupTimer = initializeListeners();
    
    // Setup settings change listeners to update timer display
    const cleanupSettings = initSettingsListeners();
    
    // Listen for data updates (e.g., when task count changes)
    const handleDataUpdate = () => {
      loadAllData();
    };
    window.electronAPI.onDataUpdated(handleDataUpdate);
    
    // Listen for idle alerts
    const handleIdleAlert = () => {
      setShowIdleAlert(true);
    };
    if (window.electronAPI.onIdleAlert) {
      window.electronAPI.onIdleAlert(handleIdleAlert);
    }
    
    return () => {
      cleanupTimer();
      cleanupSettings();
      window.electronAPI.removeAllListeners('data-updated');
    };
  }, [initializeListeners, loadAllData, loadSettings, initSettingsListeners]);

  // Sync settings to timer store when settings change and timer is idle
  useEffect(() => {
    if (hasLoaded && phase === 'idle' && pomodoroDuration && prevPomodoroDuration.current !== pomodoroDuration) {
      const newTotalTime = pomodoroDuration * 60;
      // Only update if we're in idle state - this affects the ring display
      updateState({
        totalTime: newTotalTime,
        timeRemaining: newTotalTime,
      });
    }
    prevPomodoroDuration.current = pomodoroDuration;
  }, [pomodoroDuration, phase, hasLoaded, updateState]);

  // Calculate display title based on phase
  const phaseTitle = useMemo(() => {
    switch (phase) {
      case 'work':
        return t('timer.work');
      case 'short_break':
        return t('timer.shortBreak');
      case 'long_break':
        return t('timer.longBreak');
      default:
        return t('timer.ready');
    }
  }, [phase, t]);

  // AI tasks (display only, not timed)
  const aiTasks = useMemo(() => {
    return tasks.filter(t => t.taskType === 'ai' && t.status === 'active');
  }, [tasks]);

  const handleToggleAiTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'active' : 'completed';
    await window.electronAPI.updateTask({
      ...task,
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
    });
    loadAllData();
  };

  const handleIdleAlertContinue = () => {
    window.electronAPI.idleAlertResponse('continue');
    setShowIdleAlert(false);
  };

  const handleIdleAlertStop = () => {
    window.electronAPI.idleAlertResponse('stop');
    setShowIdleAlert(false);
  };

  const handleCreateTask = () => {
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
  };

  const handleTaskFormSubmit = () => {
    setIsTaskFormOpen(false);
    loadAllData();
  };

  return (
    <Layout>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleCreateTask}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('tasks.newTask')}
        </button>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)]">
        <div className="flex flex-col items-center gap-8">
          {/* Phase Title */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{phaseTitle}</p>
            {/* Postpone countdown display */}
            {isPostponed && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {t('timer.postponed', { time: postponeTimeLeft })}
                </span>
              </div>
            )}
          </div>

          {/* Timer Display */}
          <TimerDisplay size="lg" />

          {/* Timer Controls */}
          <TimerControls size="lg" />

          {/* Task Section - Different UI based on phase */}
          <div className="w-full max-w-md mt-8">
            {phase === 'idle' ? (
              // Idle state: Show interactive task selector
              <TaskSelector />
            ) : currentTask ? (
              // Running state: Show read-only task info
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('timer.currentTask')}</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {currentTask.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((currentTask.completedPomodoros / currentTask.estimatedPomodoros) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {currentTask.completedPomodoros} / {currentTask.estimatedPomodoros}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // No task selected
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('timer.noTask')}</p>
              </div>
            )}
          </div>

          {/* AI Tasks */}
            {aiTasks.length > 0 && (
            <div className="w-full max-w-md mt-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('timer.aiTasks')}</h3>
                </div>
                <div className="space-y-2">
                  {aiTasks.map((task) => {
                    const isRunning = task.completedPomodoros > 0;
                    const isCompleted = task.status === 'completed';
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <button
                          onClick={() => handleToggleAiTask(task.id)}
                          className="flex-shrink-0"
                          aria-label={isCompleted ? t('timer.markIncomplete') : t('timer.markComplete')}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {task.title}
                          </p>
                        </div>
                        {isRunning && !isCompleted && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                            {t('timer.running')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Idle Alert Popup */}
      {showIdleAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('timer.idleDetected')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('timer.idleMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleIdleAlertStop}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
              >
                {t('timer.stopPomodoro')}
              </button>
              <button
                onClick={handleIdleAlertContinue}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
              >
                {t('timer.continueWorking')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isTaskFormOpen && (
        <TaskForm
          onSubmit={handleTaskFormSubmit}
          onCancel={handleTaskFormClose}
        />
      )}
    </Layout>
  );
}
