# 番茄钟任务提示功能强化计划

## TL;DR

> **快速摘要**: 为番茄钟添加任务类型分类（AI任务/专注任务），休息结束时弹窗显示可发起的AI任务，以及空闲检测（自动暂停+弹窗提醒+记录空闲时间）
> 
> **交付物**:
> - Task 模型添加 taskType 字段
> - 任务创建/编辑 UI 支持类型选择
> - 任务列表显示类型标签
> - **计时页面双列表**：常规任务（计时）+ AI 任务（手动勾选状态）
> - 任务选择器过滤 AI 任务
> - **IdleLog 历史记录页面**（按任务查看空闲历史）
> - 休息结束弹窗显示 AI 任务（按优先级：未完成 → 未发起）
> - 空闲检测模块（**只在工作阶段**）：
>   - 5分钟无操作 → 自动暂停 + 弹窗提醒 + 记录空闲时间
>   - 锁屏 → 仅自动暂停 + 记录空闲时间（不弹窗）
> 
> **估计工作量**: Medium
> **并行执行**: YES - 3 waves (16 tasks)
> **执行模式**: planning-with-files（业务+测试分开执行）
> **质量要求**: 代码简洁优雅，测试通过为止
> **关键路径**: Task 扩展 → UI 修改 → 休息弹窗 → 空闲检测

---

## Context

### 原始需求
用户想要强化番茄钟的任务提示功能来赋能AI协同开发任务，具体包括：
1. 记录和区分 AI 任务（需要发起/已经发起的AI后台任务）和专注任务（需要专心投入的工作）
2. 每次休息结束后弹窗去发起可以发起的AI任务再专心处理番茄钟
3. 检测到用户摸鱼或离开位置时弹窗提醒查看AI任务

### 访谈总结
**关键讨论**:
- 任务分类选择：**扩展现有 Task 模型**，添加 `taskType: 'ai' | 'focus' | 'normal'` 字段
- 空闲检测方式：**简单空闲检测**（5分钟无鼠标/键盘操作）
- 功能范围：**完整功能**

**技术约束**:
- 无单元测试框架，使用 Agent QA 验证
- 需要复用现有 BreakWindow 组件
- 需要添加 Settings 配置项

### Metis 审查
由于 Metis 超时，我将基于现有分析进行规划：
- 假设 TaskForm 和 TaskList 可直接修改
- 假设 BreakWindow 可复用于 AI 任务弹窗
- 需要确保不破坏现有功能

---

## Work Objectives

### 核心目标
1. 在 Task 模型中添加任务类型字段
2. 区分计时行为：
   - **常规任务**（taskType='focus' 或 'normal'）：正常计时
   - **AI任务**（taskType='ai'）：不计入番茄钟计时，只显示状态
3. 计时页面显示两个列表：
   - 常规任务列表：可选择并启动计时器
   - AI任务列表：只标记运行中/已完成状态
4. 休息结束时显示 AI 任务弹窗
5. 空闲检测模块：
   - 5分钟无操作 → 自动暂停倒计时 + 弹窗提醒"可能开始摸鱼了" + 记录空闲时间
   - 锁屏 → 仅自动暂停倒计时 + 记录空闲时间（不弹窗）

### 具体交付物
- [ ] Task 接口扩展 (taskType 字段)
- [ ] IdleLog 接口（记录空闲时间，关联 taskId）
- [ ] Settings 添加空闲检测配置
- [ ] TaskForm 添加类型选择器
- [ ] TaskSelector 显示类型标签 + 过滤 AI 任务（计时器只用常规任务）
- [ ] TaskList 显示类型标签/筛选
- [ ] TimerPage 添加 AI 任务列表（只标记状态，手动勾选）
- [ ] IdleLog 历史记录页面（按任务查看空闲历史）
- [ ] 休息结束 AI 任务弹窗（按优先级排序）
- [ ] 空闲检测模块（只在工作阶段触发）
- [ ] IPC 通道扩展

### 定义完成
- [ ] 用户可以创建/编辑 AI 类型和专注类型的任务
- [ ] 任务列表可以按类型筛选
- [ ] 计时页面显示两个列表：
  - 常规任务列表：可选择并启动番茄钟计时
  - AI 任务列表：复用现有状态（运行中/未发起/已完成），不计时
