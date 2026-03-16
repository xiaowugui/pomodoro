import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, Bell, Monitor, Moon, Sun, Laptop, Keyboard, RotateCcw, Power, Globe } from 'lucide-react';
import { useSettingsStore } from '../stores';
import { Settings } from '@shared/types';

interface SettingsFormProps {
  onSave?: () => void;
}

export default function SettingsForm({ onSave }: SettingsFormProps) {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<Partial<Settings>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const currentSettings = { ...settings, ...localSettings };
  
  const handleChange = (key: keyof Settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settings.updateSettings(localSettings);
      setLocalSettings({});
      onSave?.();
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = async () => {
    if (confirm(t('settings.confirmReset'))) {
      await settings.resetSettings();
      setLocalSettings({});
    }
  };
  
  const hasChanges = Object.keys(localSettings).length > 0;
  
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          {t('settings.timerSettings')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.pomodoro')} {t('settings.minutes')}
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={currentSettings.pomodoroDuration}
              onChange={(e) => handleChange('pomodoroDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.shortBreak')} {t('settings.minutes')}
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={currentSettings.shortBreakDuration}
              onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.longBreak')} {t('settings.minutes')}
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={currentSettings.longBreakDuration}
              onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.longBreakInterval')} {t('settings.times')}
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={currentSettings.longBreakInterval}
              onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          {t('settings.behaviorSettings')}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.autoStartPomodoros}
              onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.autoStartPomodoros')}</span>
          </label>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('settings.autoStartPomodorosDesc')}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Power className="w-5 h-5" />
          {t('settings.systemSettings')}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.autoStartEnabled}
              onChange={(e) => handleChange('autoStartEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.autoStartEnabled')}</span>
          </label>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('settings.autoStartEnabledDesc')}
          </p>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('settings.notificationSettings')}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.soundEnabled}
              onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.soundEnabled')}</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.notificationEnabled}
              onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.notificationEnabled')}</span>
          </label>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('settings.language')}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleChange('language', 'zh')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSettings.language === 'zh'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => handleChange('language', 'en')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSettings.language === 'en'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            English
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          {t('settings.idleDetectionSettings')}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.idleDetectionEnabled ?? true}
              onChange={(e) => handleChange('idleDetectionEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">{t('settings.idleDetectionEnabled')}</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.idleThresholdMinutes')} {t('settings.minutes')}
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={currentSettings.idleThresholdMinutes ?? 5}
              onChange={(e) => handleChange('idleThresholdMinutes', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.idleThresholdMinutesDesc')}</p>
          </div>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          {t('settings.appearanceSettings')}
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleChange('theme', 'light')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSettings.theme === 'light'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Sun className="w-4 h-4" />
            {t('settings.themeLight')}
          </button>
          <button
            onClick={() => handleChange('theme', 'dark')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSettings.theme === 'dark'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Moon className="w-4 h-4" />
            {t('settings.themeDark')}
          </button>
          <button
            onClick={() => handleChange('theme', 'system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentSettings.theme === 'system'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Laptop className="w-4 h-4" />
            {t('settings.themeSystem')}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          {t('settings.shortcuts')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.shortcutToggle')}
            </label>
            <input
              type="text"
              value={currentSettings.shortcuts?.toggleTimer}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('settings.shortcutSkip')}
            </label>
            <input
              type="text"
              value={currentSettings.shortcuts?.skipPhase}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </section>
      
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('settings.resetDefaults')}
        </button>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('settings.unsavedChanges')}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? t('settings.saving') : t('settings.saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}
