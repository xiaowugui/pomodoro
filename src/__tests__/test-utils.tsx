import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import '@testing-library/jest-dom'; // Add jest-dom matchers
import { vi } from 'vitest';

/**
 * Mock window.electronAPI for testing
 */
export const mockElectronAPI = {
  // Settings
  getSettings: vi.fn(),
  setSettings: vi.fn(),
  onSettingsChanged: vi.fn(),
  
  // Projects
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  
  // Tasks
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  
  // Logs
  getLogs: vi.fn(),
  createLog: vi.fn(),
  updateLog: vi.fn(),
  
  // Day Executions
  getDayExecutions: vi.fn(),
  getDayExecutionsByDate: vi.fn(),
  getDayExecutionsByTask: vi.fn(),
  createDayExecution: vi.fn(),
  updateDayExecution: vi.fn(),
  deleteDayExecution: vi.fn(),
  
  // Task Notes
  getTaskNotes: vi.fn(),
  getTaskNoteByTask: vi.fn(),
  createTaskNote: vi.fn(),
  updateTaskNote: vi.fn(),
  deleteTaskNote: vi.fn(),
  addTaskLink: vi.fn(),
  updateTaskLink: vi.fn(),
  deleteTaskLink: vi.fn(),
  
  // Task notes window
  openTaskNoteWindow: vi.fn(),
  closeTaskNoteWindow: vi.fn(),
  
  // Timer controls
  timerStart: vi.fn(),
  timerPause: vi.fn(),
  timerResume: vi.fn(),
  timerStop: vi.fn(),
  timerSkip: vi.fn(),
  timerComplete: vi.fn(),
  onTimerTick: vi.fn(),
  onTimerComplete: vi.fn(),
  onTimerPhaseChange: vi.fn(),
  onBreakTick: vi.fn(),
  onBreakSkipStatus: vi.fn(),
  onDataUpdated: vi.fn(),
  onPostponeStart: vi.fn(),
  onPostponeEnd: vi.fn(),
  getPostponeState: vi.fn(),
  removeAllListeners: vi.fn(),
  
  // Break window
  getBreakSettings: vi.fn(),
  getTimerState: vi.fn(),
  breakComplete: vi.fn(),
  breakPostpone: vi.fn(),
  onBreakPostponeCount: vi.fn(),
  onBreakStrictMode: vi.fn(),
  
  // Window controls
  showMainWindow: vi.fn(),
  hideMainWindow: vi.fn(),
  quitApp: vi.fn(),
  
  // Auto start
  getAutoStart: vi.fn(),
  setAutoStart: vi.fn(),
  
  // Notifications
  showNotification: vi.fn(),
  
  // Shortcuts
  registerBreakShortcuts: vi.fn(),
  unregisterBreakShortcuts: vi.fn(),
};

/**
 * Setup global window.electronAPI mock
 */
export function setupElectronMock(): void {
  // @ts-ignore
  global.window = global.window || {};
  // @ts-ignore
  global.window.electronAPI = mockElectronAPI;
}

/**
 * Clear all mock calls
 */
export function clearElectronMocks(): void {
  Object.values(mockElectronAPI).forEach((mock) => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
}

/**
 * Custom render function that includes providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  // Setup electron API mock
  setupElectronMock();
  
  return render(ui, options);
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

/**
 * Test data factory functions
 */
export const createMockProject = (overrides = {}) => ({
  id: `project-${Date.now()}`,
  name: 'Test Project',
  color: '#ef4444',
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTask = (overrides = {}) => ({
  id: `task-${Date.now()}`,
  title: 'Test Task',
  projectId: 'project-1',
  estimatedPomodoros: 3,
  completedPomodoros: 0,
  status: 'active' as const,
  createdAt: new Date().toISOString(),
  workDates: [] as string[],
  plannedDates: [] as string[],
  isImportant: false,
  isUrgent: false,
  taskType: 'normal' as const,
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  autoStartEnabled: false,
  strictMode: false,
  fullscreenBreak: true,
  allScreensBreak: true,
  breakWindowWidth: 0.85,
  breakWindowHeight: 0.85,
  breakOpacity: 0.95,
  transparentMode: false,
  breakStrictMode: false,
  skipDelayPercent: 30,
  postponeEnabled: true,
  postponeMinutes: 2,
  postponeLimit: 1,
  postponeDelayPercent: 30,
  soundEnabled: true,
  notificationEnabled: true,
  theme: 'system' as const,
  accentColor: '#ef4444',
  shortcuts: {
    toggleTimer: 'CommandOrControl+Shift+P',
    skipPhase: 'CommandOrControl+Shift+S',
    showWindow: 'CommandOrControl+Shift+O',
    endBreak: 'CommandOrControl+X',
    postponeBreak: 'CommandOrControl+P',
  },
  ...overrides,
});

export const createMockTimerState = (overrides = {}) => ({
  isRunning: false,
  timeRemaining: 25 * 60,
  totalTime: 25 * 60,
  phase: 'idle' as const,
  currentTaskId: null,
  pomodorosCompleted: 0,
  sessionId: null,
  ...overrides,
});

export const createMockPomodoroLog = (overrides = {}) => ({
  id: `log-${Date.now()}`,
  taskId: 'task-1',
  projectId: 'project-1',
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),
  duration: 25 * 60,
  completed: true,
  type: 'work' as const,
  ...overrides,
});

export const createMockTaskDayExecution = (overrides = {}) => ({
  id: `execution-${Date.now()}`,
  taskId: 'task-1',
  date: new Date().toISOString().split('T')[0],
  pomodorosCompleted: 1,
  minutesWorked: 25,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTaskNote = (overrides = {}) => ({
  id: `note-${Date.now()}`,
  taskId: 'task-1',
  content: 'Test note content',
  links: [] as Array<{ id: string; title: string; url: string; createdAt: string }>,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
