import { BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';

/**
 * TaskNoteWindowManager - 管理任务备注窗口
 * 双击任务时打开一个独立的备注编辑窗口
 */
export class TaskNoteWindowManager {
  private noteWindows: Map<string, BrowserWindow> = new Map();

  /**
   * 打开任务备注窗口
   */
  show(taskId: string): BrowserWindow | null {
    // 如果窗口已存在且未关闭，则聚焦
    const existingWindow = this.noteWindows.get(taskId);
    if (existingWindow && !existingWindow.isDestroyed()) {
      existingWindow.focus();
      console.log(`[TaskNoteWindow] Show: taskId=${taskId}, existingWindow=true`);
      return existingWindow;
    }

    console.log(`[TaskNoteWindow] Show: taskId=${taskId}, existingWindow=false`);

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // 创建小一点的窗口用于备注编辑
    const windowWidth = Math.min(600, screenWidth - 100);
    const windowHeight = Math.min(700, screenHeight - 100);
    const x = Math.round((screenWidth - windowWidth) / 2);
    const y = Math.round((screenHeight - windowHeight) / 2);

    const noteWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      title: '任务备注',
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    });

    noteWindow.once('ready-to-show', () => {
      noteWindow.show();
    });

    // 窗口关闭时移除引用
    noteWindow.on('closed', () => {
      this.noteWindows.delete(taskId);
    });

    // 加载备注弹窗页面，带任务ID参数
    const notesUrl = process.env.VITE_DEV_SERVER_URL
      ? `${process.env.VITE_DEV_SERVER_URL}#/note/${taskId}`
      : `file://${path.join(__dirname, '../../renderer/index.html')}#/note/${taskId}`;

    noteWindow.loadURL(notesUrl);

    // 保存窗口引用
    this.noteWindows.set(taskId, noteWindow);

    return noteWindow;
  }

  /**
   * 关闭指定任务的备注窗口
   */
  close(taskId: string): void {
    console.log(`[TaskNoteWindow] Close: taskId=${taskId}`);
    const window = this.noteWindows.get(taskId);
    if (window && !window.isDestroyed()) {
      window.close();
    }
    this.noteWindows.delete(taskId);
  }

  /**
   * 关闭所有备注窗口
   */
  closeAll(): void {
    const windowCount = this.noteWindows.size;
    console.log(`[TaskNoteWindow] Close all: ${windowCount} windows`);
    for (const [taskId, window] of this.noteWindows) {
      if (!window.isDestroyed()) {
        window.close();
      }
    }
    this.noteWindows.clear();
  }

  /**
   * 获取窗口
   */
  getWindow(taskId: string): BrowserWindow | undefined {
    return this.noteWindows.get(taskId);
  }
}
