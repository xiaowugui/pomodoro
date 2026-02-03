import { create } from 'zustand';
import { Settings } from '@shared/types.ts';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStoreState {
  // Current theme mode
  mode: ThemeMode;
  
  // Actual theme being applied (resolved from system preference if mode is 'system')
  resolvedTheme: 'light' | 'dark';
  
  // System preference
  systemPreference: 'light' | 'dark';
  
  // Accent color
  accentColor: string;
  
  // Actions
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccentColor: (color: string) => Promise<void>;
  toggleMode: () => void;
  
  // Helpers
  isDark: () => boolean;
  getThemeClass: () => string;
  
  // Initialize
  initialize: () => Promise<void>;
  initializeListeners: () => () => void;
}

const getSystemPreference = (): 'light' | 'dark' => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const resolveTheme = (mode: ThemeMode, systemPreference: 'light' | 'dark'): 'light' | 'dark' => {
  if (mode === 'system') {
    return systemPreference;
  }
  return mode;
};

const applyThemeToDOM = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  // Initial state
  mode: 'system',
  resolvedTheme: 'light',
  systemPreference: getSystemPreference(),
  accentColor: '#ef4444',

  // Set theme mode
  setMode: async (mode) => {
    const systemPreference = get().systemPreference;
    const resolvedTheme = resolveTheme(mode, systemPreference);
    
    set({ mode, resolvedTheme });
    applyThemeToDOM(resolvedTheme);
    
    // Sync with settings store via IPC
    try {
      const currentSettings: Settings = await window.electronAPI.getSettings();
      await window.electronAPI.setSettings({
        ...currentSettings,
        theme: mode,
      });
    } catch (error) {
      console.error('Failed to sync theme with settings:', error);
    }
  },

  // Set accent color
  setAccentColor: async (color) => {
    set({ accentColor: color });
    
    // Update CSS custom property
    document.documentElement.style.setProperty('--accent-color', color);
    
    // Sync with settings
    try {
      const currentSettings: Settings = await window.electronAPI.getSettings();
      await window.electronAPI.setSettings({
        ...currentSettings,
        accentColor: color,
      });
    } catch (error) {
      console.error('Failed to sync accent color with settings:', error);
    }
  },

  // Toggle between light and dark
  toggleMode: () => {
    const { mode, resolvedTheme } = get();
    if (mode === 'system') {
      // If system, switch to explicit opposite of current resolved theme
      get().setMode(resolvedTheme === 'light' ? 'dark' : 'light');
    } else {
      // If explicit, toggle
      get().setMode(mode === 'light' ? 'dark' : 'light');
    }
  },

  // Check if currently dark
  isDark: () => {
    return get().resolvedTheme === 'dark';
  },

  // Get Tailwind class
  getThemeClass: () => {
    return get().resolvedTheme;
  },

  // Initialize theme from settings
  initialize: async () => {
    const systemPreference = getSystemPreference();
    
    try {
      const settings: Settings = await window.electronAPI.getSettings();
      const mode = settings.theme || 'system';
      const accentColor = settings.accentColor || '#ef4444';
      const resolvedTheme = resolveTheme(mode, systemPreference);
      
      set({
        mode,
        resolvedTheme,
        systemPreference,
        accentColor,
      });
      
      applyThemeToDOM(resolvedTheme);
      document.documentElement.style.setProperty('--accent-color', accentColor);
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      // Fall back to defaults
      const resolvedTheme = resolveTheme('system', systemPreference);
      set({
        mode: 'system',
        resolvedTheme,
        systemPreference,
      });
      applyThemeToDOM(resolvedTheme);
    }
  },

  // Listen for system theme changes and settings changes
  initializeListeners: () => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const systemPreference = e.matches ? 'dark' : 'light';
      const { mode } = get();
      
      set({ systemPreference });
      
      if (mode === 'system') {
        const resolvedTheme = resolveTheme(mode, systemPreference);
        set({ resolvedTheme });
        applyThemeToDOM(resolvedTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemChange);
    
    // Listen for settings changes from main process via preload API
    const handleSettingsChanged = (settings: Settings) => {
      const { mode: currentMode, accentColor: currentAccent } = get();
      
      if (settings.theme && settings.theme !== currentMode) {
        const resolvedTheme = resolveTheme(settings.theme, get().systemPreference);
        set({ mode: settings.theme, resolvedTheme });
        applyThemeToDOM(resolvedTheme);
      }
      
      if (settings.accentColor && settings.accentColor !== currentAccent) {
        set({ accentColor: settings.accentColor });
        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
      }
    };
    
    window.electronAPI.onSettingsChanged(handleSettingsChanged);
    
    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      // Settings listener cleanup handled by preload API
    };
  },
}));
