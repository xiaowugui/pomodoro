import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Settings, Project, Task, PomodoroLog, AppState, defaultSettings, TaskDayExecution } from '../shared/types';

const DATA_FILE_NAME = 'data.json';

export class StorageManager {
  private dataPath: string;
  private data: AppState;

  constructor() {
    this.dataPath = path.join(app.getPath('userData'), DATA_FILE_NAME);
    this.data = {
      settings: { ...defaultSettings },
      projects: [],
      tasks: [],
      logs: [],
      dayExecutions: [],
    };
  }

  async initialize(): Promise<void> {
    try {
      await this.load();
    } catch (error) {
      await this.save();
    }
  }

  private async load(): Promise<void> {
    const data = await fs.promises.readFile(this.dataPath, 'utf-8');
    const parsed = JSON.parse(data) as Partial<AppState>;
    
    this.data = {
      settings: { ...defaultSettings, ...parsed.settings },
      projects: parsed.projects || [],
      tasks: parsed.tasks || [],
      logs: parsed.logs || [],
      dayExecutions: parsed.dayExecutions || [],
    };
  }

  private async save(): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.promises.writeFile(
        this.dataPath,
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  getSettings(): Settings {
    return { ...this.data.settings };
  }

  setSettings(settings: Settings): void {
    this.data.settings = { ...settings };
    this.save().catch(console.error);
  }

  getProjects(): Project[] {
    return [...this.data.projects];
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    this.data.projects.push(newProject);
    this.save().catch(console.error);
    return newProject;
  }

  updateProject(project: Project): Project {
    const index = this.data.projects.findIndex(p => p.id === project.id);
    if (index === -1) {
      throw new Error(`Project not found: ${project.id}`);
    }
    this.data.projects[index] = { ...project };
    this.save().catch(console.error);
    return this.data.projects[index];
  }

  deleteProject(projectId: string): boolean {
    const index = this.data.projects.findIndex(p => p.id === projectId);
    if (index === -1) {
      return false;
    }
    
    const tasksToDelete = this.data.tasks.filter(t => t.projectId === projectId);
    const taskIdsToDelete = tasksToDelete.map(t => t.id);
    
    this.data.projects.splice(index, 1);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== projectId);
    this.data.logs = this.data.logs.filter(l => !taskIdsToDelete.includes(l.taskId));
    this.data.dayExecutions = this.data.dayExecutions.filter(de => !taskIdsToDelete.includes(de.taskId));
    
    this.save().catch(console.error);
    return true;
  }

  getTasks(): Task[] {
    return [...this.data.tasks];
  }

