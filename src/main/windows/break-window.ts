import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { Settings } from '../../shared/types';
import { DisplayManager } from '../utils/display-manager';

/**
 * BreakWindowManager - 管理休息窗口
 * 借鉴 Stretchly 的实现，支持全屏、多显示器、无边框窗口
 */
export class BreakWindowManager {
  private windows: BrowserWindow[] = [];
  private currentBreakType: 'short_break' | 'long_break' = 'short_break';
  private settings: Settings | null = null;
  private displayManager: DisplayManager;
  private isBreakActive: boolean = false;
  private canPostpone: boolean = true;
  private postponeCount: number = 0;

  constructor() {
    this.displayManager = new DisplayManager();
  }

  /**
   * 显示休息窗口
   * @param breakType 休息类型
   * @param settings 应用设置
   */
  show(breakType: 'short_break' | 'long_break', settings: Settings): void {
    console.log(`[BreakWindowManager] show() called with breakType=${breakType}`);
    console.log(`[BreakWindowManager] settings:`, JSON.stringify(settings, null, 2));
    
    this.currentBreakType = breakType;
    this.settings = settings;
    this.isBreakActive = true;
    this.canPostpone = true;
    this.postponeCount = 0;

    // 先关闭已有窗口
    console.log('[BreakWindowManager] Hiding existing windows...');
    this.hide();

    // 确定要显示的显示器数量
    const displayCount = settings.allScreensBreak 
      ? this.displayManager.getDisplayCount() 
      : 1;
    
    console.log(`[BreakWindowManager] Will create ${displayCount} window(s), allScreens=${settings.allScreensBreak}`);

    // 在所有指定显示器上创建窗口
    for (let displayId = 0; displayId < displayCount; displayId++) {
      console.log(`[BreakWindowManager] Creating window for display ${displayId}`);
      this.createBreakWindow(displayId, breakType, settings);
    }

    console.log(`[BreakWindowManager] Created ${displayCount} break window(s) for ${breakType}`);
  }

  /**
   * 创建单个休息窗口
   */
  private createBreakWindow(
    displayId: number, 
    breakType: 'short_break' | 'long_break', 
    settings: Settings
  ): void {
    const windowOptions = this.buildWindowOptions(displayId, breakType, settings);
    const win = new BrowserWindow(windowOptions);

    // macOS kiosk 模式（真正的全屏）
    if (process.platform === 'darwin' && settings.fullscreenBreak) {
      win.setMinimizable(false);
      win.setClosable(!settings.breakStrictMode);
      win.setKiosk(true);
    }

    // 设置在所有工作区可见
    win.setVisibleOnAllWorkspaces(true);
    win.setAlwaysOnTop(!settings.breakStrictMode, 'pop-up-menu');

    // 严格模式：阻止关闭窗口
    if (settings.breakStrictMode) {
      win.on('close', (e) => {
        if (this.isBreakActive) {
          console.log('[BreakWindowManager] Preventing close in strict mode');
          e.preventDefault();
        }
      });
    }

    // 窗口关闭时清理
    win.on('closed', () => {
      const index = this.windows.indexOf(win);
      if (index > -1) {
        this.windows.splice(index, 1);
      }
    });

    // 加载页面
    if (process.env.VITE_DEV_SERVER_URL) {
      const devUrl = `${process.env.VITE_DEV_SERVER_URL}break.html?type=${breakType}`;
      console.log(`[BreakWindowManager] Loading dev URL: ${devUrl}`);
      win.loadURL(devUrl).catch(err => {
        console.error('[BreakWindowManager] Failed to load dev URL:', err);
      });
    } else {
      const filePath = path.join(__dirname, '../../renderer/break.html');
      console.log(`[BreakWindowManager] Loading file: ${filePath}`);
      console.log(`[BreakWindowManager] __dirname: ${__dirname}`);
      win.loadFile(filePath, {
        query: { type: breakType },
      }).catch(err => {
        console.error('[BreakWindowManager] Failed to load file:', err);
      });
    }

    // 显示窗口（非激活模式，不抢夺焦点）
    win.once('ready-to-show', () => {
      if (settings.breakStrictMode) {
        win.show();
        win.focus();
      } else {
        win.showInactive();
      }
    });

    this.windows.push(win);
  }

