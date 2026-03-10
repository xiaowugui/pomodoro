import { app, BrowserWindow, ipcMain, Notification, powerMonitor } from 'electron';
import * as path from 'path';
import { StorageManager } from './storage';
import { MainWindowManager } from './windows/main-window';
import { BreakWindowManager } from './windows/break-window';
import { TaskNoteWindowManager } from './windows/task-note-window';
import { TrayManager } from './tray';
import { ShortcutsManager } from './shortcuts';
import { TimerManager } from './timer';
import { IPC_CHANNELS, Settings, Project, Task, PomodoroLog, TaskDayExecution, TaskNote, TaskLink, defaultSettings } from '../shared/types';

/**
 * PomodoroApp - 主应用类
 * 集成所有组件，管理应用生命周期
 */
class PomodoroApp {
  private storage: StorageManager;
  private mainWindow: MainWindowManager;
  private breakWindows: BreakWindowManager;
  private taskNoteWindow: TaskNoteWindowManager;
  private tray: TrayManager;
  private shortcuts: ShortcutsManager;
  private timer: TimerManager;
  // 防止休息结束通知重复发送
  private isBreakCompleting: boolean = false;

  constructor() {
    this.storage = new StorageManager();
    this.mainWindow = new MainWindowManager();
    this.breakWindows = new BreakWindowManager();
    this.taskNoteWindow = new TaskNoteWindowManager();
    this.tray = new TrayManager();
    this.shortcuts = new ShortcutsManager();
    this.timer = new TimerManager(this.storage);
    
    // 设置breakWindows引用用于事件传递
    this.timer.setBreakWindowsManager(this.breakWindows as any);
    
    // 设置休息完成回调 - 当休息窗口自动关闭时通知计时器
    this.breakWindows.setOnBreakComplete(() => {
      if (this.timer.getState().phase === 'short_break' || this.timer.getState().phase === 'long_break') {
        this.timer.completeBreak();
      }
    });
  }

  async initialize(): Promise<void> {
    await app.whenReady();

    await this.storage.initialize();

    this.setupApp();
    this.setupIPC();
    this.setupTimerEvents();
    this.setupPowerMonitor();

    this.mainWindow.create();
    this.tray.create(this.mainWindow);
    this.shortcuts.register(this);

    app.on('window-all-closed', this.onWindowAllClosed.bind(this));
    app.on('activate', this.onActivate.bind(this));
    app.on('before-quit', this.onBeforeQuit.bind(this));
  }

  private setupApp(): void {
    app.setName('Pomodoro');
    
    if (process.platform === 'darwin') {
      app.dock.setMenu(this.tray.getDockMenu());
    }
    
    // 设置开机自动启动
    this.setupAutoStart();
  }

  /**
   * 获取开机启动的exe路径
   * 打包后Electron会自动使用当前exe，无需指定path
   */
  private getAutoStartPath(): string | undefined {
    // 打包后不需要指定path，Electron会自动使用当前exe
    if (app.isPackaged) {
      return undefined;
    }
    // 开发模式使用process.execPath
    return process.execPath;
  }

  /**
   * 设置开机自动启动
   */
  private setupAutoStart(): void {
    const settings = this.storage.getSettings();
    this.setAutoStart(settings.autoStartEnabled);
  }

  /**
   * 更新开机启动设置
   */
  private updateAutoStart(enabled: boolean): void {
    this.setAutoStart(enabled);
  }