  getTasksByProject(projectId: string): Task[] {
    return this.data.tasks.filter(t => t.projectId === projectId);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      workDates: task.workDates || [],
    };
    this.data.tasks.push(newTask);
    this.save().catch(console.error);
    return newTask;
  }

  updateTask(task: Task): Task {
    const index = this.data.tasks.findIndex(t => t.id === task.id);
    if (index === -1) {
      throw new Error(`Task not found: ${task.id}`);
    }
    this.data.tasks[index] = { ...task };
    this.save().catch(console.error);
    return this.data.tasks[index];
  }

  deleteTask(taskId: string): boolean {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      return false;
    }
    
    this.data.tasks.splice(index, 1);
    this.data.logs = this.data.logs.filter(l => l.taskId !== taskId);
    this.data.dayExecutions = this.data.dayExecutions.filter(de => de.taskId !== taskId);
    
    this.save().catch(console.error);
    return true;
  }

  getLogs(): PomodoroLog[] {
    return [...this.data.logs];
  }

  getLogsByTask(taskId: string): PomodoroLog[] {
    return this.data.logs.filter(l => l.taskId === taskId);
  }

  getLogsByDateRange(startDate: string, endDate: string): PomodoroLog[] {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return this.data.logs.filter(l => {
      const logDate = new Date(l.startTime);
      return logDate >= start && logDate <= end;
    });
  }

  createLog(log: Omit<PomodoroLog, 'id'>): PomodoroLog {
    const newLog: PomodoroLog = {
      ...log,
      id: this.generateId(),
    };
    this.data.logs.push(newLog);
    this.save().catch(console.error);
    return newLog;
  }

  updateLog(log: PomodoroLog): PomodoroLog {
    const index = this.data.logs.findIndex(l => l.id === log.id);
    if (index === -1) {
      throw new Error(`Log not found: ${log.id}`);
    }
    this.data.logs[index] = { ...log };
    this.save().catch(console.error);
    return this.data.logs[index];
  }

  deleteLog(logId: string): boolean {
    const index = this.data.logs.findIndex(l => l.id === logId);
    if (index === -1) {
      return false;
    }
    this.data.logs.splice(index, 1);
    this.save().catch(console.error);
    return true;
  }

  // ===== TaskDayExecution CRUD =====
  getDayExecutions(): TaskDayExecution[] {
    return [...this.data.dayExecutions];
  }

  getDayExecutionByDate(date: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(de => de.date === date);
  }

  getDayExecutionByTask(taskId: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(de => de.taskId === taskId);
  }

  getDayExecutionByTaskAndDate(taskId: string, date: string): TaskDayExecution | undefined {
    return this.data.dayExecutions.find(de => de.taskId === taskId && de.date === date);
  }

  createDayExecution(execution: Omit<TaskDayExecution, 'id' | 'createdAt'>): TaskDayExecution {
    const newExecution: TaskDayExecution = {
      ...execution,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    this.data.dayExecutions.push(newExecution);
    this.save().catch(console.error);
    return newExecution;
  }

  updateDayExecution(execution: TaskDayExecution): TaskDayExecution {
    const index = this.data.dayExecutions.findIndex(de => de.id === execution.id);
    if (index === -1) {
      throw new Error(`DayExecution not found: ${execution.id}`);
    }
    this.data.dayExecutions[index] = { ...execution };
    this.save().catch(console.error);
    return this.data.dayExecutions[index];
  }

  deleteDayExecution(executionId: string): boolean {
    const index = this.data.dayExecutions.findIndex(de => de.id === executionId);
    if (index === -1) {
      return false;
    }
    this.data.dayExecutions.splice(index, 1);
    this.save().catch(console.error);
    return true;
  }

  getDayExecutionsByDateRange(startDate: string, endDate: string): TaskDayExecution[] {
    return this.data.dayExecutions.filter(de => de.date >= startDate && de.date <= endDate);
  }

  getStats(): {
    totalPomodoros: number;
    totalWorkMinutes: number;
    completedTasks: number;
    streakDays: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validTaskIds = new Set(this.data.tasks.map(t => t.id));
    
    const completedLogs = this.data.logs.filter(l => 
      l.completed && 
      l.type === 'work' && 
      validTaskIds.has(l.taskId)
    );
    
    const totalWorkMinutes = completedLogs.reduce((sum, l) => sum + l.duration, 0) / 60;
    
    const uniqueDates = new Set(
      completedLogs.map(l => new Date(l.startTime).toDateString())
    );
    
    let streakDays = 0;
    const sortedDates = Array.from(uniqueDates)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      if (sortedDates[i].toDateString() === checkDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalPomodoros: completedLogs.length,
      totalWorkMinutes: Math.round(totalWorkMinutes),
      completedTasks: this.data.tasks.filter(t => t.status === 'completed').length,
      streakDays,
    };
  }

  exportData(): AppState {
    return { ...this.data };
  }

  async importData(data: AppState): Promise<void> {
    this.data = {
      settings: { ...defaultSettings, ...data.settings },
      projects: data.projects || [],
      tasks: data.tasks || [],
      logs: data.logs || [],
      dayExecutions: data.dayExecutions || [],
    };
    await this.save();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
