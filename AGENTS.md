# AGENTS.md - Coding Guidelines

**Pomodoro App** - Electron + React + TypeScript desktop timer with multi-screen breaks.

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

## Build & Run Workflow (Development)

每次代码修改后重新构建并运行的方法：

```bash
# 1. 构建代码
npm run build

# 2. 复制 dist 到 release (保留之前的 unpacked 构建)
powershell -Command "Remove-Item -Path 'release\win-unpacked\resources\app\dist' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist' -Destination 'release\win-unpacked\resources\app\' -Recurse -Force"

# 3. 运行 exe
# 直接运行 release\win-unpacked\Pomodoro App.exe
```

**注意**: `npm run dist:win` 会尝试下载代码签名工具，可能失败。使用上述手动复制方式更可靠。

**exe 位置**: `release\win-unpacked\Pomodoro App.exe`

## Test Commands

**No test framework configured.** Manual test files exist:
```bash
# Requires: npm run build:main first
node test-simple.js
node test-break-window.js
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
│   └── windows/          # Window managers
│       ├── main-window.ts
│       └── break-window.ts
├── renderer/             # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Page components
│   ├── stores/           # Zustand stores
│   └── main.tsx          # Entry
└── shared/               # Shared types
    └── types.ts
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
- **typescript**: 5.3.3
- **zustand**: 4.4.7
- **tailwindcss**: 3.4.0
- **lucide-react**: 0.303.0
- **recharts**: 2.10.3

## Notes

- No ESLint config present (can be added)
- No automated test runner (Jest/Vitest not configured)
- Uses Tailwind utility classes; use `dark:` prefix for dark mode
- Data stored as JSON in user data directory
