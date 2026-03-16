# 代码质量改进计划

## 概述

本文档整理了 Pomodoro App 项目中需要修正的代码质量问题，并提供了具体的改进任务列表。

## 问题分类总览

| 类别 | 数量 | 优先级 |
|------|------|--------|
| **国际化 (i18n) 缺失英语界面** | 17 个文件, 78+ 处硬编码中文 | 🔴 高 |
| 类型安全问题 (any 滥用) | 50+ 处 | 🔴 高 |
| 缺少 ESLint 配置 | 1 项 | 🔴 高 |
| 测试覆盖不足 | 关键模块无测试 | 🔴 高 |
| 生产环境 console.log | 15+ 处 | 🟡 中 |
| 类型断言绕过 | 1 处 | 🟡 中 |
| 缺少 Error Boundary | React 无错误边界 | 🟡 中 |
| CSP 安全头 | 缺失 | 🟢 低 |

## i18n 任务概览 (Task 16-24)

**英语界面支持** 是高优先级任务，需要修改 **21 个文件**:

### 需要翻译的文件 (17 个):
1. `components/Sidebar.tsx` - 6 处
2. `components/TaskForm.tsx` - 2 处
3. `components/TaskList.tsx` - 4 处
4. `components/TaskSelector.tsx` - 8 处
5. `components/ProjectForm.tsx` - 3 处
6. `components/ProjectList.tsx` - 3 处
7. `components/SettingsForm.tsx` - 2 处
8. `components/BreakOverlay.tsx` - 4 处
9. `components/TimerControls.tsx` - 1 处
10. `components/StatsChart.tsx` - 1 处
11. `pages/TimerPage.tsx` - 4 处
12. `pages/TasksPage.tsx` - 3 处
13. `pages/DailyViewPage.tsx` - 15+ 处 (月份/日期)
14. `pages/StatsPage.tsx` - 3 处
15. `pages/TaskNotesPage.tsx` - 4 处
16. `pages/TaskNotePopup.tsx` - 3 处
17. `stores/timerStore.ts` - 4 处

### 需要新建的文件:
- `src/renderer/i18n/index.ts` - i18n 配置
- `src/renderer/i18n/en.json` - 英语翻译
- `src/renderer/i18n/zh.json` - 中文翻译 (从现有文本整理)

### 需要类型更新的文件:
- `src/shared/types.ts` - 添加 language 设置字段

---

## 任务列表

### 阶段 1: 基础配置 (Foundation)

#### Task 1: 添加 ESLint 配置
- **问题**: package.json 中有 ESLint 依赖但无配置文件
- **文件**: 需创建 `eslint.config.js`
- **建议配置**:
  - 使用 TypeScript-eslint parser
  - 启用 react 插件
  - 配置 strict 规则
  - 添加 npm script: `"lint": "eslint src/"`
- **验证**: 运行 `npm run lint` 无错误

#### Task 2: 添加 Prettier 配置 (可选)
- **文件**: 需创建 `.prettierrc`
- **目的**: 统一代码格式

---

### 阶段 2: 类型安全改进 (Type Safety)

#### Task 3: 修复 preload.ts 中的 any 类型
- **文件**: `src/main/preload.ts`
- **问题**: IPC API 参数使用 `any`
- **修复方案**: 使用 `Settings`, `Project`, `Task` 等具体类型
- **示例**:
```typescript
// Before
setSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings)

// After  
setSettings: (settings: Settings) => ipcRenderer.invoke(IPC_CHANNELS.SET_SETTINGS, settings)
```

#### Task 4: 修复 electron.d.ts 中的 any 类型
- **文件**: `src/renderer/types/electron.d.ts`
- **问题**: 12+ 处 any 类型
- **修复方案**: 为每个 API 方法添加具体类型定义

#### Task 5: 修复 stores 中的 any 类型
- **文件**: 
  - `src/renderer/stores/timerStore.ts`
  - `src/renderer/stores/settingsStore.ts`
  - `src/renderer/stores/appStore.ts`
- **问题**: 8+ 处 any 类型
- **修复方案**: 使用具体类型替换

#### Task 6: 修复 main/index.ts 中的 any 类型
- **文件**: `src/main/index.ts:113`
- **问题**: `app.setLoginItemSettings(options: any)`
- **修复方案**: 定义正确类型或使用类型断言

