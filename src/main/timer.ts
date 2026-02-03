import { EventEmitter } from 'events';
import { StorageManager } from './storage';
import { TimerState, Settings, PomodoroLog } from '../shared/types';

interface TimerEvents {
  tick: (state: TimerState) => void;
  complete: (phase: 'work' | 'short_break' | 'long_break' | 'idle', taskId: string | null) => void;
  'phase-change': (phase: 'work' | 'short_break' | 'long_break' | 'idle') => void;
  'break-start': (breakType: 'short_break' | 'long_break') => void;
  'break-end': () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skip: () => void;
}

export class TimerManager extends EventEmitter {
  private state: TimerState;
  private storage: StorageManager;
  private intervalId: NodeJS.Timeout | null = null;
  private settings: Settings;
  private sessionStartTime: string | null = null;


  constructor(storage: StorageManager) {
    super();
    this.storage = storage;
    this.settings = storage.getSettings();
    
    this.state = {
      isRunning: false,
      timeRemaining: this.settings.pomodoroDuration * 60,
      totalTime: this.settings.pomodoroDuration * 60,
      phase: 'idle',
      currentTaskId: null,
      pomodorosCompleted: 0,
      sessionId: null,
    };

    this.loadState();
  }

  private loadState(): void {
    // Could load persisted timer state here if needed
  }

  private saveState(): void {
    // Could persist timer state here if needed
  }

  start(taskId?: string): void {
    if (this.state.isRunning) return;

    this.settings = this.storage.getSettings();

    if (this.state.phase === 'idle') {
      this.state.phase = 'work';
      this.state.totalTime = this.settings.pomodoroDuration * 60;
      this.state.timeRemaining = this.state.totalTime;
      this.state.currentTaskId = taskId || null;
      this.state.sessionId = this.generateId();
      this.sessionStartTime = new Date().toISOString();
    }

    this.state.isRunning = true;
    this.startTicking();
    
    this.emit('start');
    this.emit('phase-change', this.state.phase);
    this.saveState();
  }

  pause(): void {
    if (!this.state.isRunning) return;

    this.state.isRunning = false;
    this.stopTicking();
    
    this.emit('pause');
    this.saveState();
  }

  resume(): void {
    if (this.state.isRunning || this.state.phase === 'idle') return;

    this.state.isRunning = true;
    this.startTicking();
    
    this.emit('resume');
    this.saveState();
  }

  stop(): void {
    this.state.isRunning = false;
    this.stopTicking();
    
    if (this.sessionStartTime && this.state.phase === 'work') {
      this.saveIncompleteLog();
    }

    this.state.phase = 'idle';
    this.state.timeRemaining = this.settings.pomodoroDuration * 60;
    this.state.totalTime = this.settings.pomodoroDuration * 60;
    this.state.currentTaskId = null;
    this.state.sessionId = null;
    this.sessionStartTime = null;
    
    this.emit('stop');
    this.emit('phase-change', 'idle');
    this.saveState();
  }

  skip(): void {
    this.stopTicking();
    
    if (this.sessionStartTime && this.state.phase === 'work') {
      this.saveIncompleteLog();
    }

    this.transitionToNextPhase();
  }

  complete(): void {
    this.stopTicking();
    
    const completedPhase = this.state.phase;
    const taskId = this.state.currentTaskId;
    
    // 如果是工作阶段，保存为已完成并增加计数
    if (this.sessionStartTime && this.state.phase === 'work') {
      this.saveCompletedLog();
      // 增加任务计数
      if (this.state.currentTaskId) {
        this.incrementTaskPomodoro(this.state.currentTaskId);
      }
    }

    // 发送完成事件，让前端知道计时已完成
    this.emit('complete', completedPhase, taskId);
    
    this.transitionToNextPhase();
  }

  postpone(): void {
    if (this.state.phase === 'work') return;

    this.stopTicking();
    
    const postponeSeconds = this.settings.postponeMinutes * 60;
    this.state.phase = 'work';
    this.state.totalTime = postponeSeconds;
    this.state.timeRemaining = postponeSeconds;
    this.state.isRunning = true;
    this.sessionStartTime = new Date().toISOString();
    
    this.startTicking();
    this.emit('phase-change', 'work');
    this.saveState();
  }

  completeBreak(): void {
    this.stopTicking();
    this.transitionToNextPhase();
  }

  setTask(taskId: string | null): void {
    this.state.currentTaskId = taskId;
    this.saveState();
  }