  /**
   * 实际设置开机启动
   */
  private setAutoStart(enabled: boolean): void {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      const exePath = this.getAutoStartPath();
      
      // 使用any绕过类型检查，因为Electron类型定义可能不完整
      const options: any = {
        openAtLogin: enabled,
      };
      
      // 仅在开发模式下指定path和args
      if (exePath) {
        options.path = exePath;
        options.args = ['--hidden'];
      }
      
      app.setLoginItemSettings(options);
      
      console.log(`[AutoStart] ${enabled ? 'Enabled' : 'Disabled'}, packaged: ${app.isPackaged}, path: ${exePath || 'auto'}`);
    }
  }

  private setupIPC(): void {
    // 设置管理
    ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
      return this.storage.getSettings();
    });

    ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, (_, settings: Settings) => {
      this.storage.setSettings(settings);
      this.mainWindow.webContents?.send(IPC_CHANNELS.SETTINGS_CHANGED, settings);
      // 重新注册快捷键
      this.shortcuts.updateShortcuts(this);
      // 更新开机启动设置
      this.updateAutoStart(settings.autoStartEnabled);
      return settings;
    });

    // 获取休息窗口设置（供渲染进程使用）
    ipcMain.handle('get-break-settings', () => {
      const settings = this.storage.getSettings();
      return {
        breakStrictMode: settings.breakStrictMode,
        postponeEnabled: settings.postponeEnabled,
        postponeLimit: settings.postponeLimit,
        postponeMinutes: settings.postponeMinutes,
        endBreakShortcut: settings.shortcuts.endBreak,
        postponeBreakShortcut: settings.shortcuts.postponeBreak,
      };
    });

    // 数据管理
    ipcMain.handle(IPC_CHANNELS.GET_DATA, () => {
      return {
        projects: this.storage.getProjects(),
        tasks: this.storage.getTasks(),
        logs: this.storage.getLogs(),
      };
    });

    // 项目管理
    ipcMain.handle(IPC_CHANNELS.GET_PROJECTS, () => {
      return this.storage.getProjects();
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_PROJECT, (_, project: Omit<Project, 'id' | 'createdAt'>) => {
      return this.storage.createProject(project);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_PROJECT, (_, project: Project) => {
      return this.storage.updateProject(project);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_PROJECT, (_, projectId: string) => {
      return this.storage.deleteProject(projectId);
    });

    // 任务管理
    ipcMain.handle(IPC_CHANNELS.GET_TASKS, () => {
      return this.storage.getTasks();
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_TASK, (_, task: Omit<Task, 'id' | 'createdAt'>) => {
      return this.storage.createTask(task);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_TASK, (_, task: Task) => {
      return this.storage.updateTask(task);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_TASK, (_, taskId: string) => {
      return this.storage.deleteTask(taskId);
    });

    // 任务备注管理
    ipcMain.handle(IPC_CHANNELS.GET_TASK_NOTES, () => {
      return this.storage.getTaskNotes();
    });

    ipcMain.handle(IPC_CHANNELS.GET_TASK_NOTE_BY_TASK, (_, taskId: string) => {
      return this.storage.getTaskNoteByTask(taskId);
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_TASK_NOTE, (_, taskId: string) => {
      return this.storage.createTaskNote(taskId);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_TASK_NOTE, (_, note: TaskNote) => {
      return this.storage.updateTaskNote(note);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_TASK_NOTE, (_, noteId: string) => {
      return this.storage.deleteTaskNote(noteId);
    });

    ipcMain.handle(IPC_CHANNELS.ADD_TASK_LINK, (_, noteId: string, link: Omit<TaskLink, 'id' | 'createdAt'>) => {
      return this.storage.addTaskLink(noteId, link);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_TASK_LINK, (_, noteId: string, link: TaskLink) => {
      return this.storage.updateTaskLink(noteId, link);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_TASK_LINK, (_, noteId: string, linkId: string) => {
      return this.storage.deleteTaskLink(noteId, linkId);
    });

    // 日志管理
    ipcMain.handle(IPC_CHANNELS.GET_LOGS, () => {
      return this.storage.getLogs();
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_LOG, (_, log: Omit<PomodoroLog, 'id'>) => {
      return this.storage.createLog(log);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_LOG, (_, log: PomodoroLog) => {
      return this.storage.updateLog(log);
    });

    // 任务每日执行
    ipcMain.handle(IPC_CHANNELS.GET_DAY_EXECUTIONS, () => {
      return this.storage.getDayExecutions();
    });

    ipcMain.handle(IPC_CHANNELS.GET_DAY_EXECUTIONS_BY_DATE, (_, date: string) => {
      return this.storage.getDayExecutionByDate(date);
    });

    ipcMain.handle(IPC_CHANNELS.GET_DAY_EXECUTIONS_BY_TASK, (_, taskId: string) => {
      return this.storage.getDayExecutionByTask(taskId);
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_DAY_EXECUTION, (_, execution: Omit<TaskDayExecution, 'id' | 'createdAt'>) => {
      return this.storage.createDayExecution(execution);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_DAY_EXECUTION, (_, execution: TaskDayExecution) => {
      return this.storage.updateDayExecution(execution);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_DAY_EXECUTION, (_, executionId: string) => {
      return this.storage.deleteDayExecution(executionId);
    });


    // 窗口控制
    ipcMain.handle(IPC_CHANNELS.SHOW_MAIN_WINDOW, () => {
      this.mainWindow.show();
    });

    ipcMain.handle(IPC_CHANNELS.HIDE_MAIN_WINDOW, () => {
      this.mainWindow.hide();
    });

    ipcMain.handle(IPC_CHANNELS.QUIT_APP, () => {
      app.quit();
    });

    // 开机启动控制
    ipcMain.handle(IPC_CHANNELS.GET_AUTO_START, () => {
      if (process.platform === 'win32' || process.platform === 'darwin') {
        const loginSettings = app.getLoginItemSettings();
        return loginSettings.openAtLogin;
      }
      return false;
    });

    ipcMain.handle(IPC_CHANNELS.SET_AUTO_START, (_, enabled: boolean) => {
      this.updateAutoStart(enabled);
      // 更新设置存储
      const settings = this.storage.getSettings();
      settings.autoStartEnabled = enabled;
      this.storage.setSettings(settings);
      return enabled;
    });

    // 通知
    ipcMain.handle(IPC_CHANNELS.SHOW_NOTIFICATION, (_, title: string, body: string) => {
      this.showNotification(title, body);
    });

    // 休息窗口动作处理 - Stretchly style
    ipcMain.handle('break-complete', () => {
      this.handleBreakComplete();
      return true;
    });

    ipcMain.handle('break-postpone', () => {
      return this.handleBreakPostpone();
    });

    ipcMain.handle('break-skip', () => {
      this.handleBreakSkip();
      return true;
    });

    // Stretchly-style break window IPC
    ipcMain.handle('finish-break', () => {
      // 防止重复处理
      if (this.isBreakCompleting) {
        return true;
      }
      this.breakWindows.finishBreak(true);
      // 通知计时器休息已完成
      if (this.timer.getState().phase === 'short_break' || this.timer.getState().phase === 'long_break') {
        this.timer.completeBreak();
      }
      return true;
    });

    ipcMain.handle('postpone-break', () => {
      this.breakWindows.postponeBreak();
      // 推迟后暂停计时器，稍后再恢复
      this.timer.postpone?.();
      return true;
    });

    ipcMain.handle('break-loaded', () => {
      return true;
    });

    // Get timer state
    ipcMain.handle('get-timer-state', () => {
      const state = this.timer.getState();
      console.log('[PomodoroApp] get-timer-state called, returning:', JSON.stringify(state));
      return state;
    });

    // 计时器控制
    ipcMain.handle(IPC_CHANNELS.TIMER_START, (_, taskId?: string) => {
      this.timer.start(taskId);
    });

    ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
      this.timer.pause();
    });

    ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
      this.timer.resume();
    });

    ipcMain.handle(IPC_CHANNELS.TIMER_STOP, () => {
      this.timer.stop();
    });

    ipcMain.handle(IPC_CHANNELS.TIMER_SKIP, () => {
      this.timer.skip();
    });

    ipcMain.handle(IPC_CHANNELS.TIMER_COMPLETE, () => {
      this.timer.complete();
    });

    // 获取推迟状态
    ipcMain.handle(IPC_CHANNELS.TIMER_POSTPONE_STATE, () => {
      return this.timer.getPostponeState();
    });

    // 任务备注窗口控制
    ipcMain.handle(IPC_CHANNELS.OPEN_TASK_NOTE_WINDOW, (_, taskId: string) => {
      this.taskNoteWindow.show(taskId);
      return true;
    });

    ipcMain.handle(IPC_CHANNELS.CLOSE_TASK_NOTE_WINDOW, (_, taskId: string) => {
      this.taskNoteWindow.close(taskId);
      return true;
    });
  }

  private setupTimerEvents(): void {
    // 计时器滴答
    this.timer.on('tick', (state) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, state);
      this.tray.updateTooltip(state.timeRemaining, state.phase);
      
      // 如果在休息阶段，更新休息窗口
      if (state.phase === 'short_break' || state.phase === 'long_break') {
        console.log('[PomodoroApp] Timer tick - break phase detected, calling updateTime:', state.timeRemaining, state.totalTime);
        this.breakWindows.updateTime(state.timeRemaining, state.totalTime);
      }
    });

    // 计时完成
    this.timer.on('complete', (phase, taskId) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_COMPLETE, { phase, taskId });
      
      if (phase === 'work') {
        this.handleWorkComplete(taskId);
      } else {
        this.handleBreakComplete();
      }
      
      // 刷新任务数据
      this.mainWindow.webContents?.send('data-updated');
    });

    // 暂停
    this.timer.on('pause', () => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, this.timer.getState());
    });

    // 停止
    this.timer.on('stop', () => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, this.timer.getState());
    });

    // 阶段变更
    this.timer.on('phase-change', (phase) => {
      this.mainWindow.webContents?.send('timer-phase-change', phase);
    });

    // 休息开始
    this.timer.on('break-start', (breakType) => {
      console.log('[PomodoroApp] break-start event received, breakType:', breakType);
      this.handleBreakStart(breakType);
    });

    // 休息结束
    this.timer.on('break-end', () => {
      this.handleBreakEnd();
    });

    // 推迟开始 - 通知主窗口
    this.timer.on('postpone-start', (postponeEndTime) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_POSTPONE_START, { postponeEndTime });
    });

    // 推迟结束 - 通知主窗口
    this.timer.on('postpone-end', () => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_POSTPONE_END);
    });
  }

  private setupPowerMonitor(): void {
    // 系统挂起时暂停
    powerMonitor.on('suspend', () => {
      if (this.timer.isRunning()) {
        this.timer.pause();
      }
    });

    // 系统恢复时恢复
    powerMonitor.on('resume', () => {
      const settings = this.storage.getSettings();
      if (settings.autoStartPomodoros && this.timer.getState().phase === 'work') {
        this.timer.resume();
      }
    });

    // 锁屏时暂停
    powerMonitor.on('lock-screen', () => {
      if (this.timer.isRunning()) {
        this.timer.pause();
      }
    });

    // 解锁时恢复
    powerMonitor.on('unlock-screen', () => {
      const settings = this.storage.getSettings();
      if (settings.autoStartPomodoros && this.timer.getState().phase === 'work') {
        this.timer.resume();
      }
    });
  }

  /**
   * 处理工作完成
   */
  private handleWorkComplete(taskId: string | null): void {
    const settings = this.storage.getSettings();
    
    this.showNotification(
      '番茄钟完成！',
      '工作时间结束，准备休息一下。'
    );

    this.mainWindow.flashFrame(true);
    
    if (process.platform === 'darwin') {
      app.dock.bounce();
    }
  }

  /**
   * 处理休息开始
   */
  private handleBreakStart(breakType: 'short_break' | 'long_break'): void {
    const settings = this.storage.getSettings();
    
    console.log('[PomodoroApp] handleBreakStart called, breakType:', breakType);
    
    // 重置完成标志，允许下一次完成处理
    this.isBreakCompleting = false;
    
    try {
      // 显示休息窗口（传递设置）
      this.breakWindows.show(breakType, settings);
    } catch (error) {
      console.error('[PomodoroApp] Error in breakWindows.show():', error);
    }
    
    // 注册休息期间的快捷键
    try {
      this.shortcuts.registerBreakShortcuts(this);
    } catch (error) {
      console.error('[PomodoroApp] Error registering shortcuts:', error);
    }
    
    // 注意：不再发送通知，因为 handleWorkComplete 已经发送了"番茄钟完成"通知
    // 避免重复通知打扰用户
  }

  /**
   * 处理休息结束
   */
  private handleBreakEnd(): void {
    // 隐藏休息窗口
    this.breakWindows.hide();
    
    // 注销休息快捷键
    this.shortcuts.unregisterBreakShortcuts();
    
    // 重置推迟计数
    this.timer.resetPostponeCount();
    
    // 重置完成标志，允许下一次完成处理
    this.isBreakCompleting = false;
  }

  /**
   * 处理休息完成
   */
  private handleBreakComplete(): void {
    console.log('[PomodoroApp] handleBreakComplete called');
    
    // 防止重复处理 - 如果已经在完成过程中，直接返回
    if (this.isBreakCompleting) {
      console.log('[PomodoroApp] handleBreakComplete skipped - already completing');
      return;
    }
    
    // 防止重复处理 - 如果 phase 不是 break，说明已经处理过了
    const phase = this.timer.getState().phase;
    if (phase !== 'short_break' && phase !== 'long_break') {
      console.log('[PomodoroApp] handleBreakComplete skipped - not in break phase');
      return;
    }
    
    // 设置标志位，防止重复处理
    this.isBreakCompleting = true;
    
    // 隐藏休息窗口
    this.breakWindows.hide();
    
    // 注销休息快捷键
    this.shortcuts.unregisterBreakShortcuts();
    
    // 调用 timer.skip() 转换到工作阶段，确保主窗口计时器显示正确
    this.timer.skip();
    
    // 发送通知
    this.showNotification(
      '休息结束！',
      '准备好开始下一个番茄钟了吗？'
    );

    this.mainWindow.flashFrame(true);
  }

  /**
   * 处理休息推迟
   */
  private handleBreakPostpone(): boolean {
    const success = this.timer.postpone();
    
    if (success) {
      // 隐藏休息窗口但保持计时器状态
      this.breakWindows.hide();
      
      // 注销休息快捷键
      this.shortcuts.unregisterBreakShortcuts();
      
      // 发送通知
      const settings = this.storage.getSettings();
      this.showNotification(
        '休息已推迟',
        `${settings.postponeMinutes}分钟后将重新开始休息。`
      );
    }
    
    return success;
  }

  /**
   * 处理跳过休息
   */
  private handleBreakSkip(): void {
    // 隐藏休息窗口
    this.breakWindows.hide();
    
    // 注销休息快捷键
    this.shortcuts.unregisterBreakShortcuts();
    
    // 跳过当前阶段
    this.timer.skip();
  }

  /**
   * 显示通知
   */
  private showNotification(title: string, body: string): void {
    const settings = this.storage.getSettings();
    if (!settings.notificationEnabled) return;

    new Notification({
      title,
      body,
      silent: !settings.soundEnabled,
    }).show();
  }

  /**
   * 所有窗口关闭时
   */
  private onWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  /**
   * 应用激活时
   */
  private onActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.mainWindow.create();
    } else {
      this.mainWindow.show();
    }
  }

  /**
   * 应用退出前
   */
  private onBeforeQuit(): void {
    this.shortcuts.unregisterAll();
    this.timer.destroy();
  }

  // 公共方法供其他模块使用
  getMainWindow(): MainWindowManager {
    return this.mainWindow;
  }

  getTimer(): TimerManager {
    return this.timer;
  }

  getStorage(): StorageManager {
    return this.storage;
  }

  getBreakWindows(): BreakWindowManager {
    return this.breakWindows;
  }

  getShortcuts(): ShortcutsManager {
    return this.shortcuts;
  }

  quit(): void {
    app.quit();
  }
}

/**
 * 单实例锁机制
 * 确保系统中只能运行一个番茄钟应用实例
 * 必须在 app.whenReady() 之前调用
 */
const gotTheLock = app.requestSingleInstanceLock();

// 创建应用实例（供 second-instance 事件使用）
let pomodoroApp: PomodoroApp | null = null;

if (!gotTheLock) {
  // 另一个实例正在运行，退出当前实例
  app.quit();
} else {
  // 主实例：监听第二个实例的启动
  app.on('second-instance', (_event, argv) => {
    console.log('[PomodoroApp] Second instance detected, argv:', argv);

    // 聚焦到现有窗口
    if (pomodoroApp && pomodoroApp.getMainWindow) {
      const mainWindowManager = pomodoroApp.getMainWindow();
      if (mainWindowManager) {
        mainWindowManager.show();
      }
    }

    // 如果第二个实例带有 --hidden 参数，不显示窗口
    if (argv.includes('--hidden')) {
      console.log('[PomodoroApp] Second instance launched with --hidden, keeping minimized');
    }
  });

  // 初始化应用
  pomodoroApp = new PomodoroApp();
  pomodoroApp.initialize().catch(console.error);
}

export { pomodoroApp, PomodoroApp };
