import { BrowserWindow, screen, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import { Settings } from '../../shared/types';

/**
 * BreakWindowManager - 管理休息窗口
 * 完全借鉴 Stretchly 的实现
 */
export class BreakWindowManager {
  private breakWins: BrowserWindow[] | null = null;
  private currentBreakType: 'short_break' | 'long_break' = 'short_break';
  private settings: Settings | null = null;
  private breakDuration: number = 0;
  private startTime: number = 0;
  private postponesNumber: number = 0;
  private onBreakCompleteCallback: (() => void) | null = null;

  constructor() {
    // Stretchly 使用数组来管理多窗口
    this.breakWins = null;
  }

  /**
   * 开始短休息（借鉴 Stretchly startMicrobreak）
   */
  showShortBreak(settings: Settings): void {
    this.settings = settings;
    this.currentBreakType = 'short_break';
    
    // 如果已经在休息，不重复创建（检查是否有实际窗口）
    if (this.breakWins && this.breakWins.length > 0) {
      return;
    }
    
    // 确保清理任何残留状态
    this.breakWins = null;

    const breakDuration = settings.shortBreakDuration * 60 * 1000; // 转换为毫秒
    const strictMode = settings.breakStrictMode;
    const postponesLimit = settings.postponeLimit;
    const postponableDurationPercent = settings.postponeDelayPercent;
    const postponable = settings.postponeEnabled && this.postponesNumber < postponesLimit && postponesLimit > 0;
    const showBreaksAsRegularWindows = false; // Stretchly 默认 false，使用无边框

    this.breakDuration = breakDuration;
    this.startTime = Date.now();

    const modalPath = 'file://' + path.join(__dirname, '../../renderer/break.html');
    this.breakWins = [];

    // 创建窗口 - 遍历所有显示器
    const displayCount = settings.allScreensBreak ? screen.getAllDisplays().length : 1;
    
    for (let localDisplayId = 0; localDisplayId < displayCount; localDisplayId++) {
      
      const windowOptions: Electron.BrowserWindowConstructorOptions = {
        width: Math.floor(this.getDisplayWidth(localDisplayId) * settings.breakWindowWidth),
        height: Math.floor(this.getDisplayHeight(localDisplayId) * settings.breakWindowHeight),
        autoHideMenuBar: true,
        resizable: false,
        frame: showBreaksAsRegularWindows, // Stretchly: false = 无边框
        show: false,
        transparent: false, // 完全覆盖，不使用透明
        backgroundColor: this.currentBreakType === 'short_break' ? '#10b981' : '#3b82f6', // 实色背景
        skipTaskbar: !showBreaksAsRegularWindows,
        focusable: showBreaksAsRegularWindows,
        alwaysOnTop: !showBreaksAsRegularWindows,
        hasShadow: false,
        title: 'Pomodoro',
        titleBarStyle: process.platform === 'darwin' ? (showBreaksAsRegularWindows ? 'default' : 'hidden') : undefined,
        webPreferences: {
          preload: path.join(__dirname, '../preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        }
      };

      // Stretchly 全屏处理
      if (settings.fullscreenBreak && process.platform !== 'darwin') {
        windowOptions.width = this.getDisplayWidth(localDisplayId);
        windowOptions.height = this.getDisplayHeight(localDisplayId);
        windowOptions.x = this.getDisplayX(localDisplayId, 0, true);
        windowOptions.y = this.getDisplayY(localDisplayId, 0, true);
      } else if (!(settings.fullscreenBreak && process.platform === 'win32')) {
        // 居中显示
        windowOptions.x = this.getDisplayX(localDisplayId, windowOptions.width as number, false);
        windowOptions.y = this.getDisplayY(localDisplayId, windowOptions.height as number, false);
      }

      let breakWinLocal: BrowserWindow;
      try {
        breakWinLocal = new BrowserWindow(windowOptions);
      } catch (err) {
        console.error(`[BreakWindowManager] Failed to create window ${localDisplayId}:`, err);
        continue;
      }
      
      // Stretchly: 使用 setSize 帮助解决多显示器问题
      try {
        breakWinLocal.setSize(windowOptions.width as number, windowOptions.height as number);
      } catch (err) {
        console.error(`[BreakWindowManager] setSize failed for window ${localDisplayId}:`, err);
      }

      // 设置 IPC 处理器 - Stretchly 使用 handle 发送数据
      if (localDisplayId === 0) {
        // 只在第一个窗口注册 IPC，避免重复
        // 先移除可能存在的旧处理器
        try {
          ipcMain.removeHandler('send-break-data');
        } catch (e) {
          // 处理器可能不存在，忽略错误
        }
        
        ipcMain.handle('send-break-data', () => {
          const shortcut = settings.shortcuts?.endBreak || 'CmdOrCtrl+X';
          
          // 注册全局快捷键
          if (shortcut && !globalShortcut.isRegistered(shortcut)) {
            globalShortcut.register(shortcut, () => {
              const passedPercent = (Date.now() - this.startTime) / this.breakDuration * 100;
              
              if (passedPercent >= 100) {
                this.finishBreak();
                return;
              }
              
              // 检查是否可以推迟
              if (this.canPostpone(postponable, passedPercent, postponableDurationPercent)) {
                this.postponeBreak();
              } else if (this.canSkip(strictMode, postponable, passedPercent, postponableDurationPercent)) {
                this.finishBreak();
              }
            });
          }

          const data = [
            ['休息标题', '休息内容'], // idea
            this.startTime,         // started
            this.breakDuration,     // duration
            strictMode,             // strictMode
            postponable,            // postponable
            postponableDurationPercent, // postponePercent
            windowOptions.backgroundColor // backgroundColor
          ];
          return data;
        });
      }

      // 监听窗口加载完成 - Stretchly 使用 once
      // 注意：每个窗口都应该监听加载完成
      breakWinLocal.once('ready-to-show', () => {
        
        if (showBreaksAsRegularWindows) {
          breakWinLocal.show();
        } else {
          breakWinLocal.showInactive(); // Stretchly: 不抢夺焦点
        }

        // macOS Kiosk 模式
        if (process.platform === 'darwin') {
          if (showBreaksAsRegularWindows) {
            breakWinLocal.setFullScreen(settings.fullscreenBreak);
          } else {
            breakWinLocal.setMinimizable(false);
            breakWinLocal.setClosable(false);
            breakWinLocal.setKiosk(settings.fullscreenBreak);
          }
        }

        // 非全屏且非macOS时居中
        if (!settings.fullscreenBreak && process.platform !== 'darwin') {
          setTimeout(() => {
            breakWinLocal.center();
          }, 0);
        }
      });

      // 监听窗口加载失败
      breakWinLocal.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
        console.error(`[BreakWindowManager] Window ${localDisplayId} failed to load: ${errorCode} - ${errorDescription}`);
      });

      // 加载页面
      try {
        breakWinLocal.loadURL(modalPath);
      } catch (err) {
        console.error(`[BreakWindowManager] Failed to load window ${localDisplayId}:`, err);
        continue;
      }
      
      breakWinLocal.setVisibleOnAllWorkspaces(true);
      breakWinLocal.setAlwaysOnTop(!showBreaksAsRegularWindows, 'pop-up-menu');

      // 严格模式处理
      breakWinLocal.on('close', (e) => {
        if (this.getTimeLeft() > 0 && settings.breakStrictMode) {
          e.preventDefault();
        }
      });

      this.breakWins.push(breakWinLocal);

      // 如果不显示在所有屏幕，跳出循环
      if (!settings.allScreensBreak) {
        break;
      }
    }

    // macOS: 隐藏 dock 图标
    if (process.platform === 'darwin') {
      const { app } = require('electron');
      if (app.dock.isVisible) {
        app.dock.hide();
      }
    }
  }

  /**
   * 开始长休息
   */
  showLongBreak(settings: Settings): void {
    this.settings = settings;
    this.currentBreakType = 'long_break';
    
    // 如果已经在休息，不重复创建（检查是否有实际窗口）
    if (this.breakWins && this.breakWins.length > 0) {
      return;
    }
    
    // 确保清理任何残留状态
    this.breakWins = null;

    const breakDuration = settings.longBreakDuration * 60 * 1000;
    const strictMode = settings.breakStrictMode;
    const postponesLimit = settings.postponeLimit;
    const postponableDurationPercent = settings.postponeDelayPercent;
    const postponable = settings.postponeEnabled && this.postponesNumber < postponesLimit && postponesLimit > 0;
    const showBreaksAsRegularWindows = false;

    this.breakDuration = breakDuration;
    this.startTime = Date.now();

    const modalPath = 'file://' + path.join(__dirname, '../../renderer/break.html');
    this.breakWins = [];

    const displayCount = settings.allScreensBreak ? screen.getAllDisplays().length : 1;
    
    for (let localDisplayId = 0; localDisplayId < displayCount; localDisplayId++) {
      
      const windowOptions: Electron.BrowserWindowConstructorOptions = {
        width: Math.floor(this.getDisplayWidth(localDisplayId) * settings.breakWindowWidth),
        height: Math.floor(this.getDisplayHeight(localDisplayId) * settings.breakWindowHeight),
        autoHideMenuBar: true,
        resizable: false,
        frame: showBreaksAsRegularWindows,
        show: false,
        transparent: false, // 完全覆盖，不使用透明
        backgroundColor: '#3b82f6', // 实色背景
        skipTaskbar: !showBreaksAsRegularWindows,
        focusable: showBreaksAsRegularWindows,
        alwaysOnTop: !showBreaksAsRegularWindows,
        hasShadow: false,
        title: 'Pomodoro',
        titleBarStyle: process.platform === 'darwin' ? (showBreaksAsRegularWindows ? 'default' : 'hidden') : undefined,
        webPreferences: {
          preload: path.join(__dirname, '../preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        }
      };

      if (settings.fullscreenBreak && process.platform !== 'darwin') {
        windowOptions.width = this.getDisplayWidth(localDisplayId);
        windowOptions.height = this.getDisplayHeight(localDisplayId);
        windowOptions.x = this.getDisplayX(localDisplayId, 0, true);
        windowOptions.y = this.getDisplayY(localDisplayId, 0, true);
      } else if (!(settings.fullscreenBreak && process.platform === 'win32')) {
        windowOptions.x = this.getDisplayX(localDisplayId, windowOptions.width as number, false);
        windowOptions.y = this.getDisplayY(localDisplayId, windowOptions.height as number, false);
      }

      let breakWinLocal: BrowserWindow;
      try {
        breakWinLocal = new BrowserWindow(windowOptions);
      } catch (err) {
        console.error(`[BreakWindowManager] Failed to create window ${localDisplayId}:`, err);
        continue;
      }
      
      try {
        breakWinLocal.setSize(windowOptions.width as number, windowOptions.height as number);
      } catch (err) {
        console.error(`[BreakWindowManager] setSize failed for window ${localDisplayId}:`, err);
      }

      if (localDisplayId === 0) {
        // 先移除可能存在的旧处理器
        try {
          ipcMain.removeHandler('send-break-data');
        } catch (e) {
          // 处理器可能不存在，忽略错误
        }
        
        ipcMain.handle('send-break-data', () => {
          const shortcut = settings.shortcuts?.endBreak || 'CmdOrCtrl+X';
          
          if (shortcut && !globalShortcut.isRegistered(shortcut)) {
            globalShortcut.register(shortcut, () => {
              const passedPercent = (Date.now() - this.startTime) / this.breakDuration * 100;
              
              if (passedPercent >= 100) {
                this.finishBreak();
                return;
              }
              
              if (this.canPostpone(postponable, passedPercent, postponableDurationPercent)) {
                this.postponeBreak();
              } else if (this.canSkip(strictMode, postponable, passedPercent, postponableDurationPercent)) {
                this.finishBreak();
              }
            });
          }

          const data = [
            ['长休息', '好好休息一下吧'],
            this.startTime,
            this.breakDuration,
            strictMode,
            postponable,
            postponableDurationPercent,
            windowOptions.backgroundColor
          ];
          return data;
        });
      }

      breakWinLocal.once('ready-to-show', () => {
        
        if (showBreaksAsRegularWindows) {
          breakWinLocal.show();
        } else {
          breakWinLocal.showInactive();
        }

        if (process.platform === 'darwin') {
          if (showBreaksAsRegularWindows) {
            breakWinLocal.setFullScreen(settings.fullscreenBreak);
          } else {
            breakWinLocal.setMinimizable(false);
            breakWinLocal.setClosable(false);
            breakWinLocal.setKiosk(settings.fullscreenBreak);
          }
        }

        if (!settings.fullscreenBreak && process.platform !== 'darwin') {
          setTimeout(() => {
            breakWinLocal.center();
          }, 0);
        }
      });

      breakWinLocal.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
        console.error(`[BreakWindowManager] Window ${localDisplayId} failed to load: ${errorCode} - ${errorDescription}`);
      });

      try {
        breakWinLocal.loadURL(modalPath);
      } catch (err) {
        console.error(`[BreakWindowManager] Failed to load window ${localDisplayId}:`, err);
        continue;
      }
      
      breakWinLocal.setVisibleOnAllWorkspaces(true);
      breakWinLocal.setAlwaysOnTop(!showBreaksAsRegularWindows, 'pop-up-menu');

      breakWinLocal.on('close', (e) => {
        if (this.getTimeLeft() > 0 && settings.breakStrictMode) {
          e.preventDefault();
        }
      });

      this.breakWins.push(breakWinLocal);

      if (!settings.allScreensBreak) {
        break;
      }
    }

    if (process.platform === 'darwin') {
      const { app } = require('electron');
      if (app.dock.isVisible) {
        app.dock.hide();
      }
    }
  }

  /**
   * 显示休息窗口（通用方法）
   */
  show(breakType: 'short_break' | 'long_break', settings: Settings): void {
    if (breakType === 'short_break') {
      this.showShortBreak(settings);
    } else {
      this.showLongBreak(settings);
    }
  }

  /**
   * 完成休息 - 借鉴 Stretchly breakComplete
   */
  finishBreak(shouldPlaySound: boolean = false): void {
    try {
      const shortcut = this.settings?.shortcuts?.endBreak;
      if (shortcut) {
        if (globalShortcut.isRegistered(shortcut)) {
          globalShortcut.unregister(shortcut);
        }
      }
    } catch (err) {
      console.error('[BreakWindowManager] Error handling shortcut:', err);
    }

    this.breakWins = this.closeWindows(this.breakWins);
    this.postponesNumber = 0;
  }

  /**
   * 推迟休息 - 借鉴 Stretchly postponeBreak
   */
  postponeBreak(): void {
    this.finishBreak(false);
    this.postponesNumber++;
  }

  /**
   * 关闭所有窗口 - 借鉴 Stretchly closeWindows
   */
  private closeWindows(windows: BrowserWindow[] | null): null {
    if (!windows) return null;
    
    for (const window of windows) {
      if (!window || window.isDestroyed()) {
        continue;
      }

      window.hide();
      
      // 移除 IPC 处理器（只在第一个窗口）
      if (windows[0] === window) {
        try {
          ipcMain.removeHandler('send-break-data');
        } catch (e) {
          // Handler might not exist
        }
      }

      // 使用 destroy() 立即清理
      window.destroy();
    }
    
    return null;
  }

  /**
   * 隐藏休息窗口
   */
  hide(): void {
    this.breakWins = this.closeWindows(this.breakWins);
  }

  /**
   * 检查是否可以推迟 - 借鉴 Stretchly canPostpone
   */
  private canPostpone(postponable: boolean, passedPercent: number, postponableDurationPercent: number): boolean {
    return postponable && passedPercent < postponableDurationPercent;
  }

  /**
   * 检查是否可以跳过 - 借鉴 Stretchly canSkip
   */
  private canSkip(strictMode: boolean, postponable: boolean, passedPercent: number, postponableDurationPercent: number): boolean {
    if (strictMode) {
      return false;
    }
    if (postponable && passedPercent < postponableDurationPercent) {
      return false;
    }
    return true;
  }

  /**
   * 获取剩余时间
   */
  private getTimeLeft(): number {
    const passed = Date.now() - this.startTime;
    return Math.max(0, this.breakDuration - passed);
  }

  /**
   * 计算背景颜色（带透明度）- 借鉴 Stretchly calculateBackgroundColor
   */
  private calculateBackgroundColor(color: string, transparentMode: boolean, opacity: number): string {
    let opacityMultiplier = 1;
    if (transparentMode) {
      opacityMultiplier = opacity;
    }
    return color + Math.round(opacityMultiplier * 255).toString(16).padStart(2, '0');
  }

  /**
   * DisplayManager 辅助方法
   */
  private getDisplayCount(): number {
    return screen.getAllDisplays().length;
  }

  private getDisplayBounds(displayID: number = -1): Electron.Rectangle {
    const displays = screen.getAllDisplays();
    if (displayID === -1 || displayID >= displays.length) {
      return screen.getPrimaryDisplay().bounds;
    }
    return displays[displayID].bounds;
  }

  private getDisplayX(displayID: number = -1, width: number = 800, fullscreen: boolean = false): number {
    const bounds = this.getDisplayBounds(displayID);
    if (fullscreen) {
      return Math.floor(bounds.x);
    } else {
      return Math.floor(bounds.x + ((bounds.width - width) / 2));
    }
  }

  private getDisplayY(displayID: number = -1, height: number = 600, fullscreen: boolean = false): number {
    const bounds = this.getDisplayBounds(displayID);
    if (fullscreen) {
      return Math.floor(bounds.y);
    } else {
      return Math.floor(bounds.y + ((bounds.height - height) / 2));
    }
  }

  private getDisplayWidth(displayID: number = -1): number {
    return Math.floor(this.getDisplayBounds(displayID).width);
  }

  private getDisplayHeight(displayID: number = -1): number {
    return Math.floor(this.getDisplayBounds(displayID).height);
  }

  /**
   * 获取窗口列表
   */
  getWindows(): BrowserWindow[] | null {
    return this.breakWins;
  }

  /**
   * 检查是否可见
   */
  isVisible(): boolean {
    return this.breakWins !== null && this.breakWins.length > 0 && 
           this.breakWins.some(win => !win.isDestroyed() && win.isVisible());
  }

  /**
   * 获取推迟次数
   */
  getPostponeCount(): number {
    return this.postponesNumber;
  }

  /**
   * 重置推迟次数
   */
  resetPostponeCount(): void {
    this.postponesNumber = 0;
  }

  /**
   * 设置休息完成回调
   */
  setOnBreakComplete(callback: () => void): void {
    this.onBreakCompleteCallback = callback;
  }

  /**
   * 更新倒计时显示 - 广播到所有休息窗口
   * 修复：实现真实的计时更新，让渲染进程能收到倒计时
   */
  updateTime(timeRemaining: number, totalTime: number): void {
    if (!this.breakWins || this.breakWins.length === 0) {
      return;
    }

    // 计算进度
    const progress = Math.round((1 - timeRemaining / totalTime) * 100);
    
    // 计算是否可以推迟
    const elapsed = totalTime - timeRemaining;
    const percentElapsed = (elapsed / totalTime) * 100;
    const canPostpone = this.settings?.postponeEnabled && 
                       this.postponesNumber < (this.settings?.postponeLimit || 1) &&
                       percentElapsed < (this.settings?.postponeDelayPercent || 30);

    // 广播到所有窗口
    const tickData = {
      timeRemaining,
      totalTime,
      progress,
      canPostpone,
      postponeCount: this.postponesNumber,
      postponeLimit: this.settings?.postponeLimit || 1
    };

    for (const win of this.breakWins) {
      if (!win.isDestroyed()) {
        win.webContents.send('break-tick', tickData);
      }
    }

    // 如果倒计时结束，自动完成休息
    if (timeRemaining === 0) {
      setTimeout(() => {
        this.finishBreak(true);
        // 通知计时器休息已完成
        if (this.onBreakCompleteCallback) {
          this.onBreakCompleteCallback();
        }
      }, 1000); // 延迟1秒让用户看到0:00
    }
  }
}
