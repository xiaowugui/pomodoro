import { globalShortcut } from 'electron';
import { PomodoroApp } from './index';
import { StorageManager } from './storage';

/**
 * ShortcutsManager - 管理全局快捷键
 * 支持常规快捷键和休息期间的专用快捷键
 */
export class ShortcutsManager {
  private registeredShortcuts: string[] = [];
  private breakShortcuts: string[] = [];
  private storage: StorageManager;
  private app: PomodoroApp | null = null;

  constructor() {
    this.storage = new StorageManager();
  }

  /**
   * 注册常规全局快捷键
   */
  register(app: PomodoroApp): void {
    this.app = app;
    this.unregisterAll();

    const settings = this.storage.getSettings();
    const shortcuts = settings.shortcuts;

    // 切换计时器
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

    // 跳过阶段
    if (shortcuts.skipPhase) {
      this.registerShortcut(shortcuts.skipPhase, () => {
        app.getTimer().skip();
      });
    }

    // 显示窗口
    if (shortcuts.showWindow) {
      this.registerShortcut(shortcuts.showWindow, () => {
        app.getMainWindow().show();
      });
    }
  }

  /**
   * 注册休息期间的专用快捷键
   * 这些快捷键只在休息窗口显示时生效
   */
  registerBreakShortcuts(app: PomodoroApp): void {
    this.app = app;
    
    // 先注销之前的休息快捷键
    this.unregisterBreakShortcuts();

    const settings = this.storage.getSettings();
    const shortcuts = settings.shortcuts;

    // 结束休息快捷键 (Stretchly风格: Cmd/Ctrl+X)
    if (shortcuts.endBreak) {
      const success = this.registerBreakShortcut(shortcuts.endBreak, () => {
        // 检查是否允许结束（非严格模式）
        if (!settings.breakStrictMode) {
          app.getBreakWindows().hide();
          // 完成休息
          if (typeof app.getTimer().completeBreak === 'function') {
            app.getTimer().completeBreak();
          } else {
            app.getTimer().skip();
          }
          this.unregisterBreakShortcuts();
        }
      });
      
    }

    // 推迟休息快捷键
    if (settings.postponeEnabled && shortcuts.postponeBreak) {
      this.registerBreakShortcut(shortcuts.postponeBreak, () => {
        const breakWindows = app.getBreakWindows();
        // 推迟休息
        breakWindows.postponeBreak();
        // 注销快捷键
        this.unregisterBreakShortcuts();
      });
    }
  }

  /**
   * 注销休息期间的快捷键
   */
  unregisterBreakShortcuts(): void {
    for (const shortcut of this.breakShortcuts) {
      try {
        globalShortcut.unregister(shortcut);
      } catch (error) {
        console.error(`[ShortcutsManager] Error unregistering shortcut ${shortcut}:`, error);
      }
    }
    this.breakShortcuts = [];
  }

  /**
   * 更新快捷键（重新注册）
   */
  updateShortcuts(app: PomodoroApp): void {
    this.register(app);
  }

  /**
   * 注册单个快捷键（常规）
   */
  private registerShortcut(accelerator: string, callback: () => void): boolean {
    try {
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.registeredShortcuts.push(accelerator);
      }
      return success;
    } catch (error) {
      console.error(`[ShortcutsManager] Error registering shortcut ${accelerator}:`, error);
      return false;
    }
  }

  /**
   * 注册休息专用快捷键
   */
  private registerBreakShortcut(accelerator: string, callback: () => void): boolean {
    try {
      // 检查是否已注册
      if (globalShortcut.isRegistered(accelerator)) {
        return false;
      }
      
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.breakShortcuts.push(accelerator);
      }
      return success;
    } catch (error) {
      console.error(`[ShortcutsManager] Error registering break shortcut ${accelerator}:`, error);
      return false;
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    // 注销常规快捷键
    for (const shortcut of this.registeredShortcuts) {
      try {
        globalShortcut.unregister(shortcut);
      } catch (error) {
        console.error(`[ShortcutsManager] Error unregistering shortcut ${shortcut}:`, error);
      }
    }
    this.registeredShortcuts = [];
    
    // 注销休息快捷键
    this.unregisterBreakShortcuts();
    
    // 确保全部清理
    globalShortcut.unregisterAll();
  }

  /**
   * 获取已注册的快捷键列表
   */
  getRegisteredShortcuts(): string[] {
    return [...this.registeredShortcuts];
  }

  /**
   * 获取休息专用快捷键列表
   */
  getBreakShortcuts(): string[] {
    return [...this.breakShortcuts];
  }

  /**
   * 检查快捷键是否已注册
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }
}
