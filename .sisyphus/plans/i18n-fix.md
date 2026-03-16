# i18n 修复与构建计划

## 问题分析

### 已识别的问题

1. **构建错误**: 缺少 `src/main/mail-watcher.ts` 模块
   - `index.ts` 导入但文件不存在
   - 需要创建 stub 实现

2. **i18n 问题**: `break.tsx` 未导入 i18n
   - 休息窗口是独立入口文件
   - 未导入 `./i18n` 导致翻译不工作

### i18n 功能现状

- ✅ i18next + react-i18next 已配置
- ✅ en.json 和 zh.json 翻译文件存在
- ✅ App.tsx 根据设置切换语言
- ✅ SettingsForm 有中英文切换按钮
- ❌ break.tsx 未导入 i18n

## 修复任务

### Task 1: 创建 mail-watcher stub

**文件**: `src/main/mail-watcher.ts`

```typescript
export interface MailWatcherConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  pollInterval: number;
}

export class MailWatcher {
  private isRunning: boolean = false;

  async start(config: MailWatcherConfig): Promise<void> {
    if (!config.enabled) return;
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
```

### Task 2: 修复 break.tsx i18n 导入

**文件**: `src/renderer/break.tsx`

在第 4 行后添加:
```typescript
import './i18n'
```

### Task 3: 构建并验证

```bash
npm run build
# 复制到 release
powershell -Command "Remove-Item -Path 'release\win-unpacked\resources\app\dist' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist' -Destination 'release\win-unpacked\resources\app\' -Recurse -Force"
```

## 验证步骤

1. 运行 exe
2. 检查主界面是否为中文 (默认)
3. 进入设置 → 语言 → 切换到 English
4. 确认界面翻译变化
5. 触发休息窗口，确认翻译正常
