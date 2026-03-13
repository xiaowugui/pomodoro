import { BaseStorage } from './base-storage';
import { Task, TaskType } from '../../shared/types';

interface TasksStorageData {
  tasks: Task[];
}

export class TasksStorage extends BaseStorage<TasksStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'tasks.json',
      defaultValue: { tasks: [] },
    });
  }

  protected mergeWithDefault(parsed: Partial<TasksStorageData>): TasksStorageData {
    const tasks = (parsed.tasks || []).map((t: Task) => ({
      ...t,
      workDates: t.workDates || [],
      plannedDates: t.plannedDates || [],
      estimatedPomodoros: t.estimatedPomodoros || 1,
      completedPomodoros: t.completedPomodoros || 0,
      status: t.status || 'active',
      isImportant: t.isImportant ?? false,
      isUrgent: t.isUrgent ?? false,
      taskType: t.taskType || 'normal',
    }));
    return { tasks };
  }

  protected getDefaultValue(): TasksStorageData {
    return { tasks: [] };
  }

  getAll(): TasksStorageData {
    return { tasks: [...this.data.tasks] };
  }

  getItems(): Task[] {
    return [...this.data.tasks];
  }

  getById(id: string): Task | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  getByProject(projectId: string): Task[] {
    return this.data.tasks.filter(t => t.projectId === projectId);
  }

  getActive(): Task[] {
    return this.data.tasks.filter(t => t.status === 'active');
  }

  getCompleted(): Task[] {
    return this.data.tasks.filter(t => t.status === 'completed');
  }

  getByDate(date: string): Task[] {
    return this.data.tasks.filter(t => 
      t.plannedDates?.includes(date) || t.workDates?.includes(date)
    );
  }

  getImportantUrgent(): Task[] {
    return this.data.tasks.filter(t => t.isImportant && t.isUrgent && t.status === 'active');
  }

  getByType(taskType: Task['taskType']): Task[] {
    return this.data.tasks.filter(t => t.taskType === taskType);
  }

  getAiTasks(): Task[] {
    return this.getByType('ai');
  }

  getRegularTasks(): Task[] {
    return this.data.tasks.filter(t => t.taskType === 'normal');
  }

  create(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      workDates: task.workDates || [],
      plannedDates: task.plannedDates || [],
      estimatedPomodoros: task.estimatedPomodoros || 1,
      completedPomodoros: task.completedPomodoros || 0,
      status: task.status || 'active',
      isImportant: task.isImportant ?? false,
      isUrgent: task.isUrgent ?? false,
      taskType: task.taskType || 'normal',
    };
    this.data.tasks.push(newTask);
    this.markDirty();
    this.save();
    return newTask;
  }

  update(task: Task): Task {
    const index = this.data.tasks.findIndex(t => t.id === task.id);
    if (index === -1) {
      throw new Error(`Task not found: ${task.id}`);
    }
    this.data.tasks[index] = { ...task };
    this.markDirty();
    this.save();
    return this.data.tasks[index];
  }

  delete(id: string): boolean {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) {
      return false;
    }
    this.data.tasks.splice(index, 1);
    this.markDirty();
    this.save();
    return true;
  }

  deleteByProject(projectId: string): string[] {
    const toDelete = this.data.tasks.filter(t => t.projectId === projectId);
    const ids = toDelete.map(t => t.id);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== projectId);
    this.markDirty();
    this.save();
    return ids;
  }

  incrementPomodoro(taskId: string): Task | null {
    const task = this.getById(taskId);
    if (!task) return null;
    
    task.completedPomodoros = (task.completedPomodoros || 0) + 1;
    return this.update(task);
  }

  addWorkDate(taskId: string, date: string): Task | null {
    const task = this.getById(taskId);
    if (!task) return null;
    
    if (!task.workDates) {
      task.workDates = [];
    }
    if (!task.workDates.includes(date)) {
      task.workDates.push(date);
    }
    return this.update(task);
  }
}
