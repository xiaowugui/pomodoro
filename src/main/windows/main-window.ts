import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

export class MainWindowManager {
  private window: BrowserWindow | null = null;

  create(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      return this.window;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const windowWidth = Math.min(DEFAULT_WIDTH, screenWidth - 100);
    const windowHeight = Math.min(DEFAULT_HEIGHT, screenHeight - 100);
    const x = Math.round((screenWidth - windowWidth) / 2);
    const y = Math.round((screenHeight - windowHeight) / 2);

    this.window = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      minWidth: MIN_WIDTH,
      minHeight: MIN_HEIGHT,
      title: 'Pomodoro',
      icon: path.join(__dirname, '../../assets/icon.png'),
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      vibrancy: process.platform === 'darwin' ? 'sidebar' : undefined,
    });

    this.window.once('ready-to-show', () => {
      this.window?.show();
    });

    this.window.on('close', (event) => {
      if (process.platform === 'darwin') {
        event.preventDefault();
        this.window?.hide();
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    this.window.on('focus', () => {
      this.window?.flashFrame(false);
    });

    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      this.window.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }

    // Log any loading errors
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('[MainWindow] Failed to load:', errorCode, errorDescription);
    });

    console.log(`[MainWindow] Create: ${windowWidth}x${windowHeight} at (${x},${y})`);

    return this.window;
  }

  show(): void {
    if (!this.window || this.window.isDestroyed()) {
      this.create();
      return;
    }

    const wasMinimized = this.window.isMinimized();
    if (wasMinimized) {
      this.window.restore();
    }

    this.window.show();
    this.window.focus();
    console.log(`[MainWindow] Show: wasMinimized=${wasMinimized}`);
  }

  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
    console.log('[MainWindow] Hide');
  }

  isVisible(): boolean {
    return this.window ? this.window.isVisible() : false;
  }

  close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    console.log('[MainWindow] Close');
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }

  get webContents() {
    return this.window?.webContents || null;
  }

  send(channel: string, ...args: any[]): void {
    if (this.window && !this.window.isDestroyed() && this.window.webContents) {
      this.window.webContents.send(channel, ...args);
    }
  }

  flashFrame(flag: boolean): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.flashFrame(flag);
    }
  }
}
