import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';
import { MainWindowManager } from './windows/main-window';

/**
 * Creates a default tray icon programmatically as fallback
 */
function createDefaultIcon(): Electron.NativeImage {
  // Create a simple 16x16 red circle icon (tomato-like color)
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 6;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (dist <= radius) {
        // Red color (tomato)
        canvas[idx] = 239;     // R
        canvas[idx + 1] = 68;  // G  
        canvas[idx + 2] = 68;  // B
        canvas[idx + 3] = 255; // A
      } else {
        // Transparent
        canvas[idx] = 0;
        canvas[idx + 1] = 0;
        canvas[idx + 2] = 0;
        canvas[idx + 3] = 0;
      }
    }
  }
  
  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

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
      if (icon.isEmpty()) {
        console.warn('[TrayManager] Icon file not found, using fallback');
        icon = createDefaultIcon();
      } else {
        if (process.platform === 'darwin') {
          icon = icon.resize({ width: 16, height: 16 });
          icon.setTemplateImage(true);
        } else if (process.platform === 'win32') {
          icon = icon.resize({ width: 16, height: 16 });
        }
      }
    } catch {
      console.warn('[TrayManager] Failed to load icon, using fallback');
      icon = createDefaultIcon();
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('Pomodoro');
    console.log('[TrayManager] Tray created');

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

    console.log(`[TrayManager] Update tooltip: phase=${phase}, time=${timeRemaining}`);

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

    console.log(`[TrayManager] Set icon: type=${iconType}`);

    const iconNames: Record<string, string> = {
      default: 'tray-icon.png',
      running: 'tray-icon-running.png',
      break: 'tray-icon-break.png',
    };

    const iconPath = path.join(__dirname, '../../assets', iconNames[iconType] || iconNames.default);
    
    try {
      let icon = nativeImage.createFromPath(iconPath);
      if (icon.isEmpty()) {
        // Use default icon as fallback
        icon = this.createRunningIcon(iconType === 'break' ? '#22c55e' : '#ef4444');
      }
      if (process.platform === 'darwin') {
        icon = icon.resize({ width: 16, height: 16 });
        icon.setTemplateImage(true);
      } else if (process.platform === 'win32') {
        icon = icon.resize({ width: 16, height: 16 });
      }
      this.tray.setImage(icon);
    } catch (error) {
      console.error('[TrayManager] Failed to set tray icon:', error);
    }
  }

  /**
   * Creates a colored icon programmatically
   */
  private createRunningIcon(color: string): Electron.NativeImage {
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    
    // Parse hex color
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 6;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (dist <= radius) {
          canvas[idx] = r;
          canvas[idx + 1] = g;
          canvas[idx + 2] = b;
          canvas[idx + 3] = 255;
        } else {
          canvas[idx] = 0;
          canvas[idx + 1] = 0;
          canvas[idx + 2] = 0;
          canvas[idx + 3] = 0;
        }
      }
    }
    
    return nativeImage.createFromBuffer(canvas, { width: size, height: size });
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
      console.log('[TrayManager] Tray destroyed');
      this.tray.destroy();
      this.tray = null;
    }
  }
}
