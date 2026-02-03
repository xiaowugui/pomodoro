import { app, BrowserWindow, ipcMain, Notification, powerMonitor } from 'electron';
import * as path from 'path';
import { StorageManager } from './storage';
import { MainWindowManager } from './windows/main-window';
import { BreakWindowManager } from './windows/break-window';
import { TrayManager } from './tray';
import { ShortcutsManager } from './shortcuts';
import { TimerManager } from './timer';
import { IPC_CHANNELS, Settings, Project, Task, PomodoroLog, defaultSettings } from '../shared/types';

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
    ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => {
      return this.storage.getSettings();
    });

    ipcMain.handle(IPC_CHANNELS.SET_SETTINGS, (_, settings: Settings) => {
      this.storage.setSettings(settings);
      this.mainWindow.webContents?.send(IPC_CHANNELS.SETTINGS_CHANGED, settings);
      return settings;
    });

    ipcMain.handle(IPC_CHANNELS.GET_DATA, () => {
      return {
        projects: this.storage.getProjects(),
        tasks: this.storage.getTasks(),
        logs: this.storage.getLogs(),
      };
    });

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

    ipcMain.handle(IPC_CHANNELS.GET_LOGS, () => {
      return this.storage.getLogs();
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_LOG, (_, log: Omit<PomodoroLog, 'id'>) => {
      return this.storage.createLog(log);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_LOG, (_, log: PomodoroLog) => {
      return this.storage.updateLog(log);
    });

    ipcMain.handle(IPC_CHANNELS.SHOW_MAIN_WINDOW, () => {
      this.mainWindow.show();
    });

    ipcMain.handle(IPC_CHANNELS.HIDE_MAIN_WINDOW, () => {
      this.mainWindow.hide();
    });

    ipcMain.handle(IPC_CHANNELS.QUIT_APP, () => {
      app.quit();
    });

    ipcMain.handle(IPC_CHANNELS.SHOW_NOTIFICATION, (_, title: string, body: string) => {
      this.showNotification(title, body);
    });

    ipcMain.handle(IPC_CHANNELS.BREAK_WINDOW_ACTION, (_, action: 'skip' | 'postpone' | 'complete') => {
      this.handleBreakWindowAction(action);
    });

    // Timer control handlers
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
    this.timer.on('tick', (state) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, state);
      this.tray.updateTooltip(state.timeRemaining, state.phase);
    });

    this.timer.on('complete', (phase, taskId) => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_COMPLETE, { phase, taskId });
      
      if (phase === 'work') {
        this.handleWorkComplete(taskId);
      } else {
        this.handleBreakComplete();
      }
      
      // 刷新任务数据，让前端获取最新的任务计数
      this.mainWindow.webContents?.send('data-updated');
    });

    this.timer.on('pause', () => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, this.timer.getState());
    });

    this.timer.on('stop', () => {
      this.mainWindow.webContents?.send(IPC_CHANNELS.TIMER_TICK, this.timer.getState());
    });

    this.timer.on('phase-change', (phase) => {
      this.mainWindow.webContents?.send('timer-phase-change', phase);
    });

    // 休息弹窗已移除，休息只在主界面显示
  }

  private setupPowerMonitor(): void {
    powerMonitor.on('suspend', () => {
      if (this.timer.isRunning()) {
        this.timer.pause();
      }
    });

    powerMonitor.on('resume', () => {
      const settings = this.storage.getSettings();
      if (settings.autoStartPomodoros && this.timer.getState().phase === 'work') {
        this.timer.resume();
      }
    });

    powerMonitor.on('lock-screen', () => {
      if (this.timer.isRunning()) {
        this.timer.pause();
      }
    });

    powerMonitor.on('unlock-screen', () => {
      const settings = this.storage.getSettings();
      if (settings.autoStartPomodoros && this.timer.getState().phase === 'work') {
        this.timer.resume();
      }
    });
  }

  private handleWorkComplete(taskId: string | null): void {
    const settings = this.storage.getSettings();
    
    this.showNotification(
      '番茄钟完成！',
      '工作时间结束，准备休息一下。'
    );

    // 注意：任务计数已在 timer.ts 的 handleTimerComplete 或 complete 方法中增加
    // 这里不需要再增加，避免重复计数

    this.mainWindow.flashFrame(true);
    
    if (process.platform === 'darwin') {
      app.dock.bounce();
    }
  }

  private handleBreakComplete(): void {
    this.breakWindows.hide();
    
    this.showNotification(
      '休息结束！',
      '准备好开始下一个番茄钟了吗？'
    );

    this.mainWindow.flashFrame(true);
  }

  private handleBreakWindowAction(action: 'skip' | 'postpone' | 'complete'): void {
    switch (action) {
      case 'skip':
        this.timer.skip();
        break;
      case 'postpone':
        this.timer.postpone();
        break;
      case 'complete':
        this.breakWindows.hide();
        this.timer.completeBreak();
        break;
    }
  }

  private showNotification(title: string, body: string): void {
    const settings = this.storage.getSettings();
    if (!settings.notificationEnabled) return;

    new Notification({
      title,
      body,
      silent: !settings.soundEnabled,
    }).show();
  }

  private onWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate(): void {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.mainWindow.create();
    } else {
      this.mainWindow.show();
    }
  }

  private onBeforeQuit(): void {
    this.shortcuts.unregisterAll();
    this.timer.destroy();
  }

  getMainWindow(): MainWindowManager {
    return this.mainWindow;
  }

  getTimer(): TimerManager {
    return this.timer;
  }

  getStorage(): StorageManager {
    return this.storage;
  }

  quit(): void {
    app.quit();
  }
}

const pomodoroApp = new PomodoroApp();
pomodoroApp.initialize().catch(console.error);

export { pomodoroApp, PomodoroApp };
