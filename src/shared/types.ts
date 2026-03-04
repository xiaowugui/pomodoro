// 项目
export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

// 任务备注 - 链接
export interface TaskLink {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

// 任务备注
export interface TaskNote {
  id: string;
  taskId: string;
  content: string;        // 文本备注内容
  links: TaskLink[];      // 关联链接
  createdAt: string;
  updatedAt: string;
}

// 任务
export interface Task {
  id: string;
  title: string;
  projectId: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  status: 'active' | 'completed';
  createdAt: string;
  completedAt?: string;
  workDates: string[];  // 任务执行过的日期列表 YYYY-MM-DD
  plannedDates: string[];  // 任务计划执行的日期列表 YYYY-MM-DD
  // 四象限优先级
  isImportant: boolean;  // 是否重要
  isUrgent: boolean;     // 是否紧急
}

// 任务每日执行记录
export interface TaskDayExecution {
  id: string;
  taskId: string;
  date: string;              // YYYY-MM-DD 格式
  pomodorosCompleted: number;
  minutesWorked: number;
  createdAt: string;
}

// 番茄钟记录
export interface PomodoroLog {
  id: string;
  taskId: string;
  projectId: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  type: 'work' | 'short_break' | 'long_break';
}

// 设置
export interface Settings {
  // 番茄钟时长 (分钟)
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  
  // 行为设置
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  autoStartEnabled: boolean;  // 开机自动启动
  strictMode: boolean;
  
  // 休息设置 - 增强版
  fullscreenBreak: boolean;
  allScreensBreak: boolean;
  breakWindowWidth: number;      // 窗口宽度占比 (0.0-1.0, 默认0.85)
  breakWindowHeight: number;     // 窗口高度占比 (0.0-1.0, 默认0.85)
  breakOpacity: number;           // 窗口透明度 (0.0-1.0, 默认0.95)
  transparentMode: boolean;       // 是否启用透明模式
  breakStrictMode: boolean;       // 严格模式（防止关闭）
  skipDelayPercent: number;
  
  // 推迟功能设置
  postponeEnabled: boolean;     // 是否启用推迟
  postponeMinutes: number;      // 推迟时长（分钟）
  postponeLimit: number;        // 每休息最多推迟次数
  postponeDelayPercent: number;  // 可推迟的时间百分比（前多少百分比可推迟）
  
  // 通知设置
  soundEnabled: boolean;
  notificationEnabled: boolean;
  
  // 外观
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  // 快捷键
  shortcuts: {
    toggleTimer: string;
    skipPhase: string;
    showWindow: string;
    endBreak: string;             // 结束休息快捷键
    postponeBreak: string;        // 推迟休息快捷键
  };
}

// 默认设置
export const defaultSettings: Settings = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  autoStartEnabled: false,
  strictMode: false,
  
  // 休息窗口设置
  fullscreenBreak: true,
  allScreensBreak: true,
  breakWindowWidth: 0.85,
  breakWindowHeight: 0.85,
  breakOpacity: 0.95,
  transparentMode: false,
  breakStrictMode: false,
  skipDelayPercent: 30,
  
  // 推迟功能设置
  postponeEnabled: true,
  postponeMinutes: 2,
  postponeLimit: 1,
  postponeDelayPercent: 30,
  
  soundEnabled: true,
  notificationEnabled: true,
  theme: 'system',
  accentColor: '#ef4444',
  shortcuts: {
    toggleTimer: 'CommandOrControl+Shift+P',
    skipPhase: 'CommandOrControl+Shift+S',
    showWindow: 'CommandOrControl+Shift+O',
    endBreak: 'CommandOrControl+X',         // Stretchly风格快捷键
    postponeBreak: 'CommandOrControl+P',
  },
};

// 应用状态
export interface AppState {
  settings: Settings;
  projects: Project[];
  tasks: Task[];
  logs: PomodoroLog[];
  dayExecutions: TaskDayExecution[];
  taskNotes: TaskNote[];
}

