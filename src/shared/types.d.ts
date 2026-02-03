export interface Project {
    id: string;
    name: string;
    color: string;
    createdAt: string;
}
export interface Task {
    id: string;
    title: string;
    projectId: string;
    estimatedPomodoros: number;
    completedPomodoros: number;
    status: 'active' | 'completed';
    createdAt: string;
    completedAt?: string;
}
export interface PomodoroLog {
    id: string;
    taskId: string;
    projectId: string;
    startTime: string;
    endTime: string;
    duration: number;
    completed: boolean;
    type: 'work' | 'short_break' | 'long_break';
}
export interface Settings {
    pomodoroDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    strictMode: boolean;
    fullscreenBreak: boolean;
    allScreensBreak: boolean;
    skipDelayPercent: number;
    postponeMinutes: number;
    soundEnabled: boolean;
    notificationEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    shortcuts: {
        toggleTimer: string;
        skipPhase: string;
        showWindow: string;
    };
}
export declare const defaultSettings: Settings;
export interface AppState {
    settings: Settings;
    projects: Project[];
    tasks: Task[];
    logs: PomodoroLog[];
}
export interface TimerState {
    isRunning: boolean;
    timeRemaining: number;
    totalTime: number;
    phase: 'work' | 'short_break' | 'long_break' | 'idle';
    currentTaskId: string | null;
    pomodorosCompleted: number;
    sessionId: string | null;
}
export declare const IPC_CHANNELS: {
    readonly GET_SETTINGS: "get-settings";
    readonly SET_SETTINGS: "set-settings";
    readonly SETTINGS_CHANGED: "settings-changed";
    readonly GET_DATA: "get-data";
    readonly SAVE_DATA: "save-data";
    readonly DATA_CHANGED: "data-changed";
    readonly GET_PROJECTS: "get-projects";
    readonly CREATE_PROJECT: "create-project";
    readonly UPDATE_PROJECT: "update-project";
    readonly DELETE_PROJECT: "delete-project";
    readonly GET_TASKS: "get-tasks";
    readonly CREATE_TASK: "create-task";
    readonly UPDATE_TASK: "update-task";
    readonly DELETE_TASK: "delete-task";
    readonly GET_LOGS: "get-logs";
    readonly CREATE_LOG: "create-log";
    readonly UPDATE_LOG: "update-log";
    readonly TIMER_START: "timer-start";
    readonly TIMER_PAUSE: "timer-pause";
    readonly TIMER_RESUME: "timer-resume";
    readonly TIMER_STOP: "timer-stop";
    readonly TIMER_SKIP: "timer-skip";
    readonly TIMER_TICK: "timer-tick";
    readonly TIMER_COMPLETE: "timer-complete";
    readonly SHOW_BREAK_WINDOW: "show-break-window";
    readonly HIDE_BREAK_WINDOW: "hide-break-window";
    readonly BREAK_WINDOW_ACTION: "break-window-action";
    readonly BREAK_WINDOW_CLOSED: "break-window-closed";
    readonly SHOW_MAIN_WINDOW: "show-main-window";
    readonly HIDE_MAIN_WINDOW: "hide-main-window";
    readonly QUIT_APP: "quit-app";
    readonly SHOW_NOTIFICATION: "show-notification";
};
