import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { Settings, Project, Task, PomodoroLog, AppState, defaultSettings } from '../shared/types';

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
    
    // Get all task IDs that belong to this project before deleting them
    const tasksToDelete = this.data.tasks.filter(t => t.projectId === projectId);
    const taskIdsToDelete = tasksToDelete.map(t => t.id);
    
    // Remove the project
    this.data.projects.splice(index, 1);
    
    // Remove tasks belonging to this project
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== projectId);
    
    // CASCADE DELETE: Remove all logs for tasks in this project
    this.data.logs = this.data.logs.filter(l => !taskIdsToDelete.includes(l.taskId));
    
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
    
    // Remove the task
    this.data.tasks.splice(index, 1);
    
    // CASCADE DELETE: Remove all logs associated with this task
    this.data.logs = this.data.logs.filter(l => l.taskId !== taskId);
    
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

  getStats(): {
    totalPomodoros: number;
    totalWorkMinutes: number;
    completedTasks: number;
    streakDays: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get set of valid task IDs to filter out logs for deleted tasks
    const validTaskIds = new Set(this.data.tasks.map(t => t.id));
    
    // Filter logs: only completed work logs for existing tasks
    const completedLogs = this.data.logs.filter(l => 
      l.completed && 
      l.type === 'work' && 
      validTaskIds.has(l.taskId)  // Only count logs for tasks that still exist
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
    };
    await this.save();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
