import { create } from 'zustand';
import { Project, Task, PomodoroLog, TaskDayExecution } from '@shared/types';

declare global {
  interface Window {
    electronAPI: {
      getProjects: () => Promise<Project[]>;
      createProject: (project: any) => Promise<Project>;
      updateProject: (project: any) => Promise<Project>;
      deleteProject: (id: string) => Promise<boolean>;
      getTasks: () => Promise<Task[]>;
      createTask: (task: any) => Promise<Task>;
      updateTask: (task: any) => Promise<Task>;
      deleteTask: (id: string) => Promise<boolean>;
      getLogs: () => Promise<PomodoroLog[]>;
      createLog: (log: any) => Promise<PomodoroLog>;
      updateLog: (log: any) => Promise<PomodoroLog>;
      getDayExecutions: () => Promise<TaskDayExecution[]>;
      getDayExecutionsByDate: (date: string) => Promise<TaskDayExecution[]>;
      getDayExecutionsByTask: (taskId: string) => Promise<TaskDayExecution[]>;
      createDayExecution: (execution: any) => Promise<TaskDayExecution>;
      updateDayExecution: (execution: any) => Promise<TaskDayExecution>;
      deleteDayExecution: (id: string) => Promise<boolean>;
    };
  }
}

interface AppStoreState {
  // Data
  projects: Project[];
  tasks: Task[];
  logs: PomodoroLog[];
  dayExecutions: TaskDayExecution[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions - Projects
  loadProjects: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (project: Project) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // Actions - Tasks
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<boolean>;
  completeTask: (taskId: string) => Promise<Task>;
  
  // Actions - Logs
  loadLogs: () => Promise<void>;
  createLog: (log: Omit<PomodoroLog, 'id'>) => Promise<PomodoroLog>;
  updateLog: (log: PomodoroLog) => Promise<PomodoroLog>;
  
  // Actions - Day Executions
  loadDayExecutions: () => Promise<void>;
  getTasksByDate: (date: string) => Task[];
  getDailySummary: (date: string) => { totalPomodoros: number; totalMinutes: number; taskCount: number };
  
  // Actions - Planned Tasks
  getTodayPlannedTasks: () => Task[];
  addTaskToToday: (taskId: string) => Promise<Task>;
  removeTaskFromToday: (taskId: string) => Promise<Task>;
  isTaskPlannedForToday: (taskId: string) => boolean;
  
  // Actions - Data management
  loadAllData: () => Promise<void>;
  getTasksByProject: (projectId: string) => Task[];
  getLogsByTask: (taskId: string) => PomodoroLog[];
  getLogsByDateRange: (startDate: string, endDate: string) => PomodoroLog[];
  getStats: () => {
    totalPomodoros: number;
    totalWorkMinutes: number;
    completedTasks: number;
    streakDays: number;
  };
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  // Initial state
  projects: [],
  tasks: [],
  logs: [],
  dayExecutions: [],
  isLoading: false,
  error: null,



  // Projects
  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await window.electronAPI.getProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await window.electronAPI.createProject(project);
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false,
      }));
      return newProject;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateProject: async (project) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProject = await window.electronAPI.updateProject(project);
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === updatedProject.id ? updatedProject : p
        ),
        isLoading: false,
      }));
      return updatedProject;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const success = await window.electronAPI.deleteProject(projectId);
      if (success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          tasks: state.tasks.filter((t) => t.projectId !== projectId),
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Tasks
  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await window.electronAPI.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const newTask = await window.electronAPI.createTask(task);
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      return newTask;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTask = await window.electronAPI.updateTask(task);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        ),
        isLoading: false,
      }));
      return updatedTask;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    set({ isLoading: true, error: null });
    try {
      const success = await window.electronAPI.deleteTask(taskId);
      if (success) {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
          isLoading: false,
        }));
      }
      return success;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  completeTask: async (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const updatedTask: Task = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    return get().updateTask(updatedTask);
  },

  // Logs
  loadLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const logs = await window.electronAPI.getLogs();
      set({ logs, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  createLog: async (log) => {
    set({ isLoading: true, error: null });
    try {
      const newLog = await window.electronAPI.createLog(log);
      set((state) => ({
        logs: [...state.logs, newLog],
        isLoading: false,
      }));
      return newLog;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  updateLog: async (log) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLog = await window.electronAPI.updateLog(log);
      set((state) => ({
        logs: state.logs.map((l) => (l.id === updatedLog.id ? updatedLog : l)),
        isLoading: false,
      }));
      return updatedLog;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // Data management
  loadAllData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [projects, tasks, logs, dayExecutions] = await Promise.all([
        window.electronAPI.getProjects(),
        window.electronAPI.getTasks(),
        window.electronAPI.getLogs(),
        window.electronAPI.getDayExecutions(),
      ]);
      set({
        projects,
        tasks,
        logs,
        dayExecutions,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // Day Executions
  loadDayExecutions: async () => {
    set({ isLoading: true, error: null });
    try {
      const dayExecutions = await window.electronAPI.getDayExecutions();
      set({ dayExecutions, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  getTasksByDate: (date: string) => {
    const { dayExecutions, tasks } = get();
    const executionTaskIds = dayExecutions
      .filter(de => de.date === date)
      .map(de => de.taskId);
    return tasks.filter(t => executionTaskIds.includes(t.id));
  },

  getDailySummary: (date: string) => {
    const { dayExecutions } = get();
    const dayRecords = dayExecutions.filter(de => de.date === date);
    return {
      totalPomodoros: dayRecords.reduce((sum, de) => sum + de.pomodorosCompleted, 0),
      totalMinutes: dayRecords.reduce((sum, de) => sum + de.minutesWorked, 0),
      taskCount: dayRecords.length,
    };
  },

  getTasksByProject: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId);
  },

  getLogsByTask: (taskId) => {
    return get().logs.filter((l) => l.taskId === taskId);
  },

  getLogsByDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return get().logs.filter((l) => {
      const logDate = new Date(l.startTime);
      return logDate >= start && logDate <= end;
    });
  },

  getStats: () => {
    const { tasks, logs } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 从任务的 completedPomodoros 计算总番茄钟数（更准确）
    const totalPomodorosFromTasks = tasks.reduce((sum, t) => sum + (t.completedPomodoros || 0), 0);
    
    // 从日志计算作为备选
    const completedLogs = logs.filter((l) => l.completed && l.type === 'work');
    const totalPomodorosFromLogs = completedLogs.length;
    
    // 使用任务数据作为主要来源，如果不一致则使用较大值
    const totalPomodoros = Math.max(totalPomodorosFromTasks, totalPomodorosFromLogs);
    
    // 计算总工作时长（分钟）
    const totalWorkMinutes = completedLogs.reduce((sum, l) => sum + l.duration, 0) / 60;

    // 从日志计算连续天数（因为只有日志有时间信息）
    const uniqueDates = new Set(
      completedLogs.map((l) => new Date(l.startTime).toDateString())
    );

    let streakDays = 0;
    const sortedDates = Array.from(uniqueDates)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      if (sortedDates[i].toDateString() === checkDate.toDateString()) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalPomodoros,
      totalWorkMinutes: Math.round(totalWorkMinutes),
      completedTasks: tasks.filter((t) => t.status === 'completed').length,
      streakDays,
    };
  },

  // Planned Tasks
  getTodayPlannedTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter((t) => 
      t.status === 'active' && t.plannedDates?.includes(today)
    );
  },

  addTaskToToday: async (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const plannedDates = task.plannedDates || [];
    if (plannedDates.includes(today)) {
      return task; // Already planned for today
    }

    const updatedTask: Task = {
      ...task,
      plannedDates: [...plannedDates, today],
    };

    return get().updateTask(updatedTask);
  },

  removeTaskFromToday: async (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const plannedDates = (task.plannedDates || []).filter((d) => d !== today);

    const updatedTask: Task = {
      ...task,
      plannedDates,
    };

    return get().updateTask(updatedTask);
  },

  isTaskPlannedForToday: (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const task = get().tasks.find((t) => t.id === taskId);
    return task?.plannedDates?.includes(today) || false;
  },
}));
