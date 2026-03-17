import { EventEmitter } from 'events';
import { powerMonitor, BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { StorageManager } from './storage';

interface IdleDetectorEvents {
  'idle-detected': (taskId: string | null, reason: 'idle' | 'locked') => void;
  'user-active': () => void;
}

export class IdleDetector extends EventEmitter {
  private storage: StorageManager;
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private isIdleDetected: boolean = false;
  private idleStartTime: number | null = null;
  private currentTaskId: string | null = null;
  private isEnabled: boolean = true;
  private idleThresholdMinutes: number = 5;
  private isMonitoring: boolean = false;

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
    this.loadSettings();
  }

  private loadSettings(): void {
    const settings = this.storage.getSettings();
    this.isEnabled = settings.idleDetectionEnabled ?? true;
    this.idleThresholdMinutes = settings.idleThresholdMinutes ?? 5;
  }

  reloadSettings(): void {
    this.loadSettings();
  }

  setCurrentTask(taskId: string | null): void {
    this.currentTaskId = taskId;
  }

  start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.isIdleDetected = false;
    this.idleStartTime = null;

    this.setupPowerMonitor();
    this.startIdleCheck();
  }

  stop(): void {
    this.isMonitoring = false;
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    this.isIdleDetected = false;
    this.idleStartTime = null;
  }

  private setupPowerMonitor(): void {
    powerMonitor.on('suspend', () => {
      if (!this.isMonitoring) return;
      const settings = this.storage.getSettings();
      const timer = (this.storage as any).timer;
      if (timer && timer.getState && timer.getState().phase === 'work') {
        this.handleLockScreen();
      }
    });

    powerMonitor.on('lock-screen', () => {
      if (!this.isMonitoring) return;
      const timer = (this.storage as any).timer;
      if (timer && timer.getState && timer.getState().phase === 'work') {
        this.handleLockScreen();
      }
    });
  }

  private startIdleCheck(): void {
    const checkInterval = 30000;
    this.idleCheckInterval = setInterval(() => {
      this.checkIdle();
    }, checkInterval);
  }

  private checkIdle(): void {
    if (!this.isEnabled || !this.isMonitoring) return;

    const timer = (this.storage as any).timer;
    if (!timer || !timer.getState) return;

    const state = timer.getState();
    if (state.phase !== 'work') return;

    const systemIdleTime = powerMonitor.getSystemIdleTime();
    const thresholdSeconds = this.idleThresholdMinutes * 60;

    if (systemIdleTime >= thresholdSeconds && !this.isIdleDetected) {
      this.checkActiveWindow((hasActiveWindow: boolean) => {
        if (hasActiveWindow) {
          console.log('[IdleDetector] Active window detected, skipping idle detection');
          return;
        }

        this.isIdleDetected = true;
        this.idleStartTime = Date.now() - (systemIdleTime * 1000);
        this.handleIdleDetected();
      });
    }
  }

  private checkActiveWindow(callback: (hasActiveWindow: boolean) => void): void {
    if (process.platform !== 'win32') {
      callback(true);
      return;
    }

    const psCommand = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern IntPtr GetForegroundWindow();
          [DllImport("user32.dll")]
          public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        }
"@
      $hwnd = [Win32]::GetForegroundWindow()
      if ($hwnd -ne [IntPtr]::Zero) {
        $sb = New-Object System.Text.StringBuilder 256
        [Win32]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $sb.ToString()
      }
    `;

    exec(`powershell -Command "${psCommand.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`, { timeout: 3000 }, (error, stdout) => {
      if (error) {
        console.log('[IdleDetector] Failed to check active window:', error.message);
        callback(true);
        return;
      }

      const windowTitle = stdout.trim();
      const hasActiveWindow = windowTitle.length > 0;
      console.log(`[IdleDetector] Active window check: "${windowTitle}", hasActiveWindow: ${hasActiveWindow}`);
      callback(hasActiveWindow);
    });
  }

  private handleIdleDetected(): void {
    const timer = (this.storage as any).timer;
    if (timer && timer.pause) {
      timer.pause();
    }

    this.emit('idle-detected', this.currentTaskId, 'idle');
  }

  private handleLockScreen(): void {
    const timer = (this.storage as any).timer;
    if (timer && timer.pause) {
      timer.pause();
    }

    if (this.isIdleDetected && this.idleStartTime) {
      this.recordIdleLog('locked');
    }

    this.emit('idle-detected', this.currentTaskId, 'locked');
    this.isIdleDetected = false;
    this.idleStartTime = null;
  }

  recordActivity(): void {
    const wasIdle = this.isIdleDetected;

    if (this.isIdleDetected && this.idleStartTime) {
      this.recordIdleLog('idle');
    }

    this.isIdleDetected = false;
    this.idleStartTime = null;

    if (wasIdle) {
      this.emit('user-active');
    }
  }

  private recordIdleLog(reason: 'idle' | 'locked'): void {
    if (!this.idleStartTime) return;

    const now = new Date();
    const startTime = new Date(this.idleStartTime);
    const durationMinutes = Math.round((now.getTime() - startTime.getTime()) / 60000);

    if (durationMinutes < 1) return;

    try {
      this.storage.createIdleLog({
        taskId: this.currentTaskId || 'no-task',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes,
        reason,
      });
    } catch (error) {
      console.error('[IdleDetector] Failed to record idle log:', error);
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}