#### Task 7: 修复其他组件中的 any
- **文件**:
  - `src/renderer/pages/BreakPage.tsx`
  - `src/renderer/components/StatsChart.tsx`
  - `src/renderer/components/SettingsForm.tsx`
- **问题**: 回调参数使用 any
- **修复方案**: 添加具体类型定义

---

### 阶段 3: 测试覆盖 (Testing)

#### Task 8: 为 TimerManager 添加单元测试
- **文件**: `src/main/timer.ts`
- **测试内容**:
  - start/pause/resume/stop 基本功能
  - phase 转换逻辑 (work → short_break → work)
  - postpone 推迟功能
  - skip 跳过功能
  - 自动开始逻辑
- **目标覆盖率**: >80%

#### Task 9: 为 StorageManager 添加单元测试
- **文件**: `src/main/storage.ts`, `src/main/storage/*.ts`
- **测试内容**:
  - CRUD 操作
  - 数据持久化
  - 备份/恢复功能
  - 迁移逻辑
- **目标覆盖率**: >70%

#### Task 10: 为 BaseStorage 添加单元测试
- **文件**: `src/main/storage/base-storage.ts`
- **测试内容**:
  - 防抖保存逻辑
  - 错误处理
  - 默认值合并

#### Task 11: 添加集成测试
- **文件**: 新建 `src/__tests__/integration/`
- **测试内容**:
  - 主进程与渲染进程 IPC 通信
  - 窗口管理
  - 快捷键注册

---

### 阶段 4: 代码清理 (Code Cleanup)

#### Task 12: 移除生产环境 console.log
- **文件**: 多处
- **位置**:
  - `src/main/index.ts` (10+ 处)
  - `src/main/timer.ts` (3 处)
  - `src/main/windows/*.ts` (可能)
- **修复方案**: 
  - 开发环境: 使用 `console.debug` 或 debug 模块
  - 生产环境: 完全移除或使用 proper logging (winston, electron-log)

#### Task 13: 添加统一的日志模块
- **建议**: 使用 `electron-log` 替代 console.log
- **功能**:
  - 日志分级 (debug, info, warn, error)
  - 日志轮转
  - 文件输出

---

### 阶段 5: 安全增强 (Security)

#### Task 14: 添加 Error Boundary
- **文件**: 新建 `src/renderer/components/ErrorBoundary.tsx`
- **用途**: 捕获 React 组件错误，防止白屏
- **示例**:
```tsx
class ErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Task 15: 添加 Content Security Policy
- **文件**: `src/renderer/index.html` (需创建)
- **添加 meta 标签**:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
```

---

### 阶段 6: 国际化 (i18n) - 英语界面支持

> **状态**: 🔴 高优先级 | **影响文件**: 17 个 | **硬编码中文**: 78+ 处

#### Task 16: 添加 i18n 框架
- **问题**: UI 全部硬编码中文，无多语言支持
- **解决方案**: 使用 `react-i18next` + `i18next`
- **依赖**: `npm install i18next react-i18next`

**需要修改的文件**:
```bash
# 安装依赖
npm install i18next react-i18next
```

#### Task 17: 创建 i18n 配置和语言文件
- **文件**: 新建 `src/renderer/i18n/`
- **结构**:
```
src/renderer/i18n/
├── index.ts          # i18n 初始化配置
├── en.json           # 英语翻译
└── zh.json          # 中文翻译 (现有)
```