  /**
   * 构建窗口选项
   */
  private buildWindowOptions(
    displayId: number,
    breakType: 'short_break' | 'long_break',
    settings: Settings
  ): Electron.BrowserWindowConstructorOptions {
    // 计算窗口大小
    let width: number;
    let height: number;

    if (settings.fullscreenBreak) {
      // 全屏模式：使用显示器完整尺寸
      width = this.displayManager.getDisplayWidth(displayId);
      height = this.displayManager.getDisplayHeight(displayId);
    } else {
      // 窗口模式：使用百分比尺寸
      const size = this.displayManager.getWindowSize(
        displayId,
        settings.breakWindowWidth,
        settings.breakWindowHeight
      );
      width = size.width;
      height = size.height;
    }

    // 计算位置
    const x = this.displayManager.getCenteredX(displayId, width, settings.fullscreenBreak);
    const y = this.displayManager.getCenteredY(displayId, height, settings.fullscreenBreak);

    // 根据休息类型设置颜色
    const backgroundColor = breakType === 'short_break' 
      ? (settings.transparentMode ? '#00000000' : '#10b981')
      : (settings.transparentMode ? '#00000000' : '#3b82f6');

    return {
      width,
      height,
      x,
      y,
      fullscreen: settings.fullscreenBreak && process.platform !== 'darwin', // macOS使用kiosk模式
      frame: false,                    // 无边框
      transparent: settings.transparentMode,
      opacity: settings.breakOpacity,
      backgroundColor,
      title: breakType === 'short_break' ? '短休息' : '长休息',
      
      // 窗口行为
      skipTaskbar: true,               // 不在任务栏显示
      focusable: !settings.breakStrictMode,  // 严格模式下不可聚焦（防止Alt+Tab）
      alwaysOnTop: true,
      hasShadow: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: !settings.breakStrictMode,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        backgroundThrottling: false,
      },
    };
  }

  /**
   * 隐藏/关闭所有休息窗口
   */
  hide(): void {
    this.isBreakActive = false;
    
    for (const win of this.windows) {
      if (!win.isDestroyed()) {
        // 移除close事件监听器，允许关闭
        win.removeAllListeners('close');
        win.close();
      }
    }
    
    this.windows = [];
  }

  /**
   * 检查是否有窗口可见
   */
  isVisible(): boolean {
    return this.windows.some(win => 
      !win.isDestroyed() && win.isVisible()
    );
  }

  /**
   * 更新倒计时显示
   */
  updateTime(timeRemaining: number, totalTime: number): void {
    if (!this.isBreakActive) return;

    const progress = Math.round((1 - timeRemaining / totalTime) * 100);
    
    // 检查是否可以推迟
    if (this.settings?.postponeEnabled) {
      const elapsed = totalTime - timeRemaining;
      const percentElapsed = (elapsed / totalTime) * 100;
      this.canPostpone = percentElapsed < this.settings.postponeDelayPercent;
    }

    this.broadcastToAllWindows('break-tick', {
      timeRemaining,
      totalTime,
      progress,
      canPostpone: this.canPostpone,
      postponeCount: this.postponeCount,
      postponeLimit: this.settings?.postponeLimit || 1,
    });
  }

  /**
   * 更新跳过状态
   */
  updateSkipStatus(canSkip: boolean): void {
    this.broadcastToAllWindows('break-skip-status', { canSkip });
  }

  /**
   * 更新严格模式状态
   */
  updateStrictMode(enabled: boolean): void {
    this.broadcastToAllWindows('break-strict-mode', { enabled });
  }

  /**
   * 广播消息到所有窗口
   */
  private broadcastToAllWindows(channel: string, data: any): void {
    for (const win of this.windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, data);
      }
    }
  }

  /**
   * 推迟休息
   */
  postpone(): boolean {
    if (!this.settings?.postponeEnabled) {
      console.log('[BreakWindowManager] Postpone disabled');
      return false;
    }

    if (!this.canPostpone) {
      console.log('[BreakWindowManager] Cannot postpone (time limit exceeded)');
      return false;
    }

    if (this.postponeCount >= (this.settings.postponeLimit || 1)) {
      console.log('[BreakWindowManager] Postpone limit reached');
      return false;
    }

    this.postponeCount++;
    console.log(`[BreakWindowManager] Postponed break (${this.postponeCount}/${this.settings.postponeLimit})`);
    
    // 更新所有窗口的推迟状态
    this.broadcastToAllWindows('break-postpone-count', {
      count: this.postponeCount,
      limit: this.settings.postponeLimit,
    });

    return true;
  }

  /**
   * 获取推迟次数
   */
  getPostponeCount(): number {
    return this.postponeCount;
  }

  /**
   * 获取是否可以推迟
   */
  getCanPostpone(): boolean {
    return this.canPostpone && this.postponeCount < (this.settings?.postponeLimit || 1);
  }

  /**
   * 获取窗口列表
   */
  getWindows(): BrowserWindow[] {
    return this.windows.filter(win => !win.isDestroyed());
  }

  /**
   * 获取主窗口（第一个窗口）
   */
  getMainWindow(): BrowserWindow | null {
    return this.windows[0] && !this.windows[0].isDestroyed() 
      ? this.windows[0] 
      : null;
  }

  /**
   * 检查休息是否处于活动状态
   */
  getIsBreakActive(): boolean {
    return this.isBreakActive;
  }
}
