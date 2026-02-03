import { Layout, StatsChart } from '../components';
import { Clock, Target, CheckCircle, Flame, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../stores';
import { exportToCSV as exportDataToCSV } from '../utils/export';

export default function StatsPage() {
  const [chartType, setChartType] = useState<'daily' | 'projects' | 'trend'>('daily');
  const [timeRange, setTimeRange] = useState(7);
  const [loading, setLoading] = useState(true);
  const { projects, tasks, logs } = useAppStore();

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      await useAppStore.getState().loadAllData();
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </Layout>
    );
  }

  const stats = useAppStore.getState().getStats();

  const handleExportToCSV = () => {
    exportDataToCSV(logs, 'pomodoro_stats.csv');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            统计数据
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              导出CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">完成番茄钟</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPomodoros}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">专注时长</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalWorkMinutes}分钟
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">完成任务</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">连续天数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.streakDays} 天
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('daily')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              chartType === 'daily'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            每日统计
          </button>
          <button
            onClick={() => setChartType('projects')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              chartType === 'projects'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            项目分布
          </button>
          <button
            onClick={() => setChartType('trend')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              chartType === 'trend'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            趋势分析
          </button>
        </div>

        {/* Chart */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {chartType === 'daily' && '每日番茄钟统计'}
            {chartType === 'projects' && '项目分布统计'}
            {chartType === 'trend' && '12周趋势分析'}
          </h2>
          <StatsChart type={chartType} days={timeRange} />
        </div>
      </div>
    </Layout>
  );
}
