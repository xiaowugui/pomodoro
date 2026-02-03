import { create } from 'zustand';
import { TimerState } from '@shared/types.ts';

declare global {
  interface Window {
    electronAPI: {
      timerStart: (data?: any) => Promise<void>;
      timerPause: () => Promise<void>;
      timerResume: () => Promise<void>;
      timerStop: () => Promise<void>;
      timerSkip: () => Promise<void>;
      timerComplete: () => Promise<void>;
      onTimerTick: (callback: (state: TimerState) => void) => void;
      onTimerComplete: (callback: (phase: string) => void) => void;
      onBreakTick: (callback: (data: { timeRemaining: number; totalTime: number; progress: number }) => void) => void;
      onBreakSkipStatus: (callback: (data: { canSkip: boolean }) => void) => void;
      onDataUpdated: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

interface TimerStoreState extends TimerState {
  // UI state
  canSkip: boolean;
  
  // Actions - Timer control
  start: (taskId?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  skip: () => Promise<void>;
  complete: () => Promise<void>;
  
  // Actions - Task management
  setCurrentTask: (taskId: string | null) => void;
  
  // Actions - Break window
  handleBreakAction: (action: 'skip' | 'postpone' | 'complete') => Promise<void>;
  
  // Actions - State updates from IPC
  updateState: (state: Partial<TimerState>) => void;
  setCanSkip: (canSkip: boolean) => void;
  
  // Formatting helpers
  getFormattedTime: () => string;
  getProgress: () => number;
  getPhaseLabel: () => string;
  
  // Initialize IPC listeners
  initializeListeners: () => () => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const useTimerStore = create<TimerStoreState>((set, get) => ({
  // Initial timer state
  isRunning: false,
  timeRemaining: 25 * 60,
  totalTime: 25 * 60,
  phase: 'idle',
  currentTaskId: null,
  pomodorosCompleted: 0,
  sessionId: null,
  
  // UI state
  canSkip: false,

  // Timer control
  start: async (taskId) => {
    await window.electronAPI.timerStart(taskId);
  },

  pause: async () => {
    await window.electronAPI.timerPause();
  },

  resume: async () => {
    await window.electronAPI.timerResume();
  },

  stop: async () => {
    await window.electronAPI.timerStop();
  },

  skip: async () => {
    await window.electronAPI.timerSkip();
  },

  complete: async () => {
    await window.electronAPI.timerComplete();
  },

  // Task management
  setCurrentTask: (taskId) => {
    set({ currentTaskId: taskId });
  },

  // Break window actions
  handleBreakAction: async (action) => {
    if (action === 'complete') {
      await window.electronAPI.timerSkip();
    } else if (action === 'skip') {
      await window.electronAPI.timerSkip();
    }
  },

  // State updates
  updateState: (state) => {
    set((prev) => ({ ...prev, ...state }));
    
    // Update canSkip based on progress
    const { timeRemaining, totalTime, phase } = { ...get(), ...state };
    if (phase !== 'idle' && totalTime > 0) {
      const elapsed = totalTime - timeRemaining;
      const percentComplete = (elapsed / totalTime) * 100;
      set({ canSkip: percentComplete >= 30 });
    } else {
      set({ canSkip: false });
    }
  },

  setCanSkip: (canSkip) => {
    set({ canSkip });
  },

  // Formatting helpers
  getFormattedTime: () => {
    return formatTime(get().timeRemaining);
  },

  getProgress: () => {
    const { timeRemaining, totalTime } = get();
    if (totalTime === 0) return 0;
    return ((totalTime - timeRemaining) / totalTime) * 100;
  },

  getPhaseLabel: () => {
    const { phase } = get();
    switch (phase) {
      case 'work':
        return '专注时间';
      case 'short_break':
        return '短休息';
      case 'long_break':
        return '长休息';
      case 'idle':
        return '准备开始';
      default:
        return '';
    }
  },

  // IPC listeners
  initializeListeners: () => {
    const handleTimerTick = (state: TimerState) => {
      get().updateState(state);
    };

    const handleTimerComplete = (phase: string) => {
      // Timer complete - state will be updated by next tick or phase change
      console.log('Timer complete:', phase);
    };

    window.electronAPI.onTimerTick(handleTimerTick);
    window.electronAPI.onTimerComplete(handleTimerComplete);

    // Cleanup function
    return () => {
      window.electronAPI.removeAllListeners('timer-tick');
      window.electronAPI.removeAllListeners('timer-complete');
    };
  },
}));
