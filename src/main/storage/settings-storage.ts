import { BaseStorage } from './base-storage';
import { Settings, defaultSettings } from '../../shared/types';

interface SettingsStorageData {
  settings: Settings;
}

export class SettingsStorage extends BaseStorage<SettingsStorageData> {
  constructor(dataDir: string) {
    super({
      dataDir,
      fileName: 'settings.json',
      defaultValue: { settings: { ...defaultSettings } },
    });
  }

  protected mergeWithDefault(parsed: Partial<SettingsStorageData>): SettingsStorageData {
    return {
      settings: { ...defaultSettings, ...parsed.settings },
    };
  }

  protected getDefaultValue(): SettingsStorageData {
    return { settings: { ...defaultSettings } };
  }

  getAll(): SettingsStorageData {
    return { ...this.data };
  }

  getItems(): Settings[] {
    return [this.data.settings];
  }

  getSettings(): Settings {
    return { ...this.data.settings };
  }

  setSettings(settings: Settings): void {
    this.data.settings = { ...settings };
    this.markDirty();
    this.save();
  }

  updateSettings(partial: Partial<Settings>): void {
    this.data.settings = { ...this.data.settings, ...partial };
    this.markDirty();
    this.save();
  }
}
