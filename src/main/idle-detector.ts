import { EventEmitter } from 'events';
import { powerMonitor, BrowserWindow } from 'electron';
import { StorageManager } from './storage';

interface IdleDetectorEvents {
  'idle-detected': (taskId: string | null, reason: 'idle' | 'locked') => void;
  'user-active': () => void;
}

export class IdleDetector extends EventEmitter {
  private storage: StorageManager;
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
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
    this.lastActivityTime = Date.now();
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

    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    const thresholdMs = this.idleThresholdMinutes * 60 * 1000;

    if (idleTime >= thresholdMs && !this.isIdleDetected) {
      this.isIdleDetected = true;
      this.idleStartTime = now - idleTime;
      this.handleIdleDetected();
    }
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
    this.lastActivityTime = Date.now();

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
