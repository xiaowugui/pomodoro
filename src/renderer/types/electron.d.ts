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
  
  // 移除监听器
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
