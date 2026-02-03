# 番茄钟应用 (Pomodoro App)

一个功能强大的番茄钟应用，结合了 Stretchly 的多显示器全屏休息功能和 Flowkeeper 的工作列表管理能力。

## 功能特性

### 番茄钟核心功能
- **标准番茄钟**: 25分钟工作 + 5分钟短休息 + 15分钟长休息
- **可配置时长**: 自定义工作、休息时长和长休息间隔
- **自动开始**: 可配置休息结束后自动开始下一个番茄钟
- **进度追踪**: 实时显示剩余时间和完成进度

### 多显示器全屏休息 (Stretchly 风格)
- **全屏接管**: 休息时为所有显示器创建全屏窗口
- **临时跳过**: 提供"推迟"和"跳过"按钮
  - 前30%时间: 仅显示"推迟"按钮
  - 30%-100%时间: 显示"跳过"按钮
- **严格模式**: 可配置禁止跳过休息
- **健康提示**: 显示休息建议和眼部保健操

### 工作列表管理 (Flowkeeper 风格)
- **项目管理**: 创建和管理不同项目，为每个项目分配颜色
- **任务管理**: 创建任务，设置预估番茄钟数，跟踪完成情况
- **分类视图**:
  - 按日期查看 (今天/本周/本月)
  - 按项目筛选
  - 已完成任务归档
- **数据统计**:
  - 日/周/月完成番茄钟数
  - 项目时间分布饼图
  - 效率趋势折线图
  - 导出 CSV 时间表

### 桌面集成
- **系统托盘**: 常驻托盘图标，显示倒计时
- **全局快捷键**:
  - `Ctrl/Cmd + Shift + P`: 开始/暂停番茄钟
  - `Ctrl/Cmd + Shift + S`: 跳过当前阶段
  - `Ctrl/Cmd + Shift + O`: 显示/隐藏窗口
- **通知提醒**: 休息前后发送系统通知
- **主题切换**: 深色/浅色/跟随系统

## 技术栈

- **Electron**: 跨平台桌面应用框架
- **React + TypeScript**: 前端界面
- **Zustand**: 状态管理
- **Tailwind CSS**: 样式框架
- **Recharts**: 统计图表
- **Lucide React**: 图标库

## 数据存储

所有数据以 JSON 格式存储在用户数据目录：
- `settings.json`: 应用设置
- `projects.json`: 项目列表
- `tasks.json`: 任务列表
- `logs.json`: 番茄钟完成记录

## 安装和运行

### 前置要求
- Node.js 20.x 或更高版本

### 安装依赖
```bash
npm install
```

### 开发模式（推荐 - 干净启动）
```bash
# 方式1：使用新的干净启动（无命令行窗口）
npm run dev:clean

# 方式2：使用 PowerShell 脚本（完全隐藏）
.\start-hidden.ps1

# 方式3：使用批处理文件（最小化窗口）
.\start-dev.bat

# 传统方式（会显示命令行窗口）
npm run dev
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
npm run build
npm start
```

## 项目结构

```
pomodoro-app/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 应用入口
│   │   ├── storage.ts     # JSON 数据存储
│   │   ├── timer.ts       # 计时器逻辑
│   │   ├── tray.ts        # 系统托盘
│   │   ├── shortcuts.ts   # 全局快捷键
│   │   ├── preload.ts     # 预加载脚本
│   │   └── windows/       # 窗口管理
│   │       ├── main-window.ts
│   │       └── break-window.ts
│   ├── renderer/          # React 前端
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # Zustand 状态管理
│   │   └── styles.css     # 全局样式
│   └── shared/            # 共享类型
│       └── types.ts
├── assets/                # 图标和资源
└── package.json
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + P` | 开始/暂停番茄钟 |
| `Ctrl/Cmd + Shift + S` | 跳过当前阶段 |
| `Ctrl/Cmd + Shift + O` | 显示/隐藏主窗口 |

## 配置说明

应用设置保存在 `settings.json` 中，包含以下配置项：

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
  strictMode: false,
  
  // 休息设置
  fullscreenBreak: true,
  allScreensBreak: true,
  skipDelayPercent: 30,
  postponeMinutes: 2,
  
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
  }
}
```

## 开源参考

本项目参考了以下开源项目的优秀设计理念：

- **[Stretchly](https://github.com/hovancik/stretchly)**: 多显示器全屏休息功能
- **[Flowkeeper](https://github.com/flowkeeper-org/flowkeeper)**: 工作列表和项目管理功能

## 许可证

MIT License
