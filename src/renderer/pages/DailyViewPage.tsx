import { useState, useEffect } from 'react';
import { Layout } from '../components';
import { useAppStore } from '../stores';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, Target, Plus, X } from 'lucide-react';

function Calendar({ selectedDate, onSelectDate, datesWithTasks }: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  datesWithTasks: string[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const today = new Date().toISOString().split('T')[0];
  
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };
  
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">{year}年 {monthNames[month]}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2" />;
          }
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const hasTasks = datesWithTasks.includes(dateStr);
          
          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`
                p-2 rounded-lg text-sm relative
                ${isSelected ? 'bg-red-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${isToday && !isSelected ? 'ring-2 ring-red-500' : ''}
              `}
            >
              {day}
              {hasTasks && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DaySummary({ date }: { date: string }) {
  const { getDailySummary, getTasksByDate, tasks, completeTask } = useAppStore();
  
  const summary = getDailySummary(date);
  const dateTasks = getTasksByDate(date);
  const activeTasks = dateTasks.filter(t => t.status === 'active');
  const completedTasks = dateTasks.filter(t => t.status === 'completed');
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  
  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-xl font-bold mb-4">{formatDate(date)}</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Clock className="w-8 h-8 text-blue-500" />
          <div>
            <div className="text-2xl font-bold">{summary.totalPomodoros}</div>
            <div className="text-sm text-gray-500">番茄钟</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CalendarIcon className="w-8 h-8 text-green-500" />
          <div>
            <div className="text-2xl font-bold">{summary.totalMinutes}</div>
            <div className="text-sm text-gray-500">分钟</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CheckCircle className="w-8 h-8 text-purple-500" />
          <div>
            <div className="text-2xl font-bold">{completedTasks.length}/{dateTasks.length}</div>
            <div className="text-sm text-gray-500">完成任务</div>
          </div>
        </div>
      </div>
      
      {activeTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-gray-500">今日待办 ({activeTasks.length})</h3>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded cursor-pointer"
                  onChange={() => handleCompleteTask(task.id)}
                />
                <span>{task.title}</span>
                <span className="text-sm text-gray-500">
                  {task.completedPomodoros || 0}/{task.estimatedPomodoros}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {completedTasks.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3 text-gray-500">已完成 ({completedTasks.length})</h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="line-through text-gray-500">{task.title}</span>
                <span className="text-sm text-green-500">
                  {task.completedPomodoros}/{task.estimatedPomodoros}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {dateTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无任务</p>
        </div>
      )}
    </div>
  );
}

function TaskPlanner() {
  const today = new Date().toISOString().split('T')[0];
  const { tasks, projects, getTodayPlannedTasks, addTaskToToday, removeTaskFromToday } = useAppStore();
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const todayPlannedTasks = getTodayPlannedTasks();
  const allActiveTasks = tasks.filter(t => t.status === 'active');
  const unplannedTasks = allActiveTasks.filter(t => !t.plannedDates?.includes(today));
  
  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#9CA3AF';
  };
  
  const handleAddTask = async (taskId: string) => {
    await addTaskToToday(taskId);
  };
  
  const handleRemoveTask = async (taskId: string) => {
    await removeTaskFromToday(taskId);
  };
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Target className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold">今日计划</h2>
        <span className="text-sm text-gray-500">({todayPlannedTasks.length})</span>
      </div>
      
      {/* Planned tasks */}
      {todayPlannedTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-500">已计划</h3>
          <div className="space-y-2">
            {todayPlannedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getProjectColor(task.projectId) }}
                />
                <span className="flex-1 truncate text-gray-900 dark:text-white">{task.title}</span>
                <span className="text-sm text-gray-500">
                  {task.completedPomodoros || 0}/{task.estimatedPomodoros}
                </span>
                <button
                  onClick={() => handleRemoveTask(task.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                  title="从今日计划中移除"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available tasks to add */}
      <div>
        <button
          onClick={() => setShowAllTasks(!showAllTasks)}
          className="flex items-center gap-2 font-semibold mb-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Plus className={`w-4 h-4 transition-transform ${showAllTasks ? 'rotate-45' : ''}`} />
          <span>添加任务到计划 ({unplannedTasks.length})</span>
        </button>
        
        {showAllTasks && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {unplannedTasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">所有任务已添加到今日计划</p>
            ) : (
              unplannedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getProjectColor(task.projectId) }}
                  />
                  <span className="flex-1 truncate text-gray-900 dark:text-white">{task.title}</span>
                  <span className="text-sm text-gray-500">
                    {task.completedPomodoros || 0}/{task.estimatedPomodoros}
                  </span>
                  <button
                    onClick={() => handleAddTask(task.id)}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-900/40 rounded"
                    title="添加到今日计划"
                  >
                    <Plus className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyViewPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const { tasks, dayExecutions, loadDayExecutions } = useAppStore();
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await loadDayExecutions();
      setIsLoading(false);
    };
    loadData();
  }, [loadDayExecutions]);
  
  const datesWithTasks = [...new Set(dayExecutions.map(de => de.date))];
  
  // Also include dates from tasks that have workDates
  tasks.forEach(task => {
    if (task.workDates) {
      task.workDates.forEach(date => {
        if (!datesWithTasks.includes(date)) {
          datesWithTasks.push(date);
        }
      });
    }
  });

  // Check if selected date is today
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;
  
  return (
    <Layout>
      <div className="flex h-[calc(100vh-3rem)]">
        <aside className="w-80 pr-6">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            datesWithTasks={datesWithTasks}
          />
        </aside>
        
        <main className="flex-1 overflow-y-auto pr-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              {/* Show task planner only for today */}
              {isToday && <TaskPlanner />}
              <DaySummary date={selectedDate} />
            </>
          )}
        </main>
      </div>
    </Layout>
  );
}
