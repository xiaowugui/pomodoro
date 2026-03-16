# AGENTS.md - Coding Guidelines

**Pomodoro App** - Electron + React + TypeScript desktop timer with multi-screen breaks.

## 📂 Project Skills

This project includes custom skills for Pomodoro app automation:

| Skill | Description |
|-------|-------------|
| `pomodoro-tasks` | Manage tasks via CLI, supports AI workflow |
| `pomodoro-trigger` | Send trigger emails to control remote Pomodoro app |
| `pomodoro-page-reader` | Read rendered page content via IPC |

**Skills location:** `skills/` (project root)

To use a skill:
```
skill(name="pomodoro-tasks")
skill(name="pomodoro-trigger")
skill(name="pomodoro-page-reader")
```

## ⚠️ IMPORTANT: Rebuild Required After Code Changes

**每次代码修改后，都必须重新构建才能看到效果！**
构建exe不需要签名

这是 Electron 应用的特性：代码在 `dist/` 目录，但运行时从 `release/win-unpacked/resources/app/dist/` 加载。

### 完整的修改后构建流程：

```bash
# 1. 构建代码
npm run build

# 2. 复制 dist 到 release (替换旧文件)
powershell -Command "Remove-Item -Path 'release\win-unpacked\resources\app\dist' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist' -Destination 'release\win-unpacked\resources\app\' -Recurse -Force"

# 3. 更新时间戳 (可选，方便识别)
powershell -Command "(Get-Item 'release\win-unpacked\Pomodoro App.exe').LastWriteTime = Get-Date"

# 4. 运行 exe
# 位置: release\win-unpacked\Pomodoro App.exe
```

### 为什么不能跳过构建？

- `npm run build` 编译 TypeScript 和 React 代码到 `dist/` 目录
- Electron 应用运行时从 `release/win-unpacked/resources/app/dist/` 加载代码
- 不执行上述复制步骤，exe 仍然运行旧代码

## Build Commands

```bash
npm run build              # Full build (main + renderer)
npm run build:main         # Compile TypeScript in src/main/
npm run build:renderer     # Build React with Vite
npm run dev                # Development mode
npm run dev:clean          # Clean dev start
npm start                  # Launch Electron (requires build first)
npm run dist               # Build all platforms
npm run dist:win           # Windows installer
npm run dist:win -- --dir  # Build unpacked (no installer)
npm run clean              # Remove build artifacts
```

## Test Commands

**Vitest configured** - Automated testing framework:
```bash
npm run test              # Run all tests once
npm run test:watch        # Watch mode for development
```

## Project Structure

```
src/
├── main/                  # Electron main process
│   ├── index.ts          # App entry
│   ├── storage.ts        # JSON persistence
│   ├── timer.ts          # Timer logic
│   ├── tray.ts           # System tray
│   ├── shortcuts.ts      # Global shortcuts
│   ├── preload.ts        # IPC preload
│   ├── storage/          # Storage modules
│   │   ├── base-storage.ts
│   │   ├── tasks-storage.ts
│   │   ├── settings-storage.ts
│   │   ├── projects-storage.ts
│   │   ├── logs-storage.ts
│   │   ├── executions-storage.ts
│   │   ├── notes-storage.ts
│   │   └── migration.ts
│   ├── windows/          # Window managers
│   │   ├── main-window.ts
│   │   ├── break-window.ts
│   │   └── task-note-window.ts
│   └── utils/            # Utilities
│       └── display-manager.ts
├── renderer/             # React frontend
│   ├── components/       # UI components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskSelector.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── SettingsForm.tsx
│   │   ├── StatsChart.tsx
│   │   └── BreakOverlay.tsx
│   ├── pages/            # Page components
│   │   ├── TimerPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── DailyViewPage.tsx
│   │   ├── StatsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── TaskNotesPage.tsx
│   │   └── BreakPage.tsx
│   ├── stores/           # Zustand stores
│   │   ├── appStore.ts
│   │   ├── timerStore.ts
│   │   ├── settingsStore.ts
│   │   └── themeStore.ts
│   ├── utils/            # Utilities
│   │   └── export.ts
│   ├── main.tsx          # Entry
│   ├── App.tsx           # Root component
│   └── break.tsx         # Break window entry
├── shared/               # Shared types
│   └── types.ts
└── __tests__/            # Test files
```

