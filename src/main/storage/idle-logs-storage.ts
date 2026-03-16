import { BaseStorage } from './base-storage';
import { IdleLog } from '../../shared/types';

interface IdleLogsStorageData {
  idleLogs: IdleLog[];
}

export class IdleLogsStorage extends BaseStorage<IdleLogsStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'idle-logs.json',
      defaultValue: { idleLogs: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<IdleLogsStorageData>): IdleLogsStorageData {
    return {
      idleLogs: parsed.idleLogs || [],
    };
  }

  protected getDefaultValue(): IdleLogsStorageData {
    return { idleLogs: [] };
  }

  getAll(): IdleLogsStorageData {
    return { idleLogs: [...this.data.idleLogs] };
  }

  getItems(): IdleLog[] {
    return [...this.data.idleLogs];
  }

  getById(id: string): IdleLog | undefined {
    return this.data.idleLogs.find(l => l.id === id);
  }

  getByTask(taskId: string): IdleLog[] {
    return this.data.idleLogs.filter(l => l.taskId === taskId);
  }

  getByDateRange(startDate: string, endDate: string): IdleLog[] {
    return this.data.idleLogs.filter(l => {
      const logDate = l.startTime.split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });
  }

  create(idleLog: Omit<IdleLog, 'id'>): IdleLog {
    const newLog: IdleLog = {
      ...idleLog,
      id: this.generateId(),
    };
    this.data.idleLogs.push(newLog);
    this.markDirty();
    this.save();
    return newLog;
  }

  delete(id: string): boolean {
    const index = this.data.idleLogs.findIndex(l => l.id === id);
    if (index === -1) {
      return false;
    }
    this.data.idleLogs.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  deleteByTask(taskId: string): number {
    const before = this.data.idleLogs.length;
    this.data.idleLogs = this.data.idleLogs.filter(l => l.taskId !== taskId);
    const deleted = before - this.data.idleLogs.length;
    if (deleted > 0) {
      this.markDirty();
      this.save();
    }
    return deleted;
  }
}
