import { contextBridge, ipcRenderer } from 'electron'

// Inline IPC channel constants to avoid module resolution issues in preload script
const IPC_CHANNELS = {
  // 设置
  GET_SETTINGS: 'get-settings',
  SET_SETTINGS: 'set-settings',
  SETTINGS_CHANGED: 'settings-changed',

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
  BREAK_WINDOW_ACTION: 'break-window-action',
  BREAK_WINDOW_CLOSED: 'break-window-closed',
} as const

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 设置
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTINGS),
  setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings),
  onSettingsChanged: (callback: (settings: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_CHANGED, (_, settings) => callback(settings))
  },

  // 项目
  getProjects: () => ipcRenderer.invoke(IPC_CHANNELS.GET_PROJECTS),
  createProject: (project: any) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_PROJECT, project),
  updateProject: (project: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_PROJECT, project),
  deleteProject: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_PROJECT, id),

  // 任务
  getTasks: () => ipcRenderer.invoke(IPC_CHANNELS.GET_TASKS),
  createTask: (task: any) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_TASK, task),
  updateTask: (task: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_TASK, task),
  deleteTask: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_TASK, id),

  // 任务备注
  getTaskNotes: () => ipcRenderer.invoke(IPC_CHANNELS.GET_TASK_NOTES),
  getTaskNoteByTask: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_TASK_NOTE_BY_TASK, taskId),
  createTaskNote: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_TASK_NOTE, taskId),
  updateTaskNote: (note: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_TASK_NOTE, note),
  deleteTaskNote: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_TASK_NOTE, id),
  addTaskLink: (noteId: string, link: any) => ipcRenderer.invoke(IPC_CHANNELS.ADD_TASK_LINK, noteId, link),
  updateTaskLink: (noteId: string, link: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_TASK_LINK, noteId, link),
  deleteTaskLink: (noteId: string, linkId: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_TASK_LINK, noteId, linkId),

  // 日志
  getLogs: () => ipcRenderer.invoke(IPC_CHANNELS.GET_LOGS),
  createLog: (log: any) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_LOG, log),
  updateLog: (log: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_LOG, log),
  // 任务每日执行
  getDayExecutions: () => ipcRenderer.invoke(IPC_CHANNELS.GET_DAY_EXECUTIONS),
  getDayExecutionsByDate: (date: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DAY_EXECUTIONS_BY_DATE, date),
  getDayExecutionsByTask: (taskId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_DAY_EXECUTIONS_BY_TASK, taskId),
  createDayExecution: (execution: any) => ipcRenderer.invoke(IPC_CHANNELS.CREATE_DAY_EXECUTION, execution),
  updateDayExecution: (execution: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DAY_EXECUTION, execution),
  deleteDayExecution: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DELETE_DAY_EXECUTION, id),


  // 计时器控制
  timerStart: (data: any) => ipcRenderer.invoke(IPC_CHANNELS.TIMER_START, data),
  timerPause: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
  timerResume: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
  timerStop: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STOP),
  timerSkip: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_SKIP),
  timerComplete: () => ipcRenderer.invoke(IPC_CHANNELS.TIMER_COMPLETE),

  // 计时器事件
  onTimerTick: (callback: (state: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TIMER_TICK, (_, state) => callback(state))
  },
  onTimerComplete: (callback: (phase: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.TIMER_COMPLETE, (_, phase) => callback(phase))
  },

  // 推迟事件
  onPostponeStart: (callback: (data: { postponeEndTime: number }) => void) => {
    ipcRenderer.on('timer-postpone-start', (_, data) => callback(data))
  },
  onPostponeEnd: (callback: () => void) => {
    ipcRenderer.on('timer-postpone-end', () => callback())
  },
  getPostponeState: () => ipcRenderer.invoke('timer-postpone-state'),

  // Data updated listener
  onDataUpdated: (callback: () => void) => {
    ipcRenderer.on('data-updated', () => callback())
  },

  // Break window listeners - for break window only
  onBreakTick: (callback: (data: any) => void) => {
    ipcRenderer.on('break-tick', (_, data) => callback(data))
  },
  onBreakPostponeCount: (callback: (data: any) => void) => {
    ipcRenderer.on('break-postpone-count', (_, data) => callback(data))
  },
  onBreakStrictMode: (callback: (data: any) => void) => {
    ipcRenderer.on('break-strict-mode', (_, data) => callback(data))
  },
  getBreakSettings: () => ipcRenderer.invoke('get-break-settings'),

  // Break actions
  breakComplete: () => ipcRenderer.invoke('break-complete'),
  breakPostpone: () => ipcRenderer.invoke('break-postpone'),
  breakSkip: () => ipcRenderer.invoke('break-skip'),

  // Get current timer state (for break window initial state)
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),

  // 任务备注窗口
  openTaskNoteWindow: (taskId: string) => ipcRenderer.invoke('open-task-note-window', taskId),
  closeTaskNoteWindow: (taskId: string) => ipcRenderer.invoke('close-task-note-window', taskId),

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
})