## Code Style

### TypeScript
- **Target**: ES2020, strict mode enabled
- **Module**: ESNext (renderer), CommonJS (main)
- **Path Aliases**: `@/*` → `./src/*`, `@shared/*` → `./src/shared/*`

### Naming Conventions
- **Files**: kebab-case (`break-window.ts`, `display-manager.ts`)
- **Classes**: PascalCase (`PomodoroApp`, `BreakWindowManager`)
- **Components**: PascalCase (`TimerPage.tsx`, `ProjectForm.tsx`)
- **Stores**: camelCase with 'Store' suffix (`appStore.ts`)
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE (`IPC_CHANNELS`)
- **Booleans**: Prefix with `is`, `has`, `should` (`isLoading`, `hasError`)
- **Interfaces**: PascalCase (`Settings`, `TimerState`)

### Imports
```typescript
// Order: Node stdlib → external → internal
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { StorageManager } from './storage';
import { Settings } from '@shared/types';
import { useAppStore } from '../stores/appStore';
```

### Formatting
- **Indent**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes
- **Line length**: ≤100 characters
- **Trailing commas**: In objects/arrays (not function params)

### Types
- Prefer `interface` over `type` for objects
- Use `import type` for type-only imports
- Avoid `any`; use `unknown` or proper generics
- Store interfaces: `[Name]State` (e.g., `AppStoreState`)

### React
```typescript
// Functional components with typed props
interface TimerProps {
  time: number;
  isRunning: boolean;
}

function TimerDisplay({ time, isRunning }: TimerProps) {
  return <div>{time}s</div>;
}
```

### Error Handling
```typescript
try {
  const data = await storage.load();
  return data;
} catch (error) {
  console.error('Failed to load:', error);
  throw new Error(`Storage error: ${error instanceof Error ? error.message : 'Unknown'}`);
}
```

## Key Patterns

**Zustand Store**:
```typescript
interface StoreState {
  data: Type;
  setData: (data: Type) => void;
}

export const useStore = create<StoreState>((set) => ({
  data: initial,
  setData: (data) => set({ data }),
}));
```

**Electron Manager**:
```typescript
export class ManagerClass {
  private resource: ResourceType;
  
  create(): void { /* impl */ }
  destroy(): void { /* cleanup */ }
}
```

**IPC Communication**:
- Define channels in `src/shared/types.ts` as `IPC_CHANNELS`
- Use `contextBridge` in preload script
- Type the global `window.electronAPI` interface

## Dependencies

- **electron**: 28.1.0
- **react**: 18.2.0
- **react-router-dom**: 6.21.1
- **typescript**: 5.3.3
- **zustand**: 4.4.7
- **tailwindcss**: 3.4.0
- **lucide-react**: 0.303.0
- **recharts**: 2.10.3
- **vitest**: 1.1.0

## Notes

- **ESLint configured** (eslint, @typescript-eslint)
- **Vitest configured** for automated testing
- Uses Tailwind utility classes; use `dark:` prefix for dark mode
- Data stored as JSON in user data directory

## 📋 Documentation Maintenance

**IMPORTANT: Update BUTTONS_AND_FUNCTIONS.md After Any Feature Changes**

每次添加新功能、修改按钮或改变UI交互后，必须更新 `BUTTONS_AND_FUNCTIONS.md` 文件！

### 更新要求：

1. **新增按钮** → 在对应章节添加新按钮说明
2. **删除按钮** → 从文档中移除对应说明
3. **修改功能** → 更新按钮的功能描述
4. **新增页面** → 添加新章节

### 文档位置：
- `BUTTONS_AND_FUNCTIONS.md` - 包含所有按钮、功能说明和测试检查清单

### 示例：
```markdown
### 新增功能
| 按钮 | 功能 | 位置 |
|------|------|------|
| 新按钮 | 描述功能 | 文件位置 |
```