**en.json 翻译键值** (部分示例):
```json
{
  "app": {
    "title": "Pomodoro",
    "timer": "Timer",
    "tasks": "Tasks",
    "daily": "Daily",
    "notes": "Notes",
    "stats": "Statistics",
    "settings": "Settings"
  },
  "timer": {
    "work": "Focus Time",
    "shortBreak": "Short Break",
    "longBreak": "Long Break",
    "idle": "Ready to Start",
    "start": "Start",
    "pause": "Pause",
    "resume": "Resume",
    "skip": "Skip",
    "stop": "Stop"
  },
  "tasks": {
    "newTask": "New Task",
    "editTask": "Edit Task",
    "deleteTask": "Delete Task",
    "confirmDelete": "Are you sure you want to delete this task?",
    "projectTasks": "Project Tasks",
    "allTasks": "All Tasks",
    "active": "Active",
    "completed": "Completed",
    "noTasks": "No active tasks"
  },
  "quadrant": {
    "importantUrgent": "Important & Urgent",
    "important": "Important",
    "urgent": "Urgent",
    "normal": "Normal",
    "doNow": "Do Now",
    "schedule": "Schedule",
    "delegate": "Delegate",
    "delete": "Can Delete"
  },
  "settings": {
    "title": "Settings",
    "duration": "Duration",
    "pomodoro": "Pomodoro (minutes)",
    "shortBreak": "Short Break (minutes)",
    "longBreak": "Long Break (minutes)",
    "autoStart": "Auto Start",
    "autoStartBreaks": "Auto Start Breaks",
    "autoStartPomodoros": "Auto Start Pomodoros",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "language": "Language",
    "save": "Save Settings",
    "saving": "Saving..."
  },
  "break": {
    "shortBreak": "Short Break",
    "longBreak": "Long Break",
    "restEyes": "Rest your eyes",
    "restEnergy": "Take a break and recharge",
    "skipBreak": "Skip Break",
    "cannotSkip": "Cannot skip during break",
    "strictMode": "Strict Mode"
  },
  "stats": {
    "title": "Statistics",
    "daily": "Daily",
    "projects": "Projects",
    "trend": "12-Week Trend",
    "completed": "Completed",
    "totalPomodoros": "Total Pomodoros",
    "totalMinutes": "Total Minutes",
    "streak": "Current Streak"
  },
  "notifications": {
    "pomodoroComplete": "Pomodoro Complete!",
    "timeForBreak": "Time for a break.",
    "breakComplete": "Break Complete!",
    "readyForNext": "Ready for the next pomodoro?",
    "breakPostponed": "Break Postponed",
    "breakInMinutes": "Break will resume in {{minutes}} minutes."
  },
  "tray": {
    "showWindow": "Show Window",
    "startPause": "Start/Pause",
    "skipPhase": "Skip Phase",
    "quit": "Quit",
    "newTask": "New Task",
    "startPomodoro": "Start Pomodoro",
    "showStats": "Show Statistics"
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "confirm": "Confirm",
    "yes": "Yes",
    "no": "No",
    "loading": "Loading...",
    "saving": "Saving...",
    "noProject": "No Project",
    "preview": "Preview"
  }
}
```

#### Task 18: 集成 i18n 到 React 应用
- **文件**: `src/renderer/main.tsx`
- **修改**:
```tsx
import i18n from './i18n';
import './i18n'; // 初始化 i18next

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Task 19: 替换所有硬编码中文 (Renderer)
- **文件**: 17 个组件/页面文件
- **修改方式**: 使用 `t('key')` 替换硬编码文本

**需要修改的文件列表**:
| # | 文件 | 中文字符串数 |
|---|------|-------------|
| 1 | `components/Sidebar.tsx` | 6 |
| 2 | `components/TaskForm.tsx` | 2 |
| 3 | `components/TaskList.tsx` | 4 |
| 4 | `components/TaskSelector.tsx` | 8 |
| 5 | `components/ProjectForm.tsx` | 3 |
| 6 | `components/ProjectList.tsx` | 3 |
| 7 | `components/SettingsForm.tsx` | 2 |
| 8 | `components/BreakOverlay.tsx` | 4 |
| 9 | `components/TimerControls.tsx` | 1 |
| 10 | `components/StatsChart.tsx` | 1 |
| 11 | `pages/TimerPage.tsx` | 4 |
| 12 | `pages/TasksPage.tsx` | 3 |
| 13 | `pages/DailyViewPage.tsx` | 15+ (月份/日期) |
| 14 | `pages/StatsPage.tsx` | 3 |
| 15 | `pages/TaskNotesPage.tsx` | 4 |
| 16 | `pages/TaskNotePopup.tsx` | 3 |
| 17 | `stores/timerStore.ts` | 4 |

#### Task 20: 替换主进程硬编码中文
- **文件**: 4 个主进程文件
- **注意**: 主进程不能直接使用 react-i18next，需要使用独立方案

**方案 A - 使用 JSON 配置文件**:
```typescript
// src/main/i18n-main.ts
import i18n from 'i18next';
import en from '../renderer/i18n/en.json';
import zh from '../renderer/i18n/zh.json';

