import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import { MainWindowManager } from './windows/main-window';

export class TrayManager {
  private tray: Tray | null = null;

  create(mainWindow: MainWindowManager): Tray {
    if (this.tray) {
      return this.tray;
    }

    const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
    let icon: Electron.NativeImage;

    try {
      icon = nativeImage.createFromPath(iconPath);
      if (process.platform === 'darwin') {
        icon = icon.resize({ width: 16, height: 16 });
        icon.setTemplateImage(true);
      } else if (process.platform === 'win32') {
        icon = icon.resize({ width: 16, height: 16 });
      }
    } catch {
      icon = nativeImage.createEmpty();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Pomodoro');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => {
          mainWindow.show();
        },
      },
      { type: 'separator' },
      {
        label: '开始/暂停',
        click: () => {
          mainWindow.webContents?.send('tray-toggle-timer');
        },
      },
      {
        label: '跳过当前阶段',
        click: () => {
          mainWindow.webContents?.send('tray-skip-phase');
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);

    this.tray.on('click', () => {
      mainWindow.show();
    });

    this.tray.on('double-click', () => {
      mainWindow.show();
    });

    return this.tray;
  }

  updateTooltip(timeRemaining: number, phase: string): void {
    if (!this.tray) return;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const phaseNames: Record<string, string> = {
      work: '专注中',
      short_break: '短休息',
      long_break: '长休息',
      idle: '待机',
    };

    this.tray.setToolTip(`Pomodoro - ${phaseNames[phase] || phase} (${timeStr})`);
  }

  setIcon(iconType: 'default' | 'running' | 'break'): void {
    if (!this.tray) return;

    const iconNames: Record<string, string> = {
      default: 'tray-icon.png',
      running: 'tray-icon-running.png',
      break: 'tray-icon-break.png',
    };

    const iconPath = path.join(__dirname, '../../assets', iconNames[iconType] || iconNames.default);
    
    try {
      let icon = nativeImage.createFromPath(iconPath);
      if (process.platform === 'darwin') {
        icon = icon.resize({ width: 16, height: 16 });
        icon.setTemplateImage(true);
      } else if (process.platform === 'win32') {
        icon = icon.resize({ width: 16, height: 16 });
      }
      this.tray.setImage(icon);
    } catch (error) {
      console.error('Failed to set tray icon:', error);
    }
  }

  getDockMenu(): Menu {
    return Menu.buildFromTemplate([
      {
        label: '新建任务',
        click: () => {
          // Send message to renderer to open new task dialog
        },
      },
      {
        label: '开始番茄钟',
        click: () => {
          // Send message to renderer to start timer
        },
      },
      { type: 'separator' },
      {
        label: '显示统计',
        click: () => {
          // Send message to renderer to show stats
        },
      },
    ]);
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
