import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useAppStore } from '../stores';

interface StatsChartProps {
  type: 'daily' | 'projects' | 'trend';
  days?: number;
}

// 默认颜色数组，用于项目分布饼图
const DEFAULT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

export default function StatsChart({ type, days = 7 }: StatsChartProps) {
  const { t } = useTranslation();
  const { logs, projects, tasks } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  
  const data = useMemo(() => {
    try {
      setError(null);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Helper function to get local date string
      const getLocalDateStr = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      switch (type) {
        case 'daily': {
          const dailyData = [];
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getLocalDateStr(date);
            
            const dayLogs = logs.filter((log) => {
              const logDateObj = new Date(log.startTime);
              const logDateStr = getLocalDateStr(logDateObj);
              return logDateStr === dateStr && log.completed && log.type === 'work';
            });
            
            dailyData.push({
              date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
              pomodoros: dayLogs.length,
              minutes: Math.round(dayLogs.reduce((sum, log) => sum + log.duration, 0) / 60),
            });
          }
          return dailyData;
        }
        
        case 'projects': {
          // 为项目分配颜色 - 优先使用任务的 completedPomodoros
          const projectStats = projects.map((project, index) => {
            // 获取该项目的所有任务
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            // 从任务的 completedPomodoros 计算（更准确）
            const pomodorosFromTasks = projectTasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
            
            // 从日志计算作为备选
            const projectLogs = logs.filter(
              (log) => log.projectId === project.id && log.completed && log.type === 'work'
            );
            const pomodorosFromLogs = projectLogs.length;
            
            // 使用较大值确保准确性
            const value = Math.max(pomodorosFromTasks, pomodorosFromLogs);
            
            // 使用项目颜色或从默认颜色数组中获取
            const color = project.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
            return {
              name: project.name,
              value: value,
              color: color,
              minutes: Math.round(projectLogs.reduce((sum, log) => sum + log.duration, 0) / 60),
            };
          }).filter((p) => p.value > 0);
          return projectStats;
        }
        
        case 'trend': {
          const trendData = [];
          const weeks = 12;
          
          for (let i = weeks - 1; i >= 0; i--) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() - i * 7);
            weekEnd.setHours(23, 59, 59, 999);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 6);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekLogs = logs.filter((log) => {
              const logDate = new Date(log.startTime);
              return logDate >= weekStart && logDate <= weekEnd && log.completed && log.type === 'work';
            });
            
            trendData.push({
              week: weekStart.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
              pomodoros: weekLogs.length,
              minutes: Math.round(weekLogs.reduce((sum, log) => sum + log.duration, 0) / 60),
            });
          }
          return trendData;
        }
        
        default:
          return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('stats.dataError'));
      return [];
    }
  }, [logs, projects, tasks, type, days]);
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 dark:text-red-400">
        {t('stats.chartError')}: {error}
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        {t('stats.noData')}
      </div>
    );
  }
  
  const renderChart = () => {
    switch (type) {
      case 'daily':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar 
                dataKey="pomodoros" 
                fill="#ef4444" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'projects':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                formatter={(value: number, name: string, props: any) => [
                  t('stats.pomodoroCount', { count: value }) + ` (${props.payload.minutes} ${t('daily.minute')})`,
                  name,
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'trend':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="week" 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="pomodoros" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return (
    <div className="w-full">
      {renderChart()}
    </div>
  );
}
