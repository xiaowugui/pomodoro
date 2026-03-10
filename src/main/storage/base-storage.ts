import * as fs from 'fs';
import * as path from 'path';

export interface StorageOptions {
  dataDir: string;
  fileName: string;
  defaultValue: unknown;
}

export interface StorageChangeEvent {
  type: 'create' | 'update' | 'delete';
  entity: string;
  id?: string;
  timestamp: string;
}

/**
 * BaseStorage - Abstract base class for all storage modules
 * Provides common file I/O, backup, and event handling functionality
 */
export abstract class BaseStorage<T> {
  protected data: T;
  protected dataPath: string;
  protected dataDir: string;
  protected isDirty: boolean = false;
  private saveTimeoutId: NodeJS.Timeout | null = null;
  protected readonly SAVE_DEBOUNCE_MS = 300;

  constructor(options: StorageOptions) {
    this.dataDir = options.dataDir;
    this.dataPath = path.join(options.dataDir, options.fileName);
    this.data = options.defaultValue as T;
  }

  /**
   * Initialize storage - load data from file
   */
  async initialize(): Promise<void> {
    await fs.promises.mkdir(this.dataDir, { recursive: true });
    await this.load();
  }

  /**
   * Load data from file
   */
  protected async load(): Promise<void> {
    try {
      const rawData = await fs.promises.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(rawData) as Partial<T>;
      this.data = this.mergeWithDefault(parsed);
    } catch (error) {
      // File doesn't exist or is corrupted - use default
      this.data = this.getDefaultValue();
      await this.save();
    }
  }

  /**
   * Save data to file (with debouncing)
   */
  protected async save(): Promise<void> {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
    }

    this.saveTimeoutId = setTimeout(async () => {
      try {
        await fs.promises.mkdir(path.dirname(this.dataPath), { recursive: true });
        await fs.promises.writeFile(
          this.dataPath,
          JSON.stringify(this.data, null, 2),
          'utf-8'
        );
        this.isDirty = false;
      } catch (error) {
        console.error(`[BaseStorage] Failed to save ${this.dataPath}:`, error);
        throw error;
      }
    }, this.SAVE_DEBOUNCE_MS);
  }

  /**
   * Force immediate save (for critical operations)
   */
  protected async saveImmediate(): Promise<void> {
    if (this.saveTimeoutId) {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = null;
    }

    try {
      await fs.promises.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.promises.writeFile(
        this.dataPath,
        JSON.stringify(this.data, null, 2),
        'utf-8'
      );
      this.isDirty = false;
    } catch (error) {
      console.error(`[BaseStorage] Failed to save ${this.dataPath}:`, error);
      throw error;
    }
  }

  /**
   * Get current data (deep clone to prevent mutation)
   */
  getAll(): T {
    return JSON.parse(JSON.stringify(this.data));
  }

  /**
   * Get items - to be overridden by subclasses that store arrays
   */
  getItems(): unknown[] {
    return [];
  }

  /**
   * Mark data as dirty (needs saving)
   */
  protected markDirty(): void {
    this.isDirty = true;
  }

  /**
   * Check if data has unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  /**
   * Abstract method to merge parsed data with defaults
   */
  protected abstract mergeWithDefault(parsed: Partial<T>): T;

  /**
   * Abstract method to get default value
   */
  protected abstract getDefaultValue(): T;

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get storage file path
   */
  getPath(): string {
    return this.dataPath;
  }

  /**
   * Export raw data (for backup purposes)
   */
  exportData(): T {
    return this.getAll();
  }

  /**
   * Import data (for backup restore)
   */
  async importData(data: T): Promise<void> {
    this.data = data;
    await this.saveImmediate();
  }
}