// 初始化主进程翻译
i18n.init({
  lng: 'zh', // 从设置中读取
  resources: { en, zh }
});

export function t(key: string): string {
  return i18n.t(key);
}
```

**方案 B - 简单方案** (推荐):
- 直接在 IPC 返回的设置中包含 `language` 值
- 主进程通知消息使用英文常量

**需要修改的文件**:
| # | 文件 | 中文字符串数 |
|---|------|-------------|
| 1 | `main/index.ts` | 4 |
| 2 | `main/tray.ts` | 11 |
| 3 | `main/windows/break-window.ts` | 3 |
| 4 | `main/windows/task-note-window.ts` | 1 |

#### Task 21: 添加语言切换功能
- **文件**: `components/SettingsForm.tsx`
- **UI**: 添加语言选择下拉框 (中文/English)
- **逻辑**:
  1. 保存设置时通过 IPC 通知主进程语言变更
  2. 主进程更新通知消息语言
  3. 渲染进程更新 UI 语言 (i18n.changeLanguage)

#### Task 22: 从设置中读取默认语言
- **文件**: `src/renderer/i18n/index.ts`
- **逻辑**:
```tsx
// 初始化时从设置读取语言
const savedSettings = await window.electronAPI.getSettings();
const savedLanguage = savedSettings?.language || 'zh';
i18n.init({
  lng: savedLanguage,
  // ...
});
```

---

### 额外 Task: 为 Settings 添加语言设置

#### Task 23: 更新 Settings 类型定义
- **文件**: `src/shared/types.ts`
- **修改**: 添加 language 字段
```typescript
// Settings 接口中添加
language: 'zh' | 'en';

// defaultSettings 中添加
language: 'zh',
```

#### Task 24: 更新设置表单语言选项
- **文件**: `src/renderer/components/SettingsForm.tsx`
- **修改**: 添加语言选择 UI

---

## 执行顺序建议

```
阶段 1 (1-2 天)
├── Task 1: ESLint 配置
└── Task 2: Prettier 配置 (可选)

阶段 2 (2-3 天)
├── Task 3: preload.ts 类型修复
├── Task 4: electron.d.ts 类型修复
├── Task 5: stores 类型修复
├── Task 6: main/index.ts 类型修复
└── Task 7: 其他组件类型修复

阶段 3 (3-5 天)
├── Task 8: TimerManager 测试
├── Task 9: StorageManager 测试
├── Task 10: BaseStorage 测试
└── Task 11: 集成测试

阶段 4 (1-2 天)
├── Task 12: 移除 console.log
└── Task 13: 日志模块 (可选)

阶段 5 (1 天)
├── Task 14: Error Boundary
└── Task 15: CSP

阶段 6: i18n 国际化 (高优先级, 3-5 天)
├── Task 16: 安装 i18n 依赖
├── Task 17: 创建 i18n 配置和翻译文件 (en.json, zh.json)
├── Task 18: 集成 i18n 到 React 应用
├── Task 19: 替换 Renderer 层硬编码中文 (17个文件)
├── Task 20: 替换主进程硬编码中文 (4个文件)
├── Task 21: 添加语言切换功能到设置页面
├── Task 22: 从设置中读取默认语言
├── Task 23: 更新 Settings 类型添加 language 字段
└── Task 24: 更新设置表单语言选项
```

---

## 验收标准

每个 Task 完成需满足:
1. ✅ ESLint 检查通过 (无 error)
2. ✅ TypeScript 编译无 any 相关警告
3. ✅ 测试用例全部通过
4. ✅ 代码审查通过
5. **i18n 任务额外要求**:
   - ✅ 语言切换后 UI 立即更新
   - ✅ 设置中保存的语言偏好持久化有效
   - ✅ 主进程通知消息使用正确的语言
   - ✅ 无硬编码中文字符串残留 (使用 grep 检查)

---

## 预期收益

| 指标 | 改进前 | 改进后 |
|------|--------|--------|
| TypeScript 类型覆盖率 | ~60% | >95% |
| 测试覆盖率 | <10% | >50% |
| ESLint 错误 | N/A | 0 |
| 安全漏洞 | 0 (已有基本防护) | 0 |
| **界面语言** | 仅中文 | 中文 + English |
| **国际化程度** | 0% | 100% (中英双语) |
| 代码可维护性 | 中 | 高 |