- [ ] TaskSelector 过滤 AI 任务（计时器只用常规任务）
- [ ] IdleLog 历史记录页面（按任务显示空闲历史）
- [ ] 休息结束显示 AI 任务弹窗（按优先级：运行中 → 未发起，不显示已完成）
- [ ] 空闲检测只在工作阶段触发
- [ ] 5分钟无操作自动暂停倒计时 + 弹窗提醒
- [ ] 锁屏自动暂停倒计时（不弹窗）
- [ ] 空闲时间被记录到 IdleLog（关联 taskId 或 "no-task"）

### Must Have
- Task 模型 taskType 字段
- IdleLog 接口和存储（taskId 可为 "no-task"）
- 任务类型选择 UI
- 计时页面双列表（常规任务计时 + AI 任务复用现有状态）
- 任务选择器过滤 AI 任务
- IdleLog 历史记录页面（按任务查看）
- 休息结束 AI 任务弹窗（按优先级排序）
- 空闲检测：只在工作阶段触发
  - 无操作：自动暂停 + 弹窗提醒 + 记录
  - 锁屏：仅自动暂停 + 记录（不弹窗）

### Must NOT Have (Guardrails)
- 不修改现有的番茄计时器核心逻辑
- 不破坏现有的数据存储格式（向后兼容）
- 不添加摄像头/人脸检测
- 不添加复杂的 AI 任务管理（仅标记和查看）

---

## Verification Strategy

### 测试决策
- **测试基础设施**: NO (无 Vitest 配置文件)
- **自动化测试**: NO
- **验证方式**: Agent QA - 每个任务包含手动测试场景
- **执行模式**: planning-with-files（业务代码 + 测试代码分开执行）
- **质量要求**: 代码简洁优雅，不断修正直到测试通过

### QA 策略
每个任务必须包含 Agent 执行的 QA 场景：
- 使用 Bash 运行构建命令验证编译
- 使用 Playwright 验证 UI 交互
- 使用 interactive_bash 测试窗口行为
- 业务代码和测试代码分开 agent 执行

---

## Execution Strategy

### 并行执行 Wave

```
Wave 1 (核心扩展 - 基础):
├── T1: 扩展 Task 接口 + Settings + IdleLog (taskType 字段 + 空闲检测配置 + IdleLog 接口)
├── T2: 更新 TasksStorage CRUD + IdleLog Storage (taskType 支持 + IdleLog 存储)
├── T3: 更新 IPC 通道 (支持 taskType 查询 + IdleLog 操作)
└── T4: 创建空闲检测模块 (主进程 - 检测+自动暂停+弹窗+记录)

Wave 2 (UI 修改 - 最大并行):
├── T5: TaskForm 添加类型选择器 (依赖 T1)
├── T6: TaskSelector 显示类型标签 + 过滤 AI 任务 (依赖 T1, T3)
├── T7: TaskList 添加类型筛选 (依赖 T1, T3)
├── T8: TasksPage 添加类型视图 (依赖 T5, T6, T7)
├── T9: TimerPage 添加 AI 任务列表 (依赖 T1, T3)
├── T10: SettingsPage 添加空闲检测设置 (依赖 T1)
└── T11: IdleLog 历史记录页面 (依赖 T2, T3)

Wave 3 (功能集成):
├── T12: 休息结束 AI 任务弹窗 (依赖 T1, T3) - 可提前完成
├── T13: 空闲检测触发弹窗 (依赖 T4, T10) - 自动暂停+弹窗+记录
├── T14: 集成测试 - 任务创建/编辑流程
├── T15: 集成测试 - 休息弹窗流程
└── T16: 集成测试 - 空闲检测流程
```

### 依赖矩阵
- **T1**: — — T2, T3, T4, T5, T6, T7, T8, T9, T10
- **T2**: T1 — T3, T11
- **T3**: T1, T2 — T6, T7, T8, T9, T12
- **T4**: T1, T2 — T13
- **T5**: T1 — T8
- **T6**: T1, T3 — T8
- **T7**: T1, T3 — T8
- **T8**: T1, T5, T6, T7 — 
- **T9**: T1, T3 — 
- **T10**: T1 — T13
- **T11**: T2, T3 —
- **T12**: T1, T3 — T15
- **T13**: T4, T10 — T16
- **T14**: T8 —
- **T15**: T12 —
- **T16**: T13 —

