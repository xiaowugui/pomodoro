# 番茄钟应用 (Pomodoro App)

一个功能强大的番茄钟应用，结合了 Stretchly 的多显示器全屏休息功能和 Flowkeeper 的工作列表管理能力。

## 功能特性

### 番茄钟核心功能
- **标准番茄钟**: 25分钟工作 + 5分钟短休息 + 15分钟长休息
- **可配置时长**: 自定义工作、休息时长和长休息间隔
- **自动开始**: 可配置休息结束后自动开始下一个番茄钟
- **进度追踪**: 实时显示剩余时间和完成进度

### 多显示器全屏休息 (Stretchly 风格)
- **全屏接管**: 休息时创建可配置大小的窗口（默认85%屏幕）
- **透明模式**: 支持半透明休息窗口
- **临时跳过**: 提供"推迟"和"跳过"按钮
  - 前30%时间: 显示"推迟"按钮
  - 30%-100%时间: 显示"跳过"按钮
- **严格模式**: 可配置禁止跳过/关闭休息
- **推迟功能**: 可设置推迟次数限制和时长

### 工作列表管理 (Flowkeeper 风格)
- **项目管理**: 创建和管理不同项目，为每个项目分配颜色
- **任务管理**: 创建任务，设置预估番茄钟数，跟踪完成情况
- **四象限优先级**: 支持重要/紧急二维分类
- **分类视图**:
  - 按日期查看 (今天/本周/本月)
  - 按项目筛选
  - 已完成任务归档
- **数据统计**:
  - 日/周/月完成番茄钟数
  - 项目时间分布饼图
  - 效率趋势折线图
  - 连续打卡天数统计

### 任务备注
- **任务笔记**: 为每个任务添加详细的文本备注
- **链接管理**: 关联外部链接（URL + 标题）
- **独立窗口**: 支持弹出独立窗口编辑备注

### 桌面集成
- **系统托盘**: 常驻托盘图标，显示倒计时
- **全局快捷键**:
  - `Ctrl/Cmd + Shift + P`: 开始/暂停番茄钟
  - `Ctrl/Cmd + Shift + S`: 跳过当前阶段
  - `Ctrl/Cmd + Shift + O`: 显示/隐藏窗口
  - `Ctrl/Cmd + X`: 结束休息
  - `Ctrl/Cmd + P`: 推迟休息
- **通知提醒**: 休息前后发送系统通知
- **主题切换**: 深色/浅色/跟随系统
- **开机启动**: 可配置开机自动启动

## 技术栈

- **Electron**: 28.1.0 - 跨平台桌面应用框架
- **React**: 18.2.0 - 前端界面
- **TypeScript**: 5.3.3 - 类型安全
- **Zustand**: 4.4.7 - 状态管理
- **Tailwind CSS**: 3.4.0 - 样式框架
- **Recharts**: 2.10.3 - 统计图表
- **Lucide React**: 0.303.0 - 图标库
- **React Router**: 6.21.1 - 路由管理
- **Vitest**: 1.1.0 - 测试框架

## 数据存储

所有数据以 JSON 格式统一存储在用户数据目录的 `data.json` 文件中，包含：
- `settings`: 应用设置
- `projects`: 项目列表
- `tasks`: 任务列表
- `logs`: 番茄钟完成记录
- `dayExecutions`: 任务每日执行记录
- `taskNotes`: 任务备注

## 安装和运行

### 前置要求
- Node.js 20.x 或更高版本
- npm 9.x 或更高版本

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 方式1：使用 npm 脚本
npm run dev

# 方式2：干净启动（无命令行窗口）
npm run dev:clean
```

### 构建应用
```bash
# 构建所有平台
npm run dist

# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

### 启动生产版本
```bash
# 先构建
npm run build

# 然后启动
npm start

# 或者直接启动（如果已构建）
npm run start
```

### 构建后手动运行
```bash
# 1. 构建代码
npm run build

# 2. 复制 dist 到 release
powershell -Command "Remove-Item -Path 'release\win-unpacked\resources\app\dist' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist' -Destination 'release\win-unpacked\resources\app\' -Recurse -Force"

# 3. 运行 exe
# 位置: release\win-unpacked\Pomodoro App.exe
```

## 项目结构

