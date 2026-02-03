import { useEffect, useMemo, useRef } from 'react';
import { Layout, TimerDisplay, TimerControls, TaskSelector } from '../components';
import { useTimerStore, useAppStore, useSettingsStore } from '../stores';
import { CheckCircle2 } from 'lucide-react';

export default function TimerPage() {
  const { initializeListeners, currentTaskId, phase, updateState } = useTimerStore();
  const { loadAllData, tasks } = useAppStore();
  const { loadSettings, initializeListeners: initSettingsListeners, pomodoroDuration, hasLoaded } = useSettingsStore();
  const prevPomodoroDuration = useRef(pomodoroDuration);

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
        return '专注时间';
      case 'short_break':
        return '短休息';
      case 'long_break':
        return '长休息';
      default:
        return '准备开始';
    }
  }, [phase]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)]">
        <div className="flex flex-col items-center gap-8">
          {/* Phase Title */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{phaseTitle}</p>
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
                    <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">当前任务</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {currentTask.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
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
                <p className="text-gray-500 dark:text-gray-400">未关联任务</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