### Agent 调度总结
- **Wave 1**: 4 tasks → `deep` (T1, T2), `unspecified-high` (T3), `quick` (T4)
- **Wave 2**: 7 tasks → `visual-engineering` (T5, T6), `visual-engineering` (T7), `unspecified-high` (T8, T9, T10, T11)
- **Wave 3**: 5 tasks → `deep` (T12, T13), `unspecified-high` (T14, T15, T16)

---

## TODOs

- [ ] 1. 扩展 Task 接口 + Settings + IdleLog

  **What to do**:
  - 在 `src/shared/types.ts` 的 Task 接口添加 `taskType: 'ai' | 'focus' | 'normal'` 字段，默认值为 `'normal'`
  - **AI 任务状态复用现有字段**：
    - `status: 'active' | 'completed'` - 是否完成
    - `completedPomodoros > 0` - 运行中
  - 新增 IdleLog 接口：`id, taskId: string | 'no-task', startTime, endTime, durationMinutes, reason`
  - **taskId 可选**：当前有任务则记录任务 ID，无任务则记录 `'no-task'`
  - 在 Settings 接口添加空闲检测配置：`idleDetectionEnabled: boolean`, `idleThresholdMinutes: number`（默认5）
  - 更新 defaultSettings 添加默认空闲检测配置
  - 更新 AppState 包含 idleLogs
  
  **Must NOT do**:
  - 不删除现有字段，保持向后兼容
  - 不修改 Task 接口的其他字段

  **References**:
  - `src/shared/types.ts:30-44` - 现有 Task 接口定义
  - `src/shared/types.ts:69-114` - Settings 接口定义

- [ ] 2. 更新 TasksStorage CRUD + IdleLog Storage

  **What to do**:
  - 在 `src/main/storage/tasks-storage.ts` 确保支持 taskType 字段的创建和读取
  - 确保向后兼容旧数据（无 taskType 默认为 'normal'）
  - 创建 `idle-logs-storage.ts` 模块处理 IdleLog 的 CRUD 操作
  - 添加查询方法：按日期范围查询、按任务查询
  
  **References**:
  - `src/main/storage/tasks-storage.ts` - 任务存储模块
  - `src/main/storage/` - 存储模块目录结构

- [ ] 3. 更新 IPC 通道

  **What to do**:
  - 在需要时添加新的 IPC 通道支持 taskType 查询（如获取 AI 任务列表）
  
  **References**:
  - `src/shared/types.ts:196-211` - 现有任务 IPC 通道

- [ ] 4. 创建空闲检测模块

  **What to do**:
  - 在 `src/main/` 创建 `idle-detector.ts` 模块
  - 使用 Electron `powerMonitor` 监听锁屏/解锁事件
  - 使用定时器检测鼠标/键盘活动状态
  - **只在工作阶段触发**（phase === 'work'），休息阶段不检测
  - **触发逻辑区分**：
    - **无操作超过5分钟**（仅工作阶段）：
      1. 调用 Timer 暂停当前倒计时
      2. 记录空闲开始时间和当前任务 ID（无任务则记录 `'no-task'`）
      3. 触发弹窗提醒"可能开始摸鱼了"
    - **锁屏**（仅工作阶段）：
      1. 调用 Timer 暂停当前倒计时
      2. 记录空闲开始时间和当前任务 ID（无任务则记录 `'no-task'`）
      3. **不弹窗**（用户可能只是离开）
  - 检测到恢复操作时：
    1. 记录空闲结束时间和持续时长
    2. 保存 IdleLog 到存储（记录 reason: 'idle' 或 'locked'，关联 taskId 或 'no-task'）
  - 在主进程集成空闲检测
  
  **References**:
  - `src/main/index.ts` - 主进程结构参考，powerMonitor 使用
  - `src/main/timer.ts` - 事件模式参考，timer.pause() 调用
  - `src/main/storage.ts` - 存储模块参考

