import { EventEmitter } from 'events';
import { StorageManager } from './storage';
import { TimerState, Settings, PomodoroLog } from '../shared/types';

interface TimerEvents {
  tick: (state: TimerState) => void;
  complete: (phase: 'work' | 'short_break' | 'long_break' | 'idle', taskId: string | null) => void;
  'phase-change': (phase: 'work' | 'short_break' | 'long_break' | 'idle') => void;
  'break-start': (breakType: 'short_break' | 'long_break') => void;
  'break-end': () => void;
  'break-postpone': (count: number) => void;
  'postpone-start': (postponeEndTime: number) => void;
  'postpone-end': () => void;
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
  private postponeCount: number = 0;
  private postponeTimeoutId: NodeJS.Timeout | null = null;
  // Postpone tracking
  private isPostponed: boolean = false;
  private postponeEndTime: number = 0;


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
    if (this.state.isRunning) {
      console.log('[TimerManager] Start ignored: already running');
      return;
    }

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
    
    console.log(`[TimerManager] Start: phase=work, taskId=${this.state.currentTaskId || 'none'}, duration=${this.state.totalTime}s`);
    
    this.emit('start');
    this.emit('phase-change', this.state.phase);
    this.saveState();
  }

  pause(): void {
    if (!this.state.isRunning) {
      console.warn('[TimerManager] Pause ignored: not running');
      return;
    }

    this.state.isRunning = false;
    this.stopTicking();
    
    console.log(`[TimerManager] Pause: phase=${this.state.phase}, timeRemaining=${this.state.timeRemaining}s`);
    
    this.emit('pause');
    this.saveState();
  }

  resume(): void {
    if (this.state.isRunning || this.state.phase === 'idle') {
      console.warn('[TimerManager] Resume ignored: already running or idle');
      return;
    }

    this.state.isRunning = true;
    this.startTicking();
    
    console.log(`[TimerManager] Resume: phase=${this.state.phase}, timeRemaining=${this.state.timeRemaining}s`);
    
    this.emit('resume');
    this.saveState();
  }

  stop(): void {
    const savedIncomplete = !!(this.sessionStartTime && this.state.phase === 'work');
    
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
    
    console.log(`[TimerManager] Stop: phase=${this.state.phase}, savedIncomplete=${savedIncomplete}`);
    
    this.emit('stop');
    this.emit('phase-change', 'idle');
    this.saveState();
  }

  skip(): void {
    console.log(`[TimerManager] Skip: fromPhase=${this.state.phase}`);
    
    this.stopTicking();
    
    if (this.sessionStartTime && this.state.phase === 'work') {
      this.saveIncompleteLog();
    }

    // 重置推迟计数
    this.resetPostponeCount();

    this.transitionToNextPhase();
  }

  complete(): void {
    console.log(`[TimerManager] Complete: phase=${this.state.phase}, taskId=${this.state.currentTaskId || 'none'}`);
    
    this.stopTicking();
    
    const completedPhase = this.state.phase;
    const taskId = this.state.currentTaskId;
    
    // 如果是工作阶段，保存为已完成并增加计数
    if (this.sessionStartTime && this.state.phase === 'work') {
      this.saveCompletedLog();
      // 增加任务计数
      if (this.state.currentTaskId) {
        this.incrementTaskPomodoro(this.state.currentTaskId, this.state.totalTime);
      }
    }

    // 发送完成事件，让前端知道计时已完成
    this.emit('complete', completedPhase, taskId);
    
    this.transitionToNextPhase();
  }

  postpone(): boolean {
    // 只能在休息阶段推迟
    if (this.state.phase !== 'short_break' && this.state.phase !== 'long_break') {
      console.warn('[TimerManager] Postpone rejected: not in break phase');
      return false;
    }

    // 检查推迟次数限制
    if (this.postponeCount >= this.settings.postponeLimit) {
      console.warn('[TimerManager] Postpone rejected: limit reached');
      return false;
    }

    // 检查是否在可推迟时间范围内
    const elapsed = this.state.totalTime - this.state.timeRemaining;
    const percentElapsed = (elapsed / this.state.totalTime) * 100;
    if (percentElapsed >= this.settings.postponeDelayPercent) {
      console.warn('[TimerManager] Postpone rejected: past delay window');
      return false;
    }

    // 增加推迟计数
    this.postponeCount++;

    console.log(`[TimerManager] Postpone scheduled: count=${this.postponeCount}, delay=${this.settings.postponeMinutes}min`);
    
    // 停止休息计时
    this.stopTicking();

    // 清除之前的推迟超时
    if (this.postponeTimeoutId) {
      clearTimeout(this.postponeTimeoutId);
    }

    // 设置推迟结束时间
    const postponeMs = this.settings.postponeMinutes * 60 * 1000;
    this.isPostponed = true;
    this.postponeEndTime = Date.now() + postponeMs;

    // 发送推迟开始事件（带推迟结束时间）
    this.emit('postpone-start', this.postponeEndTime);

    // 发送推迟事件（保持向后兼容）
    this.emit('break-postpone', this.postponeCount);

    // 设置推迟后的自动恢复
    this.postponeTimeoutId = setTimeout(() => {
      this.resumeBreakAfterPostpone();
    }, postponeMs);

    return true;
  }

  /**
   * 推迟期结束后恢复休息
   */
  private resumeBreakAfterPostpone(): void {
    // 恢复到休息状态
    this.state.isRunning = true;
    this.sessionStartTime = new Date().toISOString();
    
    // 重置推迟状态
    this.isPostponed = false;
    this.postponeEndTime = 0;

    // 发送推迟结束事件
    this.emit('postpone-end');
    
    // 重新发送break-start事件以显示休息窗口
    const breakType = this.state.phase === 'long_break' ? 'long_break' : 'short_break';
    this.emit('break-start', breakType);
    
    this.startTicking();
    this.saveState();
  }

  /**
   * 获取推迟计数
   */
  getPostponeCount(): number {
    return this.postponeCount;
  }

  /**
   * 重置推迟计数
   */
  resetPostponeCount(): void {
    this.postponeCount = 0;
    this.isPostponed = false;
    this.postponeEndTime = 0;
    if (this.postponeTimeoutId) {
      clearTimeout(this.postponeTimeoutId);
      this.postponeTimeoutId = null;
    }
  }

  completeBreak(): void {
    console.log(`[TimerManager] Break complete: phase=${this.state.phase}`);
    
    this.stopTicking();
    
    // 重置推迟计数
    this.resetPostponeCount();
    
    // 发送break-end事件
    this.emit('break-end');
    
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
    console.log(`[TimerManager] Timer complete: phase=${this.state.phase}, pomodorosCompleted=${this.state.pomodorosCompleted}`);
    
    this.stopTicking();
    
    const completedPhase = this.state.phase;
    const taskId = this.state.currentTaskId;

    if (completedPhase === 'work') {
      this.state.pomodorosCompleted++;
      this.saveCompletedLog();
      // 增加任务计数
      if (taskId) {
        this.incrementTaskPomodoro(taskId, this.state.totalTime);
      }
    }

    this.emit('complete', completedPhase, taskId);
    this.transitionToNextPhase();
  }

  private transitionToNextPhase(): void {
    const fromPhase = this.state.phase;
    this.settings = this.storage.getSettings();

    if (this.state.phase === 'work') {
      // 进入休息阶段前重置推迟计数
      this.resetPostponeCount();
      
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
      console.log('[TimerManager] Emitting break-start, phase:', this.state.phase, 'breakType:', breakType);
      this.emit('break-start', breakType);
      
      // 休息阶段自动开始倒计时（默认行为）
      this.state.isRunning = true;
      this.startTicking();
    } else {
      // 离开休息阶段时重置推迟计数
      this.resetPostponeCount();
      
      this.emit('break-end');
      
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

    console.log(`[TimerManager] Phase transition: ${fromPhase} → ${this.state.phase}, autoStart=${this.state.isRunning}`);

    this.emit('phase-change', this.state.phase);
    this.emit('tick', this.getState());
    this.saveState();
  }

  private saveCompletedLog(): void {
    if (!this.sessionStartTime || !this.state.currentTaskId) return;

    const now = new Date().toISOString();
    const duration = this.state.totalTime - this.state.timeRemaining;

    console.log(`[TimerManager] Log saved: taskId=${this.state.currentTaskId}, duration=${duration}s, completed=true`);

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

    console.log(`[TimerManager] Incomplete log saved: taskId=${this.state.currentTaskId}, duration=${duration}s`);

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

  private incrementTaskPomodoro(taskId: string, duration: number): void {
    const tasks = this.storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.completedPomodoros = (task.completedPomodoros || 0) + 1;
      this.storage.updateTask(task);
      
      // Record day execution
      this.recordDayExecution(taskId, duration);
    }
  }

  private recordDayExecution(taskId: string, duration: number): void {
    if (!taskId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const pomodorosCompleted = 1;
    const minutesWorked = Math.round(duration / 60);
    
    // Check if existing record exists
    const existingRecord = this.storage.getDayExecutionByTaskAndDate(taskId, today);
    
    if (existingRecord) {
      // Update existing record
      this.storage.updateDayExecution({
        ...existingRecord,
        pomodorosCompleted: existingRecord.pomodorosCompleted + pomodorosCompleted,
        minutesWorked: existingRecord.minutesWorked + minutesWorked,
      });
    } else {
      // Create new record
      this.storage.createDayExecution({
        taskId,
        date: today,
        pomodorosCompleted,
        minutesWorked,
      });
    }
    
    // Update task's workDates
    const tasks = this.storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const workDates = task.workDates || [];
      if (!workDates.includes(today)) {
        this.storage.updateTask({
          ...task,
          workDates: [...workDates, today],
        });
      }
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

  /**
   * 获取推迟状态
   */
  getPostponeState(): { isPostponed: boolean; postponeEndTime: number } {
    return {
      isPostponed: this.isPostponed,
      postponeEndTime: this.postponeEndTime,
    };
  }

  /**
   * 获取推迟剩余时间（毫秒）
   */
  getPostponeRemainingTime(): number {
    if (!this.isPostponed || this.postponeEndTime === 0) {
      return 0;
    }
    return Math.max(0, this.postponeEndTime - Date.now());
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
