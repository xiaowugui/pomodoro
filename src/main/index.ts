import { app, BrowserWindow, ipcMain, Notification, powerMonitor } from 'electron';
import * as path from 'path';
import { StorageManager } from './storage';
import { MainWindowManager } from './windows/main-window';
import { BreakWindowManager } from './windows/break-window';
import { TrayManager } from './tray';
import { ShortcutsManager } from './shortcuts';
import { TimerManager } from './timer';
import { IPC_CHANNELS, Settings, Project, Task, PomodoroLog, defaultSettings } from '../shared/types';

/**
 * PomodoroApp - 主应用类
 * 集成所有组件，管理应用生命周期
 */
class PomodoroApp {
  private storage: StorageManager;
  private mainWindow: MainWindowManager;
  private breakWindows: BreakWindowManager;
  private tray: TrayManager;
  private shortcuts: ShortcutsManager;
  private timer: TimerManager;

  constructor() {
    this.storage = new StorageManager();
    this.mainWindow = new MainWindowManager();
    this.breakWindows = new BreakWindowManager();
    this.tray = new TrayManager();
    this.shortcuts = new ShortcutsManager();
    this.timer = new TimerManager(this.storage);
    
    // 设置breakWindows引用用于事件传递
    this.timer.setBreakWindowsManager(this.breakWindows as any);
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

    // 通知
    ipcMain.handle(IPC_CHANNELS.SHOW_NOTIFICATION, (_, title: string, body: string) => {
      this.showNotification(title, body);
    });

    // 休息窗口动作处理
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
  }

  private setupTimerEvents(): void {
    // 计时器滴答
    this.timer.on('tick', (state) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, state);
      this.tray.updateTooltip(state.timeRemaining, state.phase);
      
      // 如果在休息阶段，更新休息窗口
      if (state.phase === 'short_break' || state.phase === 'long_break') {
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
      this.handleBreakStart(breakType);
    });

    // 休息结束
    this.timer.on('break-end', () => {
      this.handleBreakEnd();
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
    console.log(`[PomodoroApp] ==========================================`);
    console.log(`[PomodoroApp] handleBreakStart() called with breakType=${breakType}`);
    
    const settings = this.storage.getSettings();
    
    console.log(`[PomodoroApp] Settings - fullscreen: ${settings.fullscreenBreak}, allScreens: ${settings.allScreensBreak}`);
    console.log(`[PomodoroApp] breakWindows object:`, this.breakWindows);
    console.log(`[PomodoroApp] breakWindows.show method exists:`, typeof this.breakWindows.show === 'function');
    
    try {
      // 显示休息窗口（传递设置）
      console.log('[PomodoroApp] Calling breakWindows.show()...');
      this.breakWindows.show(breakType, settings);
      console.log('[PomodoroApp] breakWindows.show() completed successfully');
    } catch (error) {
      console.error('[PomodoroApp] Error in breakWindows.show():', error);
    }
    
    // 注册休息期间的快捷键
    try {
      console.log('[PomodoroApp] Registering break shortcuts...');
      this.shortcuts.registerBreakShortcuts(this);
      console.log('[PomodoroApp] Break shortcuts registered');
    } catch (error) {
      console.error('[PomodoroApp] Error registering shortcuts:', error);
    }
    
    // 发送通知
    try {
      console.log('[PomodoroApp] Sending notification...');
      this.showNotification(
        breakType === 'short_break' ? '短休息开始' : '长休息开始',
        '请放下工作，好好休息一下吧！'
      );
    } catch (error) {
      console.error('[PomodoroApp] Error sending notification:', error);
    }
    
    console.log(`[PomodoroApp] handleBreakStart() completed`);
    console.log(`[PomodoroApp] ==========================================`);
  }

  /**
   * 处理休息结束
   */
  private handleBreakEnd(): void {
    console.log('[PomodoroApp] Break ended');
    
    // 隐藏休息窗口
    this.breakWindows.hide();
    
    // 注销休息快捷键
    this.shortcuts.unregisterBreakShortcuts();
    
    // 重置推迟计数
    this.timer.resetPostponeCount();
  }

  /**
   * 处理休息完成
   */
  private handleBreakComplete(): void {
    console.log('[PomodoroApp] Break completed by user');
    
    // 隐藏休息窗口
    this.breakWindows.hide();
    
    // 注销休息快捷键
    this.shortcuts.unregisterBreakShortcuts();
    
    // 完成休息计时
    this.timer.completeBreak();
    
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
      console.log('[PomodoroApp] Break postponed');
      
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
    console.log('[PomodoroApp] Break skipped');
    
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

// 创建应用实例
const pomodoroApp = new PomodoroApp();
pomodoroApp.initialize().catch(console.error);

export { pomodoroApp, PomodoroApp };
