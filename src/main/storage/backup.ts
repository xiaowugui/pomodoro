import * as fs from 'fs';
import * as path from 'path';

export interface BackupOptions {
  dataDir: string;
  maxBackups?: number;
  backupPrefix?: string;
}

export interface BackupInfo {
  path: string;
  timestamp: Date;
  size: number;
}

/**
 * BackupManager - Handles automatic backups before data writes
 */
export class BackupManager {
  private dataDir: string;
  private maxBackups: number;
  private backupPrefix: string;
  private backupDir: string;

  constructor(options: BackupOptions) {
    this.dataDir = options.dataDir;
    this.maxBackups = options.maxBackups ?? 10;
    this.backupPrefix = options.backupPrefix ?? 'data.json.backup';
    this.backupDir = options.dataDir;
  }

  /**
   * Create a timestamped backup of a data file
   */
  async backup(fileName: string = 'data.json'): Promise<string | null> {
    const sourcePath = path.join(this.dataDir, fileName);
    
    // Check if source file exists
    try {
      await fs.promises.access(sourcePath);
    } catch {
      console.log(`[BackupManager] Source file not found: ${sourcePath}`);
      return null;
    }

    // Generate timestamp
    const timestamp = this.getTimestamp();
    const backupFileName = `${this.backupPrefix}.${timestamp}`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      // Copy source to backup
      await fs.promises.copyFile(sourcePath, backupPath);
      console.log(`[BackupManager] Created backup: ${backupPath}`);

      // Clean old backups
      await this.cleanOldBackups(fileName);

      return backupPath;
    } catch (error) {
      console.error(`[BackupManager] Failed to create backup:`, error);
      return null;
    }
  }

  /**
   * Create backup with custom name
   */
  async backupAs(fileName: string, backupName: string): Promise<string | null> {
    const sourcePath = path.join(this.dataDir, fileName);
    const backupPath = path.join(this.backupDir, backupName);

    try {
      await fs.promises.copyFile(sourcePath, backupPath);
      console.log(`[BackupManager] Created backup: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`[BackupManager] Failed to create backup:`, error);
      return null;
    }
  }

  /**
   * Restore from a backup file
   */
  async restore(backupFileName: string, targetFileName: string = 'data.json'): Promise<boolean> {
    const backupPath = path.join(this.backupDir, backupFileName);
    const targetPath = path.join(this.dataDir, targetFileName);

    try {
      // Verify backup exists
      await fs.promises.access(backupPath);

      // Restore
      await fs.promises.copyFile(backupPath, targetPath);
      console.log(`[BackupManager] Restored from: ${backupPath}`);
      return true;
    } catch (error) {
      console.error(`[BackupManager] Failed to restore:`, error);
      return false;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      const backups = files
        .filter(f => f.startsWith(this.backupPrefix))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            path: filePath,
            timestamp: this.parseTimestamp(f),
            size: stats.size,
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return backups;
    } catch (error) {
      console.error(`[BackupManager] Failed to list backups:`, error);
      return [];
    }
  }

  /**
   * Get the most recent backup
   */
  async getLatestBackup(): Promise<BackupInfo | null> {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Delete old backups, keeping only the most recent ones
   */
  private async cleanOldBackups(baseFileName: string): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups);
      for (const backup of toDelete) {
        try {
          await fs.promises.unlink(backup.path);
          console.log(`[BackupManager] Deleted old backup: ${backup.path}`);
        } catch (error) {
          console.error(`[BackupManager] Failed to delete backup: ${backup.path}`, error);
        }
      }
    }
  }

  /**
   * Generate timestamp string
   */
  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  /**
   * Parse timestamp from backup filename
   */
  private parseTimestamp(filename: string): Date {
    const match = filename.match(/(\d{8}-\d{6})/);
    if (match) {
      const [year, month, day, hour, minute, second] = match[1].match(/\d{2}/g)!.map(Number);
      return new Date(2000 + year, month - 1, day, hour, minute, second);
    }
    return new Date(0);
  }

  /**
   * Get backup directory path
   */
  getBackupDir(): string {
    return this.backupDir;
  }
}