- [ ] 5. TaskForm 添加类型选择器

  **What to do**:
  - 在 `src/renderer/components/TaskForm.tsx` 添加任务类型选择器
  - 使用单选按钮或下拉菜单：AI任务 / 专注任务 / 普通任务
  - 默认选择 "普通任务"
  
  **References**:
  - `src/renderer/components/TaskForm.tsx` - 现有表单结构

- [ ] 6. TaskSelector 显示类型标签 + 过滤 AI 任务

  **What to do**:
  - 在 `src/renderer/components/TaskSelector.tsx` 显示任务类型标签
  - AI任务显示特殊图标或颜色标记
  - **关键**：TaskSelector 只显示常规任务（taskType='focus' 或 'normal'），**过滤掉 AI 任务**
  - 因为 AI 任务不参与番茄钟计时
  
  **References**:
  - `src/renderer/components/TaskSelector.tsx` - 任务选择器组件

- [ ] 7. TaskList 添加类型筛选

  **What to do**:
  - 在 `src/renderer/components/TaskList.tsx` 添加按类型筛选功能
  - 在任务项显示类型标签
  
  **References**:
  - `src/renderer/components/TaskList.tsx` - 任务列表组件

- [ ] 8. TasksPage 类型视图

  **What to do**:
  - 在 `src/renderer/pages/TasksPage.tsx` 添加任务类型视图
  - 可按 AI任务/专注任务/全部 筛选
  
  **References**:
  - `src/renderer/pages/TasksPage.tsx` - 任务页面

- [ ] 9. TimerPage 添加 AI 任务列表

  **What to do**:
  - 在 `src/renderer/pages/TimerPage.tsx` 的计时器旁边添加 AI 任务区域
  - 显示所有 AI 类型任务（taskType='ai'）
  - **复用现有任务状态**：
    - `status = 'active'` 且 `completedPomodoros = 0`：**未发起**
    - `status = 'active'` 且 `completedPomodoros > 0`：**运行中**（自动判断）
    - `status = 'completed'`：**已完成**
  - 用户可手动勾选切换已完成状态
  - **不参与番茄钟计时**（不显示倒计时）
  - 列表排序：运行中 → 未发起 → 已完成（不显示）
  - 与常规任务列表分开显示
  
  **References**:
  - `src/renderer/pages/TimerPage.tsx` - 计时器页面
  - `src/shared/types.ts:30-44` - Task 接口（status, completedPomodoros）

- [ ] 10. SettingsPage 空闲检测设置

  **What to do**:
  - 在 `src/renderer/pages/SettingsPage.tsx` 添加空闲检测设置
  - 启用/禁用开关 + 阈值滑块（1-15分钟）
  
  **References**:
  - `src/renderer/pages/SettingsPage.tsx` - 设置页面

- [ ] 11. IdleLog 历史记录页面

  **What to do**:
  - 在 TasksPage 或新建页面添加空闲历史记录视图
  - 按任务显示空闲历史：每个任务的 IdleLog 列表
  - 显示：开始时间、结束时间、持续时长、原因（idle/locked）
  - 支持按日期筛选
  - 入口：可在 TasksPage 添加"空闲历史"入口
  
  **References**:
  - `src/renderer/pages/TasksPage.tsx` - 任务页面
  - `src/main/storage/` - 存储模块

- [ ] 12. 休息结束 AI 任务弹窗

  **What to do**:
  - 复用或扩展 BreakWindow 组件
  - 休息结束时显示待处理的 AI 任务列表
  - **排序优先级**（复用现有状态字段）：
    - 运行中：`status='active'` 且 `completedPomodoros > 0`
    - 未发起：`status='active'` 且 `completedPomodoros = 0`
    - 已完成：`status='completed'`（不显示）
  - 用户可勾选标记为已完成
  - "确认" 按钮关闭弹窗并开始专注工作
  
  **References**:
  - `src/main/windows/break-window.ts` - 休息窗口管理器
  - `src/renderer/pages/BreakPage.tsx` - 休息页面
  - `src/shared/types.ts` - Task status, completedPomodoros

