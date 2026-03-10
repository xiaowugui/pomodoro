import { BaseStorage } from './base-storage';
import { TaskDayExecution } from '../../shared/types';

interface ExecutionsStorageData {
  dayExecutions: TaskDayExecution[];
}

export class ExecutionsStorage extends BaseStorage<ExecutionsStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'executions.json',
      defaultValue: { dayExecutions: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<ExecutionsStorageData>): ExecutionsStorageData {
    return {
      dayExecutions: parsed.dayExecutions || [],
    };
  }

  protected getDefaultValue(): ExecutionsStorageData {
    return { dayExecutions: [] };
  }

  getAll(): ExecutionsStorageData {
    return { dayExecutions: [...this.data.dayExecutions] };
  }

  getItems(): TaskDayExecution[] {
    return [...this.data.dayExecutions];
  }

  getById(id: string): TaskDayExecution | undefined {
    return this.data.dayExecutions.find(e => e.id === id);
  }

  getByDate(date: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(e => e.date === date);
  }

  getByTask(taskId: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(e => e.taskId === taskId);
  }

  getByTaskAndDate(taskId: string, date: string): TaskDayExecution | undefined {
    return this.data.dayExecutions.find(e => e.taskId === taskId && e.date === date);
  }

  getByDateRange(startDate: string, endDate: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(e => e.date >= startDate && e.date <= endDate);
  }

  create(execution: Omit<TaskDayExecution, 'id' | 'createdAt'>): TaskDayExecution {
    const newExecution: TaskDayExecution = {
      ...execution,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    this.data.dayExecutions.push(newExecution);
    this.markDirty();
    this.save();
    return newExecution;
  }

  update(execution: TaskDayExecution): TaskDayExecution {
    const index = this.data.dayExecutions.findIndex(e => e.id === execution.id);
    if (index === -1) {
      throw new Error(`Execution not found: ${execution.id}`);
    }
    this.data.dayExecutions[index] = { ...execution };
    this.markDirty();
    this.save();
    return this.data.dayExecutions[index];
  }

  delete(id: string): boolean {
    const index = this.data.dayExecutions.findIndex(e => e.id === id);
    if (index === -1) {
      return false;
    }
    this.data.dayExecutions.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  deleteByTask(taskId: string): number {
    const initialLength = this.data.dayExecutions.length;
    this.data.dayExecutions = this.data.dayExecutions.filter(e => e.taskId !== taskId);
    const deleted = initialLength - this.data.dayExecutions.length;
    if (deleted > 0) {
      this.markDirty();
      this.save();
    }
    return deleted;
  }

  upsertByTaskAndDate(
    taskId: string,
    date: string,
    pomodorosToAdd: number,
    minutesToAdd: number
  ): TaskDayExecution {
    const existing = this.getByTaskAndDate(taskId, date);
    
    if (existing) {
      return this.update({
        ...existing,
        pomodorosCompleted: existing.pomodorosCompleted + pomodorosToAdd,
        minutesWorked: existing.minutesWorked + minutesToAdd,
      });
    } else {
      return this.create({
        taskId,
        date,
        pomodorosCompleted: pomodorosToAdd,
        minutesWorked: minutesToAdd,
      });
    }
  }
}
