import { EventEmitter } from 'events';
import { powerMonitor } from 'electron';
import { StorageManager } from './storage';

interface IdleDetectorEvents {
  'idle-detected': (taskId: string | null, reason: 'idle' | 'locked') => void;
  'user-active': () => void;
}

export class IdleDetector extends EventEmitter {
  private storage: StorageManager;
  private currentTaskId: string | null = null;
  private isMonitoring: boolean = false;
  private lockStartTime: number | null = null;

  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
  }

  setCurrentTask(taskId: string | null): void {
    this.currentTaskId = taskId;
  }

  start(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lockStartTime = null;
    this.setupPowerMonitor();
  }

  stop(): void {
    this.isMonitoring = false;
    this.lockStartTime = null;
  }

  private setupPowerMonitor(): void {
    powerMonitor.on('suspend', () => {
      if (!this.isMonitoring) return;
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

  private handleLockScreen(): void {
    const timer = (this.storage as any).timer;
    if (timer && timer.pause) {
      timer.pause();
    }

    if (this.lockStartTime) {
      this.recordLockLog();
    }

    this.emit('idle-detected', this.currentTaskId, 'locked');
    this.lockStartTime = Date.now();
  }

  recordActivity(): void {
    if (this.lockStartTime) {
      this.recordLockLog();
      this.emit('user-active');
    }
    this.lockStartTime = null;
  }

  private recordLockLog(): void {
    if (!this.lockStartTime) return;

    const now = new Date();
    const startTime = new Date(this.lockStartTime);
    const durationMinutes = Math.round((now.getTime() - this.lockStartTime) / 60000);

    if (durationMinutes < 1) return;

    try {
      this.storage.createIdleLog({
        taskId: this.currentTaskId || 'no-task',
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        durationMinutes,
        reason: 'locked',
      });
    } catch (error) {
      console.error('[IdleDetector] Failed to record lock log:', error);
    }
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}