- [ ] 13. 空闲检测触发弹窗（区分无操作/锁屏）

  **What to do**:
  - 集成空闲检测模块到主进程
  - **无操作触发**（5分钟无鼠标/键盘）：
    1. 计时器已自动暂停（T4 完成）
    2. 显示弹窗提醒"检测到您已空闲，可能开始摸鱼了"
    3. 弹窗选项："继续工作" / "结束番茄钟"
  - **锁屏触发**：
    1. 计时器自动暂停
    2. **不弹窗**（用户可能只是离开座位）
  - 用户恢复操作后记录 IdleLog（reason: 'idle' 或 'locked'）
  
  **QA Scenarios**:
  - 模拟 5 分钟无操作：
    1. 观察计时器是否自动暂停
    2. 观察弹窗是否显示"可能开始摸鱼了"
    3. 点击"继续工作"，检查 IdleLog 是否被记录（reason='idle'）
  - 模拟锁屏：
    1. 观察计时器是否自动暂停
    2. 确认**不弹窗**
    3. 解锁后检查 IdleLog 是否被记录（reason='locked'）
  
  **References**:
  - `src/main/index.ts` - 主进程集成

- [ ] 14. 集成测试 - 任务创建/编辑

  **What to do**:
  - 测试创建 AI 类型任务
  - 测试创建专注类型任务
  - 测试编辑任务类型
  - 测试类型筛选功能
  
  **QA Scenarios**:
  - 创建任务时选择 "AI任务"，保存后刷新页面，类型保持
  - 创建任务时选择 "专注任务"，保存后刷新页面，类型保持

- [ ] 15. 集成测试 - 休息弹窗

  **What to do**:
  - 测试休息结束显示 AI 任务弹窗
  - 测试勾选 AI 任务功能
  - 测试确认按钮关闭弹窗
  
  **QA Scenarios**:
  - 手动触发休息结束，观察弹窗是否显示 AI 任务列表

- [ ] 16. 集成测试 - 空闲检测

  **What to do**:
  - 测试 5 分钟无操作后触发提醒
  - 测试自动暂停功能是否生效
  - 测试 IdleLog 是否被正确记录
  - 测试启用/禁用开关
  
  **QA Scenarios**:
  - 停止鼠标/键盘操作 5 分钟，观察：
    1. 计时器是否自动暂停
    2. 是否显示"可能开始摸鱼"的弹窗
    3. 点击"继续工作"后 IdleLog 是否被记录（包含开始时间、结束时间、持续时长）
  - 测试锁屏/解锁场景

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit`. Review all changed files for: `as any`, empty catches, console.log in prod, commented-out code, unused imports.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` + `playwright` skill
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep).
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(task): add taskType field to Task model` - types.ts, storage
- **Wave 2**: `feat(ui): add task type selector to forms and lists` - TaskForm, TaskSelector, TaskList
- **Wave 3**: `feat(break): add AI task check popup on break end` - break-window.ts
- **Wave 4**: `feat(idle): add idle detection module` - idle-detector.ts

---

## Success Criteria

### Verification Commands
```bash
npm run build:main  # 编译通过
npm run build:renderer  # 编译通过
```

### Final Checklist
- [ ] Task 接口包含 taskType 字段
- [ ] IdleLog 接口和存储模块完整（taskId 可为 "no-task"）
- [ ] TaskForm 可选择任务类型
- [ ] TaskList 显示类型标签
- [ ] TimerPage 显示两个列表：常规任务（计时）+ AI 任务（复用现有状态：运行中/未发起/已完成）
- [ ] TaskSelector 过滤 AI 任务（计时器只用常规任务）
- [ ] IdleLog 历史记录页面（按任务查看空闲历史）
- [ ] 休息结束显示 AI 任务弹窗（按优先级：运行中 → 未发起，不显示已完成）
- [ ] 空闲检测只在工作阶段触发
- [ ] 5分钟无操作自动暂停倒计时 + 弹窗提醒
- [ ] 锁屏自动暂停倒计时（不弹窗）
- [ ] 空闲时间被记录到 IdleLog（关联 taskId 或 "no-task"）
- [ ] 所有构建通过
