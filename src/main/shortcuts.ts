import { globalShortcut } from 'electron';
import { PomodoroApp } from './index';
import { StorageManager } from './storage';

export class ShortcutsManager {
  private registeredShortcuts: string[] = [];
  private storage: StorageManager;

  constructor() {
    this.storage = new StorageManager();
  }

  register(app: PomodoroApp): void {
    this.unregisterAll();

    const settings = this.storage.getSettings();
    const shortcuts = settings.shortcuts;

    if (shortcuts.toggleTimer) {
      this.registerShortcut(shortcuts.toggleTimer, () => {
        const timer = app.getTimer();
        if (timer.isRunning()) {
          timer.pause();
        } else {
          timer.start();
        }
      });
    }

    if (shortcuts.skipPhase) {
      this.registerShortcut(shortcuts.skipPhase, () => {
        app.getTimer().skip();
      });
    }

    if (shortcuts.showWindow) {
      this.registerShortcut(shortcuts.showWindow, () => {
        app.getMainWindow().show();
      });
    }
  }

  private registerShortcut(accelerator: string, callback: () => void): boolean {
    try {
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.registeredShortcuts.push(accelerator);
      } else {
        console.warn(`Failed to register shortcut: ${accelerator}`);
      }
      return success;
    } catch (error) {
      console.error(`Error registering shortcut ${accelerator}:`, error);
      return false;
    }
  }

  updateShortcuts(app: PomodoroApp): void {
    this.register(app);
  }

  unregisterAll(): void {
    for (const shortcut of this.registeredShortcuts) {
      try {
        globalShortcut.unregister(shortcut);
      } catch (error) {
        console.error(`Error unregistering shortcut ${shortcut}:`, error);
      }
    }
    this.registeredShortcuts = [];
    
    globalShortcut.unregisterAll();
  }

  getRegisteredShortcuts(): string[] {
    return [...this.registeredShortcuts];
  }

  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }
}
