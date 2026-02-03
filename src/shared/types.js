"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.defaultSettings = void 0;
// 默认设置
exports.defaultSettings = {
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    strictMode: false,
    fullscreenBreak: true,
    allScreensBreak: true,
    skipDelayPercent: 30,
    postponeMinutes: 2,
    soundEnabled: true,
    notificationEnabled: true,
    theme: 'system',
    accentColor: '#ef4444',
    shortcuts: {
        toggleTimer: 'CommandOrControl+Shift+P',
        skipPhase: 'CommandOrControl+Shift+S',
        showWindow: 'CommandOrControl+Shift+O',
    },
};
// IPC 通道定义
exports.IPC_CHANNELS = {
    // 设置
    GET_SETTINGS: 'get-settings',
    SET_SETTINGS: 'set-settings',
    SETTINGS_CHANGED: 'settings-changed',
    // 数据管理
    GET_DATA: 'get-data',
    SAVE_DATA: 'save-data',
    DATA_CHANGED: 'data-changed',
    // 项目
    GET_PROJECTS: 'get-projects',
    CREATE_PROJECT: 'create-project',
    UPDATE_PROJECT: 'update-project',
    DELETE_PROJECT: 'delete-project',
    // 任务
    GET_TASKS: 'get-tasks',
    CREATE_TASK: 'create-task',
    UPDATE_TASK: 'update-task',
    DELETE_TASK: 'delete-task',
    // 番茄钟日志
    GET_LOGS: 'get-logs',
    CREATE_LOG: 'create-log',
    UPDATE_LOG: 'update-log',
    // 计时器控制
    TIMER_START: 'timer-start',
    TIMER_PAUSE: 'timer-pause',
    TIMER_RESUME: 'timer-resume',
    TIMER_STOP: 'timer-stop',
    TIMER_SKIP: 'timer-skip',
    TIMER_TICK: 'timer-tick',
    TIMER_COMPLETE: 'timer-complete',
    // 休息窗口
    SHOW_BREAK_WINDOW: 'show-break-window',
    HIDE_BREAK_WINDOW: 'hide-break-window',
    BREAK_WINDOW_ACTION: 'break-window-action',
    BREAK_WINDOW_CLOSED: 'break-window-closed',
    // 窗口控制
    SHOW_MAIN_WINDOW: 'show-main-window',
    HIDE_MAIN_WINDOW: 'hide-main-window',
    QUIT_APP: 'quit-app',
    // 通知
    SHOW_NOTIFICATION: 'show-notification',
};
