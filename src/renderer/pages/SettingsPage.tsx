import { useEffect } from 'react';
import { Layout, SettingsForm } from '../components';
import { useSettingsStore } from '../stores';

export default function SettingsPage() {
  const { loadSettings, initializeListeners } = useSettingsStore();

  useEffect(() => {
    loadSettings();
    
    // Setup settings change listeners
    const cleanup = initializeListeners();
    return cleanup;
  }, [loadSettings, initializeListeners]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          设置
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <SettingsForm />
        </div>
      </div>
    </Layout>
  );
}