  private startTicking(): void {
    this.stopTicking();
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private stopTicking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.state.timeRemaining > 0) {
      this.state.timeRemaining--;
      this.emit('tick', this.getState());
      this.saveState();
    } else {
      this.handleTimerComplete();
    }
  }

  private handleTimerComplete(): void {
    this.stopTicking();
    
    const completedPhase = this.state.phase;
    const taskId = this.state.currentTaskId;

    if (completedPhase === 'work') {
      this.state.pomodorosCompleted++;
      this.saveCompletedLog();
      // 增加任务计数
      if (taskId) {
        this.incrementTaskPomodoro(taskId);
      }
    }

    this.emit('complete', completedPhase, taskId);
    this.transitionToNextPhase();
  }

  private transitionToNextPhase(): void {
    this.settings = this.storage.getSettings();

    if (this.state.phase === 'work') {
      if (this.state.pomodorosCompleted % this.settings.longBreakInterval === 0) {
        this.state.phase = 'long_break';
        this.state.totalTime = this.settings.longBreakDuration * 60;
      } else {
        this.state.phase = 'short_break';
        this.state.totalTime = this.settings.shortBreakDuration * 60;
      }
      
      this.state.timeRemaining = this.state.totalTime;
      this.state.sessionId = this.generateId();
      this.sessionStartTime = new Date().toISOString();
      
      const breakType = this.state.phase === 'long_break' ? 'long_break' : 'short_break';
      this.emit('break-start', breakType);
      
      // 休息阶段自动开始倒计时（默认行为）
      this.state.isRunning = true;
      this.startTicking();
    } else {
      this.breakWindows?.emit('break-end');
      
      this.state.phase = 'work';
      this.state.totalTime = this.settings.pomodoroDuration * 60;
      this.state.timeRemaining = this.state.totalTime;
      this.state.sessionId = this.generateId();
      this.sessionStartTime = new Date().toISOString();
      
      // 根据设置决定是否自动开始下一个番茄钟
      if (this.settings.autoStartPomodoros) {
        this.state.isRunning = true;
        this.startTicking();
      } else {
        this.state.isRunning = false;
      }
    }

    this.emit('phase-change', this.state.phase);
    this.emit('tick', this.getState());
    this.saveState();
  }

  private saveCompletedLog(): void {
    if (!this.sessionStartTime || !this.state.currentTaskId) return;

    const now = new Date().toISOString();
    const duration = this.state.totalTime - this.state.timeRemaining;

    const log: Omit<PomodoroLog, 'id'> = {
      taskId: this.state.currentTaskId,
      projectId: this.getProjectIdFromTask(this.state.currentTaskId),
      startTime: this.sessionStartTime,
      endTime: now,
      duration,
      completed: true,
      type: 'work',
    };

    this.storage.createLog(log);
  }

  private saveIncompleteLog(): void {
    if (!this.sessionStartTime || !this.state.currentTaskId) return;

    const now = new Date().toISOString();
    const duration = this.state.totalTime - this.state.timeRemaining;

    if (duration < 60) return; // Don't save if less than 1 minute

    const log: Omit<PomodoroLog, 'id'> = {
      taskId: this.state.currentTaskId,
      projectId: this.getProjectIdFromTask(this.state.currentTaskId),
      startTime: this.sessionStartTime,
      endTime: now,
      duration,
      completed: false,
      type: 'work',
    };

    this.storage.createLog(log);
  }

  private getProjectIdFromTask(taskId: string): string {
    const tasks = this.storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    return task?.projectId || '';
  }

  private incrementTaskPomodoro(taskId: string): void {
    const tasks = this.storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completedPomodoros = (task.completedPomodoros || 0) + 1;
      this.storage.updateTask(task);
    }
  }

  getState(): TimerState {
    return { ...this.state };
  }

  isRunning(): boolean {
    return this.state.isRunning;
  }

  getRemainingTime(): number {
    return this.state.timeRemaining;
  }

  getPhase(): string {
    return this.state.phase;
  }

  canSkip(): boolean {
    if (this.state.phase === 'idle') return false;
    
    const elapsed = this.state.totalTime - this.state.timeRemaining;
    const percentComplete = (elapsed / this.state.totalTime) * 100;
    
    return percentComplete >= this.settings.skipDelayPercent;
  }

  destroy(): void {
    this.stopTicking();
    this.removeAllListeners();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Reference to break window manager for emitting events
  private breakWindows: EventEmitter | null = null;
  setBreakWindowsManager(manager: EventEmitter): void {
    this.breakWindows = manager;
  }

  on<K extends keyof TimerEvents>(event: K, listener: TimerEvents[K]): this {
    return super.on(event, listener);
  }

  emit<K extends keyof TimerEvents>(event: K, ...args: Parameters<TimerEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}
