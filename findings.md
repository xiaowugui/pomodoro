# Findings - Pomodoro App 测试计划

## 项目结构分析

### 技术栈
- **Electron**: 28.1.0 - 跨平台桌面应用
- **React**: 18.2.0 - 前端界面
- **TypeScript**: 5.3.3 - 类型安全
- **Zustand**: 4.4.7 - 状态管理
- **Vitest**: 1.1.0 - 测试框架 (已配置)
- **jsdom**: 24.0.0 - 浏览器环境模拟

### 目录结构
```
src/
├── main/                      # Electron 主进程
│   ├── index.ts              # 应用入口
│   ├── storage.ts            # JSON 数据存储
│   ├── timer.ts              # 计时器逻辑 (TimerManager 类)
│   ├── tray.ts               # 系统托盘
│   ├── shortcuts.ts           # 全局快捷键
│   ├── preload.ts             # 预加载脚本
│   └── windows/               # 窗口管理
├── renderer/                  # React 前端
│   ├── components/            # UI 组件
│   ├── pages/                 # 页面组件
│   ├── stores/                # Zustand 状态管理
│   └── ...
├── shared/                    # 共享类型
│   └── types.ts              # 类型定义 + 默认设置
└── __tests__/                 # 测试文件 (已存在 types.test.ts)
```

## 功能模块分析

### 1. 计时器 (Timer)
- **位置**: `src/main/timer.ts` (TimerManager 类) + `src/renderer/stores/timerStore.ts`
- **状态**: idle, work, short_break, long_break
- **控制**: start, pause, resume, stop, skip, complete, postpone
- **特点**: 
  - 番茄钟完成后自动进入休息
  - 每4个番茄钟触发长休息
  - 休息支持推迟功能

### 2. 项目管理 (Projects)
- **位置**: `src/renderer/stores/appStore.ts` + `src/renderer/components/ProjectForm.tsx`
- **数据结构**: id, name, color, status, createdAt, completedAt
- **操作**: create, update, delete, complete

### 3. 任务管理 (Tasks)
- **位置**: `src/renderer/stores/appStore.ts` + `src/renderer/components/TaskForm.tsx`
- **数据结构**: 
  - id, title, projectId
  - estimatedPomodoros, completedPomodoros
  - status, isImportant, isUrgent (四象限)
  - workDates, plannedDates
- **操作**: create, update, delete, complete

### 4. 设置 (Settings)
- **位置**: `src/renderer/stores/settingsStore.ts` + `src/renderer/components/SettingsForm.tsx`
- **配置项**: 30+ 个设置项

### 5. 休息窗口 (Break Window)
- **位置**: `src/renderer/pages/BreakPage.tsx` + `src/main/windows/break-window.ts`
- **功能**: 倒计时, 推迟, 跳过, 严格模式

### 6. 统计数据 (Stats)
- **位置**: `src/renderer/pages/StatsPage.tsx` + `src/renderer/stores/appStore.ts`
- **指标**: 总番茄钟, 总时长, 完成任务数, 连续天数

### 7. 任务备注 (Task Notes)
- **位置**: `src/renderer/pages/TaskNotesPage.tsx`
- **功能**: 文本备注 + 链接管理

## 测试配置现状

### package.json 测试配置
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.1.0",
    "jsdom": "^24.0.0"
  }
}
```

### 现有测试文件
- `src/__tests__/types.test.ts` - 已存在

## 关键发现

### Store 架构
- 使用 Zustand 进行状态管理
- appStore: 负责数据 (projects, tasks, logs, dayExecutions, taskNotes)
- timerStore: 负责计时器状态和控制
- settingsStore: 负责应用设置
- themeStore: 负责主题

### IPC 通信
- preload.ts 暴露 electronAPI 到渲染进程
- 主进程处理计时器逻辑
- 渲染进程通过 IPC 调用主进程功能

### 表单验证
- ProjectForm: 名称必填
- TaskForm: 名称必填, 项目必选
- SettingsForm: 数字范围验证

## 需要创建的文件

1. `src/__tests__/timer/timerStore.test.ts`
2. `src/__tests__/timer/timerManager.test.ts`
3. `src/__tests__/stores/appStore.test.ts`
4. `src/__tests__/stores/settingsStore.test.ts`
5. `src/__tests__/components/TaskForm.test.tsx`
6. `src/__tests__/components/ProjectForm.test.tsx`
7. `src/__tests__/components/SettingsForm.test.tsx`
8. `src/__tests__/components/TimerControls.test.tsx`
9. `src/__tests__/utils/format.test.ts`
10. `src/__tests__/test-utils.tsx` (测试工具)
