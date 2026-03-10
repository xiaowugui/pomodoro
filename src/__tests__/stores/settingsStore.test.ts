import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSettingsStore } from '../../renderer/stores/settingsStore';
import { createMockSettings, mockElectronAPI, setupElectronMock, clearElectronMocks } from '../test-utils';
import { defaultSettings } from '../../shared/types';

beforeEach(() => {
  setupElectronMock();
  clearElectronMocks();
  
  // Mock electron API implementations
  mockElectronAPI.getSettings.mockResolvedValue(createMockSettings());
  mockElectronAPI.setSettings.mockResolvedValue(createMockSettings());
  mockElectronAPI.onSettingsChanged.mockImplementation(() => {});
  
  // Reset store to initial state
  useSettingsStore.setState({
    ...defaultSettings,
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
});

describe('Settings Store', () => {
  describe('Initial State', () => {
    it('should have default settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.pomodoroDuration).toBe(25);
      expect(state.shortBreakDuration).toBe(5);
      expect(state.longBreakDuration).toBe(15);
      expect(state.longBreakInterval).toBe(4);
    });

    it('should have initial loading state', () => {
      const state = useSettingsStore.getState();
      
      expect(state.isLoading).toBe(false);
      expect(state.hasLoaded).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should have default behavior settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.autoStartBreaks).toBe(false);
      expect(state.autoStartPomodoros).toBe(false);
      expect(state.autoStartEnabled).toBe(false);
      expect(state.strictMode).toBe(false);
    });

    it('should have default break settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.fullscreenBreak).toBe(true);
      expect(state.allScreensBreak).toBe(true);
      expect(state.breakWindowWidth).toBe(0.85);
      expect(state.breakWindowHeight).toBe(0.85);
      expect(state.breakOpacity).toBe(0.95);
      expect(state.transparentMode).toBe(false);
      expect(state.breakStrictMode).toBe(false);
      expect(state.skipDelayPercent).toBe(30);
    });

    it('should have default postpone settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.postponeEnabled).toBe(true);
      expect(state.postponeMinutes).toBe(2);
      expect(state.postponeLimit).toBe(1);
      expect(state.postponeDelayPercent).toBe(30);
    });

    it('should have default notification settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.soundEnabled).toBe(true);
      expect(state.notificationEnabled).toBe(true);
    });

    it('should have default theme settings', () => {
      const state = useSettingsStore.getState();
      
      expect(state.theme).toBe('system');
      expect(state.accentColor).toBe('#ef4444');
    });

    it('should have default shortcuts', () => {
      const state = useSettingsStore.getState();
      
      // Shortcuts are part of the settings object
      expect(state.shortcuts).toBeDefined();
      expect(state.shortcuts.toggleTimer).toBe('CommandOrControl+Shift+P');
      expect(state.shortcuts.skipPhase).toBe('CommandOrControl+Shift+S');
      expect(state.shortcuts.showWindow).toBe('CommandOrControl+Shift+O');
    });
  });

  describe('Load Settings', () => {
    it('should load settings from main process', async () => {
      const customSettings = createMockSettings({
        pomodoroDuration: 30,
        shortBreakDuration: 10,
        longBreakDuration: 20,
      });
      
      mockElectronAPI.getSettings.mockResolvedValue(customSettings);
      
      const { loadSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await loadSettings();
      });
      
      const state = useSettingsStore.getState();
      expect(state.pomodoroDuration).toBe(30);
      expect(state.shortBreakDuration).toBe(10);
      expect(state.longBreakDuration).toBe(20);
      expect(state.hasLoaded).toBe(true);
    });

    it('should set loading state while loading', async () => {
      mockElectronAPI.getSettings.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(createMockSettings()), 100))
      );
      
      const { loadSettings } = useSettingsStore.getState();
      
      const loadingPromise = act(async () => {
        return loadSettings();
      });
      
      // Check loading state is true during load
      expect(useSettingsStore.getState().isLoading).toBe(true);
      
      await loadingPromise;
      
      // Check loading state is false after load
      expect(useSettingsStore.getState().isLoading).toBe(false);
    });

    it('should handle load error', async () => {
      mockElectronAPI.getSettings.mockRejectedValue(new Error('Failed to load'));
      
      const { loadSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await loadSettings();
      });
      
      const state = useSettingsStore.getState();
      expect(state.error).toBeDefined();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Update Settings', () => {
    it('should update pomodoro duration', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ pomodoroDuration: 30 }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ pomodoroDuration: 30 });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update short break duration', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ shortBreakDuration: 10 }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ shortBreakDuration: 10 });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update long break duration', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ longBreakDuration: 20 }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ longBreakDuration: 20 });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update long break interval', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ longBreakInterval: 6 }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ longBreakInterval: 6 });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update auto start setting', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ autoStartPomodoros: true }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ autoStartPomodoros: true });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update theme', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ theme: 'dark' }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ theme: 'dark' });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update sound enabled', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ soundEnabled: false }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ soundEnabled: false });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });

    it('should update notification enabled', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(createMockSettings({ notificationEnabled: false }));
      
      const { updateSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await updateSettings({ notificationEnabled: false });
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });
  });

  describe('Reset Settings', () => {
    it('should reset to default settings', async () => {
      // First update settings
      useSettingsStore.setState({ pomodoroDuration: 50 });
      
      mockElectronAPI.setSettings.mockResolvedValue(defaultSettings);
      
      const { resetSettings } = useSettingsStore.getState();
      
      await act(async () => {
        await resetSettings();
      });
      
      const state = useSettingsStore.getState();
      expect(state.pomodoroDuration).toBe(25);
    });
  });

  describe('Update Shortcut', () => {
    it('should update toggle timer shortcut', async () => {
      mockElectronAPI.setSettings.mockResolvedValue(
        createMockSettings({
          shortcuts: {
            ...defaultSettings.shortcuts,
            toggleTimer: 'CommandOrControl+Shift+T',
          },
        })
      );
      
      const { updateShortcut } = useSettingsStore.getState();
      
      await act(async () => {
        await updateShortcut('toggleTimer', 'CommandOrControl+Shift+T');
      });
      
      expect(mockElectronAPI.setSettings).toHaveBeenCalled();
    });
  });

  describe('IPC Listeners', () => {
    it('should initialize listeners', () => {
      const { initializeListeners } = useSettingsStore.getState();
      
      const cleanup = initializeListeners();
      
      expect(mockElectronAPI.onSettingsChanged).toHaveBeenCalled();
      
      // Cleanup should be a function
      expect(typeof cleanup).toBe('function');
    });
  });
});
