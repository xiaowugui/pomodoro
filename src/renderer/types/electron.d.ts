// 声明 electronAPI 类型
export interface ElectronAPI {
  // 设置
  getSettings: () => Promise<any>
  setSettings: (settings: any) => Promise<void>
  onSettingsChanged: (callback: (settings: any) => void) => void

  // 项目
  getProjects: () => Promise<any[]>
  createProject: (project: any) => Promise<any>
  updateProject: (project: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // 任务
  getTasks: () => Promise<any[]>
  createTask: (task: any) => Promise<any>
  updateTask: (task: any) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // 任务备注
  getTaskNotes: () => Promise<any[]>
  getTaskNoteByTask: (taskId: string) => Promise<any>
  createTaskNote: (taskId: string) => Promise<any>
  updateTaskNote: (note: any) => Promise<any>
  deleteTaskNote: (id: string) => Promise<boolean>
  addTaskLink: (noteId: string, link: any) => Promise<any>
  updateTaskLink: (noteId: string, link: any) => Promise<any>
  deleteTaskLink: (noteId: string, linkId: string) => Promise<boolean>

  // 日志
  getLogs: () => Promise<any[]>

  // 计时器控制
  timerStart: (data: any) => Promise<void>
  timerPause: () => Promise<void>
  timerResume: () => Promise<void>
  timerStop: () => Promise<void>
  timerSkip: () => Promise<void>

  // 计时器事件
  onTimerTick: (callback: (state: any) => void) => void
  onTimerComplete: (callback: (phase: string) => void) => void

  // 休息窗口事件
  onBreakWindowAction: (callback: (action: string) => void) => void
  closeBreakWindow: () => void

  // 休息窗口倒计时相关
  onBreakTick: (callback: (data: {
    timeRemaining: number
    totalTime: number
    progress: number
    canPostpone?: boolean
    postponeCount?: number
    postponeLimit?: number
  }) => void) => void
  onBreakPostponeCount: (callback: (data: { count: number; limit: number }) => void) => void
  onBreakStrictMode: (callback: (data: { enabled: boolean }) => void) => void
  onBreakSkipStatus: (callback: (data: { canSkip: boolean }) => void) => void

  // 休息窗口控制
  breakComplete: () => Promise<void>
  breakPostpone: () => Promise<boolean>
  breakSkip: () => Promise<void>
  getBreakSettings: () => Promise<any>

  // Stretchly-style break window APIs
  getBreakData: () => Promise<any>
  finishBreak: () => Promise<boolean>
  postponeBreak: () => Promise<boolean>
  signalBreakLoaded: () => Promise<boolean>

  // 数据更新事件
  onDataUpdated: (callback: () => void) => void

  // 移除监听器
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
