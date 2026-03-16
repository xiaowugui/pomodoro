import { app } from 'electron';
import * as path from 'path';
import {
  Settings,
  Project,
  Task,
  PomodoroLog,
  TaskDayExecution,
  TaskNote,
  TaskLink,
  AppState,
  defaultSettings,
} from '../shared/types';

import {
  BackupManager,
  MigrationManager,
  createDefaultMigrations,
  SettingsStorage,
  ProjectsStorage,
  TasksStorage,
  LogsStorage,
  ExecutionsStorage,
  NotesStorage,
} from './storage/index';

/**
 * StorageManager - Coordinates all modular storage components
 * Provides backward-compatible API for the rest of the application
 */
export class StorageManager {
  private dataDir: string;
  private backupManager: BackupManager;
  private migrationManager: MigrationManager;
  
  // Modular storage components
  private settingsStorage: SettingsStorage;
  private projectsStorage: ProjectsStorage;
  private tasksStorage: TasksStorage;
  private logsStorage: LogsStorage;
  private executionsStorage: ExecutionsStorage;
  private notesStorage: NotesStorage;

  constructor() {
    this.dataDir = app.getPath('userData');
    
    // Initialize backup manager
    this.backupManager = new BackupManager({
      dataDir: this.dataDir,
      maxBackups: 10,
      backupPrefix: 'data.json.backup',
    });

    // Initialize migration manager with default migrations
    this.migrationManager = createDefaultMigrations();

    // Initialize modular storage components
    this.settingsStorage = new SettingsStorage(this.dataDir);
    this.projectsStorage = new ProjectsStorage(this.dataDir);
    this.tasksStorage = new TasksStorage(this.dataDir);
    this.logsStorage = new LogsStorage(this.dataDir);
    this.executionsStorage = new ExecutionsStorage(this.dataDir);
    this.notesStorage = new NotesStorage(this.dataDir);
  }

  async initialize(): Promise<void> {
    // Run migrations on legacy data file if it exists
    await this.migrateLegacyData();
    
    // Initialize all storage modules
    await Promise.all([
      this.settingsStorage.initialize(),
      this.projectsStorage.initialize(),
      this.tasksStorage.initialize(),
      this.logsStorage.initialize(),
      this.executionsStorage.initialize(),
      this.notesStorage.initialize(),
    ]);
  }

  /**
   * Migrate from legacy single-file storage to new modular structure
   */
  private async migrateLegacyData(): Promise<void> {
    const legacyPath = path.join(this.dataDir, 'data.json');
    
    try {
      const fs = await import('fs');
      await fs.promises.access(legacyPath);
      
      // Read legacy data
      const rawData = await fs.promises.readFile(legacyPath, 'utf-8');
      const legacyData = JSON.parse(rawData) as Partial<AppState>;
      
      // Run migrations
      const migratedData = await this.migrationManager.runMigrations(legacyData);
      
      // Import data into new storage modules
      if (migratedData.settings) {
        await this.settingsStorage.importData({ settings: migratedData.settings as Settings });
      }
      
      if (migratedData.projects) {
        await this.projectsStorage.importData({ projects: migratedData.projects as Project[] });
      }
      
      if (migratedData.tasks) {
        await this.tasksStorage.importData({ tasks: migratedData.tasks as Task[] });
      }
      
      if (migratedData.logs) {
        await this.logsStorage.importData({ logs: migratedData.logs as PomodoroLog[] });
      }
      
      if (migratedData.dayExecutions) {
        await this.executionsStorage.importData({ dayExecutions: migratedData.dayExecutions as TaskDayExecution[] });
      }
      
      if (migratedData.taskNotes) {
        await this.notesStorage.importData({ taskNotes: migratedData.taskNotes as TaskNote[] });
      }

      // Backup legacy data and remove it
      await this.backupManager.backupAs('data.json', 'legacy-data.json.backup');
      const fs2 = await import('fs');
      await fs2.promises.unlink(legacyPath);
      
      console.log('[StorageManager] Migration from legacy data completed');
    } catch {
      // No legacy data file - fresh install
      console.log('[StorageManager] No legacy data found, starting fresh');
    }
  }

  // ===== Settings =====
  getSettings(): Settings {
    return this.settingsStorage.getSettings();
  }

  setSettings(settings: Settings): void {
    this.settingsStorage.setSettings(settings);
  }

  // ===== Projects =====
  getProjects(): Project[] {
    return this.projectsStorage.getItems() as Project[];
  }

  createProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    return this.projectsStorage.create(project);
  }

  updateProject(project: Project): Project {
    return this.projectsStorage.update(project);
  }

  deleteProject(projectId: string): boolean {
    // Delete associated tasks first
    const taskIds = this.tasksStorage.deleteByProject(projectId);
    
    // Delete associated logs
    for (const taskId of taskIds) {
      this.logsStorage.deleteByTask(taskId);
      this.executionsStorage.deleteByTask(taskId);
      this.notesStorage.deleteByTask(taskId);
    }
    
    return this.projectsStorage.delete(projectId);
  }

  // ===== Tasks =====
  getTasks(): Task[] {
    return this.tasksStorage.getItems() as Task[];
  }

  getTasksByProject(projectId: string): Task[] {
    return this.tasksStorage.getByProject(projectId);
  }

  createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    return this.tasksStorage.create(task);
  }

  updateTask(task: Task): Task {
    return this.tasksStorage.update(task);
  }

  deleteTask(taskId: string): boolean {
    // Delete associated data
    this.logsStorage.deleteByTask(taskId);
    this.executionsStorage.deleteByTask(taskId);
    this.notesStorage.deleteByTask(taskId);
    
    return this.tasksStorage.delete(taskId);
  }

  // ===== Task Notes =====
  getTaskNotes(): TaskNote[] {
    return this.notesStorage.getItems() as TaskNote[];
  }

  getTaskNoteByTask(taskId: string): TaskNote | undefined {
    return this.notesStorage.getByTask(taskId);
  }

  createTaskNote(taskId: string): TaskNote {
    return this.notesStorage.create(taskId);
  }

  updateTaskNote(note: TaskNote): TaskNote {
    return this.notesStorage.update(note);
  }

  deleteTaskNote(noteId: string): boolean {
    return this.notesStorage.delete(noteId);
  }

  addTaskLink(noteId: string, link: Omit<TaskLink, 'id' | 'createdAt'>): TaskLink {
    return this.notesStorage.addLink(noteId, link);
  }

  updateTaskLink(noteId: string, link: TaskLink): TaskLink {
    return this.notesStorage.updateLink(noteId, link);
  }

  deleteTaskLink(noteId: string, linkId: string): boolean {
    return this.notesStorage.deleteLink(noteId, linkId);
  }

  // ===== Logs =====
  getLogs(): PomodoroLog[] {
    return this.logsStorage.getItems() as PomodoroLog[];
  }

  getLogsByTask(taskId: string): PomodoroLog[] {
    return this.logsStorage.getByTask(taskId);
  }

  getLogsByDateRange(startDate: string, endDate: string): PomodoroLog[] {
    return this.logsStorage.getByDateRange(startDate, endDate);
  }

  createLog(log: Omit<PomodoroLog, 'id'>): PomodoroLog {
    return this.logsStorage.create(log);
  }

  updateLog(log: PomodoroLog): PomodoroLog {
    return this.logsStorage.update(log);
  }

  deleteLog(logId: string): boolean {
    return this.logsStorage.delete(logId);
  }

  // ===== Day Executions =====
  getDayExecutions(): TaskDayExecution[] {
    return this.executionsStorage.getItems() as TaskDayExecution[];
  }

  getDayExecutionByDate(date: string): TaskDayExecution[] {
    return this.executionsStorage.getByDate(date);
  }

  getDayExecutionByTask(taskId: string): TaskDayExecution[] {
    return this.executionsStorage.getByTask(taskId);
  }

  getDayExecutionByTaskAndDate(taskId: string, date: string): TaskDayExecution | undefined {
    return this.executionsStorage.getByTaskAndDate(taskId, date);
  }

  createDayExecution(execution: Omit<TaskDayExecution, 'id' | 'createdAt'>): TaskDayExecution {
    return this.executionsStorage.create(execution);
  }

  updateDayExecution(execution: TaskDayExecution): TaskDayExecution {
    return this.executionsStorage.update(execution);
  }

  deleteDayExecution(executionId: string): boolean {
    return this.executionsStorage.delete(executionId);
  }

  getDayExecutionsByDateRange(startDate: string, endDate: string): TaskDayExecution[] {
    return this.executionsStorage.getByDateRange(startDate, endDate);
  }

  // ===== Statistics =====
  getStats(): {
    totalPomodoros: number;
    totalWorkMinutes: number;
    completedTasks: number;
    streakDays: number;
  } {
    const tasks = this.tasksStorage.getItems() as Task[];
    const logs = this.logsStorage.getWorkLogsCompleted();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validTaskIds = new Set(tasks.map((t: Task) => t.id));
    
    const completedLogs = logs.filter((l: PomodoroLog) => 
      validTaskIds.has(l.taskId)
    );
    
    const totalWorkMinutes = completedLogs.reduce((sum: number, l: PomodoroLog) => sum + l.duration, 0) / 60;
    
    const uniqueDates = new Set(
      completedLogs.map((l: PomodoroLog) => new Date(l.startTime).toDateString())
    );
    
    let streakDays = 0;
    const sortedDates = Array.from(uniqueDates)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      if (sortedDates[i] && sortedDates[i].toDateString() === checkDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalPomodoros: completedLogs.length,
      totalWorkMinutes: Math.round(totalWorkMinutes),
      completedTasks: tasks.filter((t: Task) => t.status === 'completed').length,
      streakDays,
    };
  }

  // ===== Import/Export =====
  exportData(): AppState {
    return {
      settings: this.settingsStorage.getSettings(),
      projects: this.projectsStorage.getItems() as Project[],
      tasks: this.tasksStorage.getItems() as Task[],
      logs: this.logsStorage.getItems() as PomodoroLog[],
      dayExecutions: this.executionsStorage.getItems() as TaskDayExecution[],
      taskNotes: this.notesStorage.getItems() as TaskNote[],
      idleLogs: [],
    };
  }

  async importData(data: AppState): Promise<void> {
    // Create backup before import
    await this.backupManager.backup();
    
    if (data.settings) {
      this.settingsStorage.setSettings({ ...defaultSettings, ...data.settings });
    }
    
    // Import projects
    const currentProjects = this.projectsStorage.getItems() as Project[];
    for (const project of data.projects || []) {
      const existing = currentProjects.find((p: Project) => p.id === project.id);
      if (existing) {
        this.projectsStorage.update(project);
      } else {
        this.projectsStorage.create({
          name: project.name,
          color: project.color,
          status: project.status,
        });
      }
    }
    
    // Import tasks
    const currentTasks = this.tasksStorage.getItems() as Task[];
    for (const task of data.tasks || []) {
      const existing = currentTasks.find(t => t.id === task.id);
      if (existing) {
        this.tasksStorage.update(task);
      } else {
        this.tasksStorage.create({
          title: task.title,
          projectId: task.projectId,
          estimatedPomodoros: task.estimatedPomodoros,
          completedPomodoros: task.completedPomodoros,
          status: task.status,
          workDates: task.workDates,
          plannedDates: task.plannedDates,
          isImportant: task.isImportant,
          isUrgent: task.isUrgent,
          taskType: task.taskType || 'normal',
        });
      }
    }
    
    // Import logs
    const currentLogs = this.logsStorage.getItems() as PomodoroLog[];
    for (const log of data.logs || []) {
      const existing = currentLogs.find((l: PomodoroLog) => l.id === log.id);
      if (!existing) {
        this.logsStorage.create(log);
      }
    }
    
    // Import executions
    for (const execution of data.dayExecutions || []) {
      const existing = this.executionsStorage.getById(execution.id);
      if (!existing) {
        this.executionsStorage.create(execution);
      }
    }
    
    // Import notes
    for (const note of data.taskNotes || []) {
      const existing = this.notesStorage.getById(note.id);
      if (existing) {
        this.notesStorage.update(note);
      }
    }
  }

  // ===== Backup =====
  async createBackup(): Promise<string | null> {
    return this.backupManager.backup();
  }

  async listBackups(): Promise<{ path: string; timestamp: Date; size: number }[]> {
    return this.backupManager.listBackups();
  }

  async restoreFromBackup(backupPath: string): Promise<boolean> {
    const fs = await import('fs');
    try {
      const raw = await fs.promises.readFile(backupPath, 'utf-8');
      const data = JSON.parse(raw) as AppState;
      await this.importData(data);
      return true;
    } catch (error) {
      console.error('[StorageManager] Restore failed:', error);
      return false;
    }
  }

  // ===== Helper for Timer =====
  getProjectIdFromTask(taskId: string): string {
    const task = this.tasksStorage.getById(taskId);
    return task?.projectId || '';
  }

  incrementTaskPomodoro(taskId: string, duration: number): void {
    this.tasksStorage.incrementPomodoro(taskId);
    
    const today = new Date().toISOString().split('T')[0];
    const minutesWorked = Math.round(duration / 60);
    
    this.executionsStorage.upsertByTaskAndDate(taskId, today, 1, minutesWorked);
    this.tasksStorage.addWorkDate(taskId, today);
  }
}