// 番茄钟计时器状态
export interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  totalTime: number;
  phase: 'work' | 'short_break' | 'long_break' | 'idle';
  currentTaskId: string | null;
  pomodorosCompleted: number;
  sessionId: string | null;
}

// IPC 通道定义
export const IPC_CHANNELS = {
  // 设置
  GET_SETTINGS: 'get-settings',
  SET_SETTINGS: 'set-settings',
  SETTINGS_CHANGED: 'settings-changed',
  
  // 数据管理
  GET_DATA: 'get-data',
  SAVE_DATA: 'save-data',
  DATA_CHANGED: 'data-changed',
  
  // 项目
  GET_PROJECTS: 'get-projects',
  CREATE_PROJECT: 'create-project',
  UPDATE_PROJECT: 'update-project',
  DELETE_PROJECT: 'delete-project',
  
  // 任务
  GET_TASKS: 'get-tasks',
  CREATE_TASK: 'create-task',
  UPDATE_TASK: 'update-task',
  DELETE_TASK: 'delete-task',

  // 任务备注
  GET_TASK_NOTES: 'get-task-notes',
  GET_TASK_NOTE_BY_TASK: 'get-task-note-by-task',
  CREATE_TASK_NOTE: 'create-task-note',
  UPDATE_TASK_NOTE: 'update-task-note',
  DELETE_TASK_NOTE: 'delete-task-note',
  // 任务链接
  ADD_TASK_LINK: 'add-task-link',
  UPDATE_TASK_LINK: 'update-task-link',
  DELETE_TASK_LINK: 'delete-task-link',
  
  // 番茄钟日志
  GET_LOGS: 'get-logs',
  CREATE_LOG: 'create-log',
  UPDATE_LOG: 'update-log',
  
  // 任务每日执行
  GET_DAY_EXECUTIONS: 'get-day-executions',
  GET_DAY_EXECUTIONS_BY_DATE: 'get-day-executions-by-date',
  GET_DAY_EXECUTIONS_BY_TASK: 'get-day-executions-by-task',
  CREATE_DAY_EXECUTION: 'create-day-execution',
  UPDATE_DAY_EXECUTION: 'update-day-execution',
  DELETE_DAY_EXECUTION: 'delete-day-execution',


  // 计时器控制
  TIMER_START: 'timer-start',
  TIMER_PAUSE: 'timer-pause',
  TIMER_RESUME: 'timer-resume',
  TIMER_STOP: 'timer-stop',
  TIMER_SKIP: 'timer-skip',
  TIMER_TICK: 'timer-tick',
  TIMER_COMPLETE: 'timer-complete',
  
  // 休息窗口
  SHOW_BREAK_WINDOW: 'show-break-window',
  HIDE_BREAK_WINDOW: 'hide-break-window',
  BREAK_WINDOW_ACTION: 'break-window-action',
  BREAK_WINDOW_CLOSED: 'break-window-closed',
  
  // 休息窗口增强
  BREAK_TICK: 'break-tick',
  BREAK_SKIP_STATUS: 'break-skip-status',
  BREAK_CAN_POSTPONE: 'break-can-postpone',
  BREAK_POSTPONE_COUNT: 'break-postpone-count',
  BREAK_STRICT_MODE: 'break-strict-mode',
  
  // 休息窗口动作
  BREAK_POSTPONE: 'break-postpone',
  BREAK_COMPLETE: 'break-complete',
  BREAK_SKIP: 'break-skip',
  
  // 窗口控制
  SHOW_MAIN_WINDOW: 'show-main-window',
  HIDE_MAIN_WINDOW: 'hide-main-window',
  QUIT_APP: 'quit-app',
  
  // 开机启动
  GET_AUTO_START: 'get-auto-start',
  SET_AUTO_START: 'set-auto-start',
  
  // 通知
  SHOW_NOTIFICATION: 'show-notification',
  
  // 全局快捷键
  REGISTER_BREAK_SHORTCUTS: 'register-break-shortcuts',
  UNREGISTER_BREAK_SHORTCUTS: 'unregister-break-shortcuts',
} as const;
