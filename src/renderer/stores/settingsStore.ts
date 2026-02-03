import { create } from 'zustand';
import { Settings, defaultSettings } from '@shared/types.ts';

declare global {
  interface Window {
    electronAPI: {
      getSettings: () => Promise<Settings>;
      setSettings: (settings: any) => Promise<Settings>;
      onSettingsChanged: (callback: (settings: Settings) => void) => void;
    };
  }
}

interface SettingsStoreState extends Settings {
  // Loading state
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  updateShortcut: (key: keyof Settings['shortcuts'], value: string) => Promise<void>;
  
  // Initialize IPC listeners
  initializeListeners: () => () => void;
  
  // Has loaded flag
  hasLoaded: boolean;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  // Default settings
  ...defaultSettings,
  
  // State
  isLoading: false,
  hasLoaded: false,
  error: null,

  // Load settings from main process
  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await window.electronAPI.getSettings();
      set({ ...settings, isLoading: false, hasLoaded: true });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Update settings
  updateSettings: async (partialSettings) => {
    set({ isLoading: true, error: null });
    try {
      const currentSettings = { ...get() };
      // Remove internal state fields
      const { isLoading, hasLoaded, error, loadSettings, updateSettings, resetSettings, updateShortcut, initializeListeners, ...pureSettings } = currentSettings;
      
      const newSettings: Settings = {
        ...pureSettings,
        ...partialSettings,
      };
      
      const savedSettings = await window.electronAPI.setSettings(newSettings);
      set({ ...savedSettings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Reset to defaults
  resetSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const savedSettings = await window.electronAPI.setSettings(defaultSettings);
      set({ ...savedSettings, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Update a single shortcut
  updateShortcut: async (key, value) => {
    const currentSettings = { ...get() };
    const { isLoading, hasLoaded, error, loadSettings, updateSettings, resetSettings, updateShortcut, initializeListeners, ...pureSettings } = currentSettings;
    
    const newSettings: Settings = {
      ...pureSettings,
      shortcuts: {
        ...pureSettings.shortcuts,
        [key]: value,
      },
    };
    
    await get().updateSettings(newSettings);
  },

  // IPC listeners for settings changes from main process
  initializeListeners: () => {
    const handleSettingsChanged = (settings: Settings) => {
      set({ ...settings });
    };

    window.electronAPI.onSettingsChanged(handleSettingsChanged);

    // Cleanup function
    return () => {
      // Listener cleanup is handled by the preload API
    };
  },
}));
