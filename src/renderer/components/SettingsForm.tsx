import { useState } from 'react';
import { Volume2, Bell, Monitor, Moon, Sun, Laptop, Keyboard, RotateCcw, Power } from 'lucide-react';
import { useSettingsStore } from '../stores';
import { Settings } from '@shared/types';

interface SettingsFormProps {
  onSave?: () => void;
}

export default function SettingsForm({ onSave }: SettingsFormProps) {
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
    if (confirm('确定要恢复默认设置吗？')) {
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
          计时器设置
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              专注时长 (分钟)
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
              短休息时长 (分钟)
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
              长休息时长 (分钟)
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
              长休息间隔 (个)
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
          行为设置
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.autoStartPomodoros}
              onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">自动开始下一个番茄钟</span>
          </label>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            休息弹窗会自动显示倒计时
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Power className="w-5 h-5" />
          系统设置
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.autoStartEnabled}
              onChange={(e) => handleChange('autoStartEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">开机自动启动</span>
          </label>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            登录Windows时自动启动番茄钟应用
          </p>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          通知设置
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.soundEnabled}
              onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">启用声音提醒</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={currentSettings.notificationEnabled}
              onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
              className="w-4 h-4 text-red-500 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-gray-700 dark:text-gray-300">启用桌面通知</span>
          </label>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          外观设置
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
            浅色
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
            深色
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
            跟随系统
          </button>
        </div>
      </section>
      
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          快捷键
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              开始/暂停
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
              跳过阶段
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
          恢复默认
        </button>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              有未保存的更改
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}
