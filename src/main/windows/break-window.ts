import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

export class BreakWindowManager {
  private window: BrowserWindow | null = null;
  private currentBreakType: 'short_break' | 'long_break' = 'short_break';

  show(breakType: 'short_break' | 'long_break'): void {
    this.currentBreakType = breakType;
    this.hide();

    // 创建简单弹窗 - 400x500像素，居中显示
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    this.window = new BrowserWindow({
      width: 400,
      height: 500,
      x: Math.round((width - 400) / 2),
      y: Math.round((height - 500) / 2),
      fullscreen: false,
      frame: true, // 显示窗口边框和标题栏
      alwaysOnTop: true,
      skipTaskbar: false, // 在任务栏显示
      focusable: true,
      modal: false,
      transparent: false,
      backgroundColor: breakType === 'short_break' ? '#10b981' : '#3b82f6',
      title: breakType === 'short_break' ? '短休息' : '长休息',
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      show: false,
      // 允许关闭按钮
      closable: true,
      minimizable: false,
      maximizable: false,
      resizable: false,
    });

    // 窗口关闭时清理引用
    this.window.on('close', () => {
      this.window = null;
    });

    this.window.once('ready-to-show', () => {
      this.window?.show();
      this.window?.focus();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    // 加载break页面
    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(`${process.env.VITE_DEV_SERVER_URL}break.html?type=${breakType}`);
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/break.html'), {
        query: { type: breakType },
      });
    }
  }

  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }

  isVisible(): boolean {
    return this.window !== null && !this.window.isDestroyed() && this.window.isVisible();
  }

  updateTime(timeRemaining: number, totalTime: number): void {
    if (this.window && !this.window.isDestroyed()) {
      const progress = Math.round((1 - timeRemaining / totalTime) * 100);
      this.window.webContents.send('break-tick', {
        timeRemaining,
        totalTime,
        progress,
      });
    }
  }

  updateSkipStatus(canSkip: boolean): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('break-skip-status', { canSkip });
    }
  }

  getWindow(): BrowserWindow | null {
    return this.window && !this.window.isDestroyed() ? this.window : null;
  }
}
