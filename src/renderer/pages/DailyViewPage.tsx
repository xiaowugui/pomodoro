import { useState, useEffect } from 'react';
import { Layout, TaskForm } from '../components';
import { useAppStore } from '../stores';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, Target, Plus, X } from 'lucide-react';
import { Task } from '@shared/types';

function Calendar({ selectedDate, onSelectDate, datesWithTasks }: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  datesWithTasks: string[];
}) {
  const { t } = useTranslation();
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
  
  const monthNames = [
    t('daily.january'), t('daily.february'), t('daily.march'), t('daily.april'),
    t('daily.may'), t('daily.june'), t('daily.july'), t('daily.august'),
    t('daily.september'), t('daily.october'), t('daily.november'), t('daily.december')
  ];
  const dayNames = t('daily.dayNames', { returnObjects: true }) as string[];
  
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
        <h3 className="font-semibold">{year}{t('daily.year')} {monthNames[month]}</h3>
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
  const { t } = useTranslation();
  const { getDailySummary, getTasksByDate } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  
  const summary = getDailySummary(date);
  const dateTasks = getTasksByDate(date);
  const activeTasks = dateTasks.filter(t => t.status === 'active');
  const completedTasks = dateTasks.filter(t => t.status === 'completed');
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
      <h2 className="text-xl font-bold mb-4">{formatDate(date)}</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Clock className="w-8 h-8 text-blue-500" />
          <div>
            <div className="text-2xl font-bold">{summary.totalPomodoros}</div>
            <div className="text-sm text-gray-500">{t('daily.pomodoro')}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CalendarIcon className="w-8 h-8 text-green-500" />
          <div>
            <div className="text-2xl font-bold">{summary.totalMinutes}</div>
            <div className="text-sm text-gray-500">{t('daily.minute')}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <CheckCircle className="w-8 h-8 text-purple-500" />
          <div>
            <div className="text-2xl font-bold">{completedTasks.length}/{dateTasks.length}</div>
            <div className="text-sm text-gray-500">{t('daily.completed')}</div>
          </div>
        </div>
      </div>
      
      {/* Only show active tasks for non-today dates (today tasks shown in TaskPlanner above) */}
      {!isToday && activeTasks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-gray-500">{t('daily.todoTasks')} ({activeTasks.length})</h3>
          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <input type="checkbox" className="w-5 h-5 rounded" />
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
          <h3 className="font-semibold mb-3 text-gray-500">{t('daily.completedTasks')} ({completedTasks.length})</h3>
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
          <p>{t('daily.noTasks')}</p>
        </div>
      )}
    </div>
  );
}

function TaskPlanner() {
  const { t } = useTranslation();
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

  // 打开任务备注窗口
  const handleOpenTaskNotes = async (taskId: string) => {
    if (window.electronAPI?.openTaskNoteWindow) {
      await window.electronAPI.openTaskNoteWindow(taskId);
    }
  };

  // Calculate totals - count all active tasks for today that have completed all pomodoros
  const allTodayTasks = [...todayPlannedTasks, ...unplannedTasks];
  const totalTasks = allTodayTasks.length;
  const completedCount = allTodayTasks.filter(
    t => (t.completedPomodoros || 0) >= t.estimatedPomodoros
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      {/* Planned tasks */}
      {todayPlannedTasks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-500">{t('daily.planned')}</h3>
          <div className="space-y-2">
            {todayPlannedTasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40"
                onDoubleClick={() => handleOpenTaskNotes(task.id)}
              >
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
                  title={t('daily.removeFromTodayPlan')}
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
          <span>{t('daily.addTaskToPlan')} ({unplannedTasks.length})</span>
        </button>
        
        {showAllTasks && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {unplannedTasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">{t('daily.allTasksAdded')}</p>
            ) : (
              unplannedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onDoubleClick={() => handleOpenTaskNotes(task.id)}
                >
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
                    title={t('daily.addToTodayPlan')}
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
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { tasks, dayExecutions, loadDayExecutions, loadTasks } = useAppStore();
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadDayExecutions(), loadTasks()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadDayExecutions, loadTasks]);
  
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
  
  // Calculate task completion stats for display
  const todayPlannedTasks = useAppStore.getState().getTodayPlannedTasks();
  const allActiveTasksCount = tasks.filter(t => t.status === 'active').length;
  const completedTodayCount = todayPlannedTasks.filter(
    t => (t.completedPomodoros || 0) >= t.estimatedPomodoros
  ).length;
  
  // Task form handlers
  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const handleTaskFormSubmit = async () => {
    // Reload tasks to get the newly created task
    await useAppStore.getState().loadTasks();
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };
  
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
              {isToday && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-6 h-6 text-red-500" />
                      <h2 className="text-xl font-bold">{t('daily.todayTasks')}</h2>
                      <span className="text-sm text-gray-500">
                        {completedTodayCount}/{allActiveTasksCount} {t('daily.completed')}
                      </span>
                    </div>
                    <button
                      onClick={handleCreateTask}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('daily.newTask')}
                    </button>
                  </div>
                  <TaskPlanner />
                </div>
              )}
              <DaySummary date={selectedDate} />
            </>
          )}
        </main>
      </div>

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          task={editingTask}
          onSubmit={handleTaskFormSubmit}
          onCancel={handleTaskFormClose}
        />
      )}
    </Layout>
  );
}