```
pomodoro-app/
├── src/
│   ├── main/                      # Electron 主进程
│   │   ├── index.ts               # 应用入口
│   │   ├── storage.ts             # JSON 数据存储
│   │   ├── timer.ts               # 计时器逻辑
│   │   ├── tray.ts                # 系统托盘
│   │   ├── shortcuts.ts           # 全局快捷键
│   │   ├── preload.ts             # 预加载脚本
│   │   ├── windows/               # 窗口管理
│   │   │   ├── main-window.ts     # 主窗口
│   │   │   ├── break-window.ts    # 休息窗口
│   │   │   └── task-note-window.ts # 任务备注窗口
│   │   └── utils/                 # 工具函数
│   │       └── display-manager.ts  # 显示管理器
│   ├── renderer/                  # React 前端
│   │   ├── components/            # UI 组件
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TimerDisplay.tsx
│   │   │   ├── TimerControls.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskSelector.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectForm.tsx
│   │   │   ├── SettingsForm.tsx
│   │   │   ├── StatsChart.tsx
│   │   │   └── BreakOverlay.tsx
│   │   ├── pages/                 # 页面组件
│   │   │   ├── TimerPage.tsx     # 计时器页面
│   │   │   ├── TasksPage.tsx     # 任务管理页面
│   │   │   ├── DailyViewPage.tsx  # 日视图页面
│   │   │   ├── StatsPage.tsx     # 统计页面
│   │   │   ├── SettingsPage.tsx  # 设置页面
│   │   │   ├── TaskNotesPage.tsx # 任务备注页面
│   │   │   └── BreakPage.tsx     # 休息页面
│   │   ├── stores/                # Zustand 状态管理
│   │   │   ├── appStore.ts
│   │   │   ├── timerStore.ts
│   │   │   ├── settingsStore.ts
│   │   │   └── themeStore.ts
│   │   ├── utils/                 # 工具函数
│   │   │   └── export.ts          # 导出功能
│   │   ├── main.tsx               # 前端入口
│   │   ├── App.tsx                # 应用组件
│   │   ├── break.tsx              # 休息窗口入口
│   │   └── styles.css             # 全局样式
│   ├── shared/                    # 共享类型
│   │   └── types.ts
│   └── __tests__/                 # 测试文件
├── assets/                        # 图标和资源
├── scripts/                       # 构建脚本
├── package.json
└── tsconfig.json
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + P` | 开始/暂停番茄钟 |
| `Ctrl/Cmd + Shift + S` | 跳过当前阶段 |
| `Ctrl/Cmd + Shift + O` | 显示/隐藏主窗口 |
| `Ctrl/Cmd + X` | 结束休息 |
| `Ctrl/Cmd + P` | 推迟休息 |

## 配置说明

应用设置保存在 `data.json` 中，包含以下配置项：

```typescript
{
  // 时长设置 (分钟)
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  
  // 行为设置
  autoStartBreaks: false,
  autoStartPomodoros: false,
  autoStartEnabled: false,      // 开机自动启动
  strictMode: false,
  
  // 休息窗口设置
  fullscreenBreak: true,
  allScreensBreak: true,
  breakWindowWidth: 0.85,        // 窗口宽度占比
  breakWindowHeight: 0.85,       // 窗口高度占比
  breakOpacity: 0.95,            // 窗口透明度
  transparentMode: false,        // 透明模式
  breakStrictMode: false,        // 严格模式
  skipDelayPercent: 30,
  
  // 推迟功能设置
  postponeEnabled: true,
  postponeMinutes: 2,
  postponeLimit: 1,
  postponeDelayPercent: 30,
  
  // 通知设置
  soundEnabled: true,
  notificationEnabled: true,
  
  // 外观
  theme: 'system', // 'light' | 'dark' | 'system'
  accentColor: '#ef4444',
  
  // 快捷键
  shortcuts: {
    toggleTimer: 'CommandOrControl+Shift+P',
    skipPhase: 'CommandOrControl+Shift+S',
    showWindow: 'CommandOrControl+Shift+O',
    endBreak: 'CommandOrControl+X',
    postponeBreak: 'CommandOrControl+P',
  }
}
```

## 测试

项目使用 Vitest 作为测试框架：

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch
```

## 开源参考

本项目参考了以下开源项目的优秀设计理念：

- **[Stretchly](https://github.com/hovancik/stretchly)**: 多显示器全屏休息功能
- **[Flowkeeper](https://github.com/flowkeeper-org/flowkeeper)**: 工作列表和项目管理功能

## 许可证

MIT License
