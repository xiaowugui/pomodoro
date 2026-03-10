import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface Migration {
  version: number;
  name: string;
  migrate: (data: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export interface MigrationState {
  currentVersion: number;
  lastMigration: string;
}

export class MigrationManager {
  private migrations: Migration[] = [];
  private statePath: string;
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || app.getPath('userData');
    this.statePath = path.join(this.dataDir, 'migration-state.json');
  }

  registerMigration(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  async getState(): Promise<MigrationState> {
    try {
      const raw = await fs.promises.readFile(this.statePath, 'utf-8');
      return JSON.parse(raw) as MigrationState;
    } catch {
      return { currentVersion: 0, lastMigration: '' };
    }
  }

  private async saveState(state: MigrationState): Promise<void> {
    await fs.promises.writeFile(
      this.statePath,
      JSON.stringify(state, null, 2),
      'utf-8'
    );
  }

  async runMigrations(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const state = await this.getState();
    let currentData = data;
    let currentVersion = state.currentVersion;

    console.log(`[MigrationManager] Current version: ${currentVersion}, Total migrations: ${this.migrations.length}`);

    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        console.log(`[MigrationManager] Running migration v${migration.version}: ${migration.name}`);
        
        try {
          currentData = await migration.migrate(currentData);
          currentVersion = migration.version;
          
          await this.saveState({
            currentVersion,
            lastMigration: migration.name,
          });
          
          console.log(`[MigrationManager] Migration v${migration.version} completed`);
        } catch (error) {
          console.error(`[MigrationManager] Migration v${migration.version} failed:`, error);
          throw error;
        }
      }
    }

    return currentData;
  }

  async resetState(): Promise<void> {
    await this.saveState({ currentVersion: 0, lastMigration: '' });
  }
}

export function createDefaultMigrations(): MigrationManager {
  const manager = new MigrationManager();

  manager.registerMigration({
    version: 1,
    name: 'add-project-status',
    migrate: async (data) => {
      const projects = (data.projects || []) as Array<Record<string, unknown>>;
      data.projects = projects.map((p: Record<string, unknown>) => ({
        ...p,
        status: p.status || 'active',
      }));
      return data;
    },
  });

  manager.registerMigration({
    version: 2,
    name: 'add-task-work-dates',
    migrate: async (data) => {
      const tasks = (data.tasks || []) as Array<Record<string, unknown>>;
      data.tasks = tasks.map((t: Record<string, unknown>) => ({
        ...t,
        workDates: t.workDates || [],
        plannedDates: t.plannedDates || [],
      }));
      return data;
    },
  });

  manager.registerMigration({
    version: 3,
    name: 'add-default-settings',
    migrate: async (data) => {
      const defaultSettings = {
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        autoStartEnabled: false,
        strictMode: false,
        fullscreenBreak: true,
        allScreensBreak: true,
        breakWindowWidth: 0.85,
        breakWindowHeight: 0.85,
        breakOpacity: 0.95,
        transparentMode: false,
        breakStrictMode: false,
        skipDelayPercent: 30,
        postponeEnabled: true,
        postponeMinutes: 2,
        postponeLimit: 1,
        postponeDelayPercent: 30,
        soundEnabled: true,
        notificationEnabled: true,
        theme: 'system',
        accentColor: '#ef4444',
        shortcuts: {
          toggleTimer: 'CommandOrControl+Shift+P',
          skipPhase: 'CommandOrControl+Shift+S',
          showWindow: 'CommandOrControl+Shift+O',
          endBreak: 'CommandOrControl+X',
          postponeBreak: 'CommandOrControl+P',
        },
      };

      data.settings = { ...defaultSettings, ...(data.settings || {}) };
      return data;
    },
  });

  return manager;
}
