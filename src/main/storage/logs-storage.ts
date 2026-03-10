import { BaseStorage } from './base-storage';
import { PomodoroLog } from '../../shared/types';

interface LogsStorageData {
  logs: PomodoroLog[];
}

export class LogsStorage extends BaseStorage<LogsStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'logs.json',
      defaultValue: { logs: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<LogsStorageData>): LogsStorageData {
    return {
      logs: parsed.logs || [],
    };
  }

  protected getDefaultValue(): LogsStorageData {
    return { logs: [] };
  }

  getAll(): LogsStorageData {
    return { logs: [...this.data.logs] };
  }

  getItems(): PomodoroLog[] {
    return [...this.data.logs];
  }

  getById(id: string): PomodoroLog | undefined {
    return this.data.logs.find(l => l.id === id);
  }

  getByTask(taskId: string): PomodoroLog[] {
    return this.data.logs.filter(l => l.taskId === taskId);
  }

  getByProject(projectId: string): PomodoroLog[] {
    return this.data.logs.filter(l => l.projectId === projectId);
  }

  getByDateRange(startDate: string, endDate: string): PomodoroLog[] {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return this.data.logs.filter(l => {
      const logDate = new Date(l.startTime);
      return logDate >= start && logDate <= end;
    });
  }

  getCompleted(): PomodoroLog[] {
    return this.data.logs.filter(l => l.completed);
  }

  getWorkLogs(): PomodoroLog[] {
    return this.data.logs.filter(l => l.type === 'work');
  }

  getWorkLogsCompleted(): PomodoroLog[] {
    return this.data.logs.filter(l => l.type === 'work' && l.completed);
  }

  create(log: Omit<PomodoroLog, 'id'>): PomodoroLog {
    const newLog: PomodoroLog = {
      ...log,
      id: this.generateId(),
    };
    this.data.logs.push(newLog);
    this.markDirty();
    this.save();
    return newLog;
  }

  update(log: PomodoroLog): PomodoroLog {
    const index = this.data.logs.findIndex(l => l.id === log.id);
    if (index === -1) {
      throw new Error(`Log not found: ${log.id}`);
    }
    this.data.logs[index] = { ...log };
    this.markDirty();
    this.save();
    return this.data.logs[index];
  }

  delete(id: string): boolean {
    const index = this.data.logs.findIndex(l => l.id === id);
    if (index === -1) {
      return false;
    }
    this.data.logs.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  deleteByTask(taskId: string): number {
    const initialLength = this.data.logs.length;
    this.data.logs = this.data.logs.filter(l => l.taskId !== taskId);
    const deleted = initialLength - this.data.logs.length;
    if (deleted > 0) {
      this.markDirty();
      this.save();
    }
    return deleted;
  }

  getTotalWorkMinutes(): number {
    return this.data.logs
      .filter(l => l.completed && l.type === 'work')
      .reduce((sum, l) => sum + l.duration, 0) / 60;
  }

  getTotalPomodoros(): number {
    return this.data.logs.filter(l => l.completed && l.type === 'work').length;
  }
}
