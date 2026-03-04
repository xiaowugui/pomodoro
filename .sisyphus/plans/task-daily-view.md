# 任务按日视图功能开发计划

## TL;DR

> **快速 summary**: 为番茄钟应用添加按天视图功能，支持任务多日执行追踪、日历导航、任务延期、每日汇总报表。
> 
> **交付物**:
> - TaskDayExecution 数据模型 + 存储层 API
> - 新增 DailyViewPage 页面（日历+列表）
> - 任务延期功能（按钮+详情页修改）
> - 每日汇总报表组件
> - Vitest 测试框架 + TDD 测试用例
> 
> **预估工作量**: Medium
> **并行执行**: YES - 3 waves
> **关键路径**: 数据模型 → 存储层 → 前端页面 → 报表

---

## Context

### 原始需求
在现有番茄钟应用中添加按日视图功能：
1. 按天视图 - 决定今天需要做哪些任务
2. 历史记录 - 历史上每天完成了哪些任务  
3. 任务按日迁移 - 任务的执行日期增加一天
4. 汇总报表 - 查看每日的汇总数据

### 访谈总结
**关键讨论点**:
- 任务可以分布在好几天执行 → 需要 TaskDayExecution 追踪每日执行
- 视图形式：日历 + 列表 → 左侧日历导航，右侧任务列表
- 迁移操作：按钮点击延期 + 任务详情中修改日期
- UI布局：分开显示 "今日待办" 和 "今日已完成"
- 番茄钟自动记录：完成番茄钟时自动累积到当日执行记录

### 代码库结构
- `src/shared/types.ts` - 核心类型定义 (Project, Task, PomodoroLog, Settings)
- `src/main/storage.ts` - JSON 数据持久化 (StorageManager)
- `src/renderer/stores/appStore.ts` - Zustand 状态管理
- `src/renderer/pages/TasksPage.tsx` - 任务页面
- `src/renderer/components/TaskList.tsx` - 任务列表组件
- `src/renderer/App.tsx` - 路由配置

### 测试基础设施
- 项目当前无测试框架
- 需要设置 Vitest

---

## Work Objectives

### 核心目标
为番茄钟应用添加完整的按日任务管理视图，支持任务多日执行追踪、日历导航、任务延期操作和每日数据汇总。

### 具体交付物

#### 1. 数据模型扩展
- [ ] TaskDayExecution 接口定义
- [ ] Task 接口扩展 workDates 字段

#### 2. 存储层 (src/main/storage.ts)
- [ ] TaskDayExecution CRUD API
- [ ] Task 更新时同步 workDates

#### 3. 前端状态管理 (src/renderer/stores/appStore.ts)
- [ ] loadDayExecutions 方法
- [ ] createDayExecution 方法
- [ ] updateDayExecution 方法
- [ ] getTasksByDate 方法
- [ ] getDailySummary 方法

#### 4. 番茄钟完成时自动记录
- [ ] timerStore 完成番茄钟时触发记录
- [ ] 自动创建/更新 TaskDayExecution

#### 5. 按日视图页面
- [ ] DailyViewPage 页面组件
- [ ] Calendar 月历组件
- [ ] DayTaskList 任务列表组件
- [ ] TodaySection (待办)
- [ ] CompletedSection (已完成)

#### 6. 任务延期功能
- [ ] 任务操作菜单"延期一天"按钮
- [ ] 任务详情页日期编辑

#### 7. 每日汇总报表
- [ ] DailySummaryCard 组件
- [ ] 任务数、番茄钟数、时间统计
- [ ] 按项目分组展示

#### 8. 测试基础设施
- [ ] Vitest 配置
- [ ] 测试脚本添加到 package.json
- [ ] 基础测试用例

### 完成定义
- [ ] 用户可以在日历上选择日期查看任务
- [ ] 今日待办和今日已完成分开显示
- [ ] 番茄钟完成后自动记录到当日执行
- [ ] 可以通过按钮延期任务一天
- [ ] 可以在任务详情中修改执行日期
- [ ] 每日汇总正确显示统计数据
- [ ] 所有核心功能有测试覆盖

### Must Have
- TaskDayExecution 数据持久化
- 日历导航功能
- 今日待办/已完成 分区显示
- 番茄钟自动记录
- 延期功能

### Must NOT Have
- 不修改现有 StatsPage（新建独立报表）
- 不修改番茄钟计时器核心逻辑
- 不支持任务跨项目迁移（仅日期）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (will be set up)
- **Automated tests**: YES - TDD
- **Framework**: Vitest
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
证据 saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (bun/node REPL) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun/node REPL) — Import, call functions, compare output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + data model):
├── Task 1: 数据模型 - TaskDayExecution 接口定义 [quick]
├── Task 2: 数据模型 - Task 扩展 workDates [quick]
├── Task 3: 存储层 - TaskDayExecution CRUD API [quick]
├── Task 4: 测试框架 - Vitest 配置 [quick]
└── Task 5: 番茄钟完成时自动记录逻辑 [quick]

Wave 2 (After Wave 1 — core UI, MAX PARALLEL):
├── Task 6: 前端状态 - DayExecution 相关方法 [quick]
├── Task 7: DailyViewPage 页面骨架 [visual-engineering]
├── Task 8: Calendar 月历组件 [visual-engineering]
├── Task 9: DayTaskList 任务列表组件 [visual-engineering]
├── Task 10: 延期功能 - 按钮操作 [visual-engineering]
└── Task 11: 延期功能 - 详情页编辑 [visual-engineering]

Wave 3 (After Wave 2 — integration + reports):
├── Task 12: 每日汇总报表组件 [visual-engineering]
├── Task 13: 路由配置 - 新页面接入 [quick]
├── Task 14: 集成测试 [deep]
└── Task 15: 边角测试 [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan Compliance Audit [oracle]
├── Task F2: Code Quality Review [unspecified-high]
├── Task F3: Real Manual QA [unspecified-high]
└── Task F4: Scope Fidelity Check [deep]
```

### Dependency Matrix
- **1-5**: — — 6-11, 1
- **6**: 3 — 7-15, 2
- **7**: 6 — 12, 3
- **8**: 1, 6 — 12, 2
- **9**: 1, 6 — 12, 3
- **10**: 1, 6 — 14, 2
- **11**: 1, 6 — 14, 2
- **12**: 8, 9 — 15, 3
- **13**: 7 — 14, 2
- **14**: 10, 11, 12, 13 — 15, 3

### Agent Dispatch Summary
- **1**: **5** — T1-T3 → `quick`, T4 → `quick`, T5 → `quick`
- **2**: **6** — T6 → `quick`, T7 → `visual-engineering`, T8 → `visual-engineering`, T9 → `visual-engineering`, T10 → `visual-engineering`, T11 → `visual-engineering`
- **3**: **4** — T12 → `visual-engineering`, T13 → `quick`, T14 → `deep`, T15 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [ ] 1. 数据模型 - TaskDayExecution 接口定义

  **What to do**:
  - 在 `src/shared/types.ts` 添加 TaskDayExecution 接口
  - 字段: id, taskId, date (YYYY-MM-DD), pomodorosCompleted, minutesWorked, createdAt
  - 导出新接口

  **Must NOT do**:
  - 不修改现有的 Task 接口定义

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯类型定义，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: [Tasks 6-11]
  - **Blocked By**: None

  **References**:
  - `src/shared/types.ts` - 现有类型定义位置

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test file created: src/__tests__/types.test.ts
  - [ ] npm test → PASS

  **QA Scenarios**:

  ```
  Scenario: TaskDayExecution 接口定义正确
    Tool: Bash
    Preconditions: 无
    Steps:
      1. 读取 src/shared/types.ts
      2. 验证 TaskDayExecution 接口存在
      3. 验证字段完整: id, taskId, date, pomodorosCompleted, minutesWorked, createdAt
    Expected Result: 接口定义存在且字段完整
    Evidence: .sisyphus/evidence/task-1-interface-check.txt
  ```

  **Commit**: YES
  - Message: `feat(types): add TaskDayExecution interface`
  - Files: `src/shared/types.ts`

---

- [ ] 2. 数据模型 - Task 扩展 workDates

  **What to do**:
  - 在 `src/shared/types.ts` Task 接口添加 workDates 字段
  - 类型: string[] (日期字符串数组 YYYY-MM-DD)
  - 初始化为 []

  **Must NOT do**:
  - 不修改现有 Task 字段

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯类型定义，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: [Tasks 6-11]
  - **Blocked By**: None

  **References**:
  - `src/shared/types.ts` - 现有 Task 接口位置

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test file: src/__tests__/task-extended.test.ts
  - [ ] npm test → PASS

  **QA Scenarios**:

  ```
  Scenario: Task 接口扩展 workDates 字段
    Tool: Bash
    Preconditions: 无
    Steps:
      1. 读取 src/shared/types.ts
      2. 验证 Task 接口包含 workDates 字段
      3. 验证类型为 string[]
    Expected Result: Task.workDates 存在且类型正确
    Evidence: .sisyphus/evidence/task-2-workdates-check.txt
  ```

  **Commit**: YES
  - Message: `feat(types): extend Task with workDates field`
  - Files: `src/shared/types.ts`

---

- [ ] 3. 存储层 - TaskDayExecution CRUD API

  **What to do**:
  - 在 `src/main/storage.ts` 添加 TaskDayExecution 存储逻辑
  - 添加 dayExecutions 字段到 AppState
  - 实现: getDayExecutions(), createDayExecution(), updateDayExecution(), deleteDayExecution()
  - 实现: getDayExecutionByDate(), getDayExecutionByTask()

  **Must NOT do**:
  - 不修改现有的 tasks/logs 存储逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 存储层 CRUD 逻辑，模式固定
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: [Task 6]
  - **Blocked By**: None

  **References**:
  - `src/main/storage.ts` - 现有存储实现
  - 现有 createTask/updateTask 方法模式

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test file: src/__tests__/storage-day-execution.test.ts
  - [ ] npm test → PASS

  **QA Scenarios**:

  ```
  Scenario: TaskDayExecution CRUD 功能正常
    Tool: interactive_bash
    Preconditions: npm run build:main 已执行
    Steps:
      1. 启动应用 (npm run dev)
      2. 创建一个任务
      3. 手动调用 createDayExecution 创建执行记录
      4. 调用 getDayExecutionByDate 获取当日记录
      5. 验证记录存在且字段正确
    Expected Result: CRUD 操作成功，数据持久化
    Evidence: .sisyphus/evidence/task-3-storage-crud.txt
  ```

  **Commit**: YES
  - Message: `feat(storage): add TaskDayExecution CRUD operations`
  - Files: `src/main/storage.ts`

---

- [ ] 4. 测试框架 - Vitest 配置

  **What to do**:
  - 添加 vitest 依赖到 package.json devDependencies
  - 创建 vitest.config.ts 配置文件
  - 添加 test 和 test:watch 脚本到 package.json
  - 创建示例测试文件验证配置

  **Must NOT do**:
  - 不修改现有代码逻辑

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置类任务，步骤固定
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: [All subsequent test tasks]
  - **Blocked By**: None

  **References**:
  - package.json - 现有依赖配置

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] vitest.config.ts 存在
  - [ ] npm test 命令可执行
  - [ ] 示例测试通过

  **QA Scenarios**:

  ```
  Scenario: Vitest 测试框架配置成功
    Tool: Bash
    Preconditions: 无
    Steps:
      1. 检查 vitest.config.ts 文件存在
      2. 检查 package.json 包含 test 脚本
      3. 执行 npm test
      4. 验证测试运行（可失败但需执行）
    Expected Result: 测试框架可运行
    Evidence: .sisyphus/evidence/task-4-vitest-setup.txt
  ```

  **Commit**: YES
  - Message: `test: setup vitest framework`
  - Files: `package.json`, `vitest.config.ts`

---

- [ ] 5. 番茄钟完成时自动记录逻辑

  **What to do**:
  - 修改番茄钟完成逻辑，当完成一个 work pomodoro 时自动记录/更新 TaskDayExecution
  - 如果当日记录已存在，则累加 pomodoros 和 minutes
  - 如果不存在，则创建新记录
  - 同时更新 Task.workDates 添加当日日期

  **Must NOT do**:
  - 不修改番茄钟计时器核心逻辑（仅在完成时 hook）
  - 不修改 short_break / long_break 记录逻辑

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解现有 timerStore 和 storage 的集成点
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: [Task 14 - integration test]
  - **Blocked By**: None

  **References**:
  - `src/renderer/stores/timerStore.ts` - 番茄钟状态管理
  - `src/main/storage.ts` - 存储层

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 完成番茄钟后 TaskDayExecution 记录创建
  - [ ] Test: 完成番茄钟后 Task.workDates 更新

  **QA Scenarios**:

  ```
  Scenario: 番茄钟完成后自动记录执行
    Tool: interactive_bash
    Preconditions: npm run build 已执行
    Steps:
      1. 启动应用
      2. 创建一个任务
      3. 开始番茄钟并完成一个 work session
      4. 查询 TaskDayExecution 表
      5. 验证存在当日记录且 pomodorosCompleted = 1
      6. 查询 Task.workDates
      7. 验证包含当日日期
    Expected Result: 自动记录创建成功
    Evidence: .sisyphus/evidence/task-5-auto-record.txt
  ```

  **Commit**: YES
  - Message: `feat(timer): auto-record task execution on pomodoro complete`
  - Files: `src/renderer/stores/timerStore.ts`

---

- [ ] 6. 前端状态 - DayExecution 相关方法

  **What to do**:
  - 在 `src/renderer/stores/appStore.ts` 添加 DayExecution 相关方法
  - loadDayExecutions(), createDayExecution(), updateDayExecution()
  - getTasksByDate(date) - 获取指定日期关联的任务
  - getDailySummary(date) - 获取指定日期的汇总数据

  **Must NOT do**:
  - 不修改现有的 tasks/logs 相关方法

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 状态管理方法，模式固定
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-11)
  - **Blocks**: [Tasks 7-11]
  - **Blocked By**: [Task 3]

  **References**:
  - `src/renderer/stores/appStore.ts` - 现有状态管理
  - `src/main/storage.ts` - 存储层 API

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: getTasksByDate 返回正确任务
  - [ ] Test: getDailySummary 返回正确汇总

  **QA Scenarios**:

  ```
  Scenario: DayExecution 状态管理方法正常
    Tool: interactive_bash
    Preconditions: 前端已构建
    Steps:
      1. 调用 getTasksByDate('2024-01-15')
      2. 验证返回数组
      3. 调用 getDailySummary('2024-01-15')
      4. 验证返回包含任务数、番茄钟数等字段
    Expected Result: 方法返回正确数据
    Evidence: .sisyphus/evidence/task-6-store-methods.txt
  ```

  **Commit**: YES
  - Message: `feat(store): add DayExecution state management methods`
  - Files: `src/renderer/stores/appStore.ts`

---

- [ ] 7. DailyViewPage 页面骨架

  **What to do**:
  - 创建 `src/renderer/pages/DailyViewPage.tsx`
  - 基础布局：左侧日历导航 + 右侧任务列表
  - 状态管理：当前选中日期、加载状态

  **Must NOT do**:
  - 不修改其他现有页面

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 页面组件开发，需要 UI 技能
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8-11)
  - **Blocks**: [Task 13]
  - **Blocked By**: [Task 6]

  **References**:
  - `src/renderer/pages/TasksPage.tsx` - 现有页面布局参考
  - `src/renderer/components/Layout.tsx` - 布局组件

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 页面渲染无错误

  **QA Scenarios**:

  ```
  Scenario: DailyViewPage 页面渲染
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 导航到 /daily 路由
      2. 等待页面加载
      3. 验证左侧日历区域存在
      4. 验证右侧任务列表区域存在
      5. 截图保存
    Expected Result: 页面正确渲染
    Evidence: .sisyphus/evidence/task-7-page-skeleton.png
  ```

  **Commit**: YES
  - Message: `feat(ui): create DailyViewPage skeleton`
  - Files: `src/renderer/pages/DailyViewPage.tsx`

---

- [ ] 8. Calendar 月历组件

  **What to do**:
  - 创建 `src/renderer/components/Calendar.tsx`
  - 显示当前月份日历网格
  - 高亮显示：今日、有任务执行的日期
  - 点击日期切换选中状态
  - 支持上月/下月导航

  **Must NOT do**:
  - 不实现任务列表部分

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 组件开发
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9-11)
  - **Blocks**: [Task 12, 14]
  - **Blocked By**: [Task 1, 6]

  **References**:
  - `src/renderer/pages/StatsPage.tsx` - 可能有日历参考

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 日历渲染正确天数
  - [ ] Test: 点击日期触发回调

  **QA Scenarios**:

  ```
  Scenario: Calendar 组件功能正常
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 导航到 /daily
      2. 验证日历网格显示
      3. 点击当月任意日期
      4. 验证选中状态变化
      5. 点击"下月"按钮
      6. 验证月份切换
    Expected Result: 日历交互正常
    Evidence: .sisyphus/evidence/task-8-calendar.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add Calendar month view component`
  - Files: `src/renderer/components/Calendar.tsx`

---

- [ ] 9. DayTaskList 任务列表组件

  **What to do**:
  - 创建 `src/renderer/components/DayTaskList.tsx`
  - 接收 selectedDate 作为 props
  - 分为两个区块：今日待办 / 今日已完成
  - 使用现有的 TaskList 样式
  - 显示任务番茄钟进度

  **Must NOT do**:
  - 不修改现有 TaskList 组件

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 组件开发
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-8, 10, 11)
  - **Blocks**: [Task 12, 14]
  - **Blocked By**: [Task 1, 6]

  **References**:
  - `src/renderer/components/TaskList.tsx` - 现有列表样式参考
  - `src/renderer/components/TaskForm.tsx` - 表单参考

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 待办列表正确显示
  - [ ] Test: 已完成列表正确显示

  **QA Scenarios**:

  ```
  Scenario: DayTaskList 显示正确
    Tool: playwright
    Preconditions: npm run dev 运行中，已有测试数据
    Steps:
      1. 导航到 /daily
      2. 选择今日日期
      3. 验证"今日待办"区块存在
      4. 验证"今日已完成"区块存在
      5. 验证任务番茄钟数显示
    Expected Result: 列表正确分区显示
    Evidence: .sisyphus/evidence/task-9-tasklist.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add DayTaskList component with sections`
  - Files: `src/renderer/components/DayTaskList.tsx`

---

- [ ] 10. 延期功能 - 按钮操作

  **What to do**:
  - 在 DayTaskList 的任务操作菜单添加"延期一天"按钮
  - 点击后调用 API 将任务延期到明天
  - 更新 TaskDayExecution 的日期

  **Must NOT do**:
  - 不修改其他任务操作

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 交互开发
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-9, 11)
  - **Blocks**: [Task 14]
  - **Blocked By**: [Task 1, 6]

  **References**:
  - `src/renderer/components/TaskList.tsx` - 操作菜单参考

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 延期按钮存在
  - [ ] Test: 点击延期后日期更新

  **QA Scenarios**:

  ```
  Scenario: 延期按钮功能正常
    Tool: playwright
    Preconditions: npm run dev 运行中，已有今日待办任务
    Steps:
      1. 导航到 /daily
      2. 找到待办任务的操作菜单
      3. 点击"延期一天"按钮
      4. 验证任务从今日待办消失
      5. 选择明日日期
      6. 验证任务出现在明日待办中
    Expected Result: 延期成功
    Evidence: .sisyphus/evidence/task-10-defer.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add defer task by one day button`
  - Files: `src/renderer/components/DayTaskList.tsx`

---

- [ ] 11. 延期功能 - 详情页编辑

  **What to do**:
  - 扩展 TaskForm 添加"执行日期"编辑功能
  - 显示当前关联的日期列表
  - 支持添加/删除日期

  **Must NOT do**:
  - 不修改任务其他字段的编辑逻辑

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 表单开发
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-10)
  - **Blocks**: [Task 14]
  - **Blocked By**: [Task 1, 6]

  **References**:
  - `src/renderer/components/TaskForm.tsx` - 现有表单

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 日期编辑字段存在
  - [ ] Test: 保存后日期更新

  **QA Scenarios**:

  ```
  Scenario: 任务详情页日期编辑功能
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 导航到 /daily
      2. 点击任务进入编辑
      3. 验证"执行日期"字段存在
      4. 添加一个新日期
      5. 保存任务
      6. 验证任务出现在新日期下
    Expected Result: 日期编辑保存成功
    Evidence: .sisyphus/evidence/task-11-date-edit.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add task date editing in TaskForm`
  - Files: `src/renderer/components/TaskForm.tsx`

---

- [ ] 12. 每日汇总报表组件

  **What to do**:
  - 创建 `src/renderer/components/DailySummaryCard.tsx`
  - 显示：完成任务数、完成番茄钟数、专注时间
  - 按项目分组显示统计
  - 选中日期时显示在页面顶部

  **Must NOT do**:
  - 不修改现有的 StatsPage

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 报表组件开发
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-15)
  - **Blocks**: [Task 14]
  - **Blocked By**: [Tasks 8, 9]

  **References**:
  - `src/renderer/pages/StatsPage.tsx` - 统计卡片参考

  **Acceptance Criteria**:

  **If TDD (tests enabled)**:
  - [ ] Test: 汇总数据正确计算

  **QA Scenarios**:

  ```
  Scenario: 每日汇总报表显示正确
    Tool: playwright
    Preconditions: npm run dev 运行中，已有历史数据
    Steps:
      1. 导航到 /daily
      2. 选择有数据的日期
      3. 验证汇总卡片显示
      4. 验证完成任务数正确
      5. 验证番茄钟数正确
      6. 验证时间正确
    Expected Result: 汇总数据准确
    Evidence: .sisyphus/evidence/task-12-summary.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add daily summary card component`
  - Files: `src/renderer/components/DailySummaryCard.tsx`

---

- [ ] 13. 路由配置 - 新页面接入

  **What to do**:
  - 在路由配置中添加 /daily 路由
  - 导航栏添加"按日视图"入口

  **Must NOT do**:
  - 不修改现有路由

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置类任务
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14, 15)
  - **Blocks**: [Task 14]
  - **Blocked By**: [Task 7]

  **References**:
  - `src/renderer/App.tsx` - 路由配置

  **Acceptance Criteria**:
  - [ ] /daily 路由可访问
  - [ ] 导航栏有入口

  **QA Scenarios**:

  ```
  Scenario: 路由配置正确
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 直接访问 /daily
      2. 验证页面加载
      3. 从导航进入
      4. 验证入口存在
    Expected Result: 路由正常
    Evidence: .sisyphus/evidence/task-13-routing.txt
  ```

  **Commit**: YES
  - Message: `feat(routing): add daily view route`
  - Files: `src/renderer/App.tsx`

---

- [ ] 14. 集成测试

  **What to do**:
  - 完整流程测试：创建任务 → 开始番茄钟 → 完成 → 验证记录
  - 日期切换测试：延期任务 → 验证日期变化
  - 报表测试：验证汇总数据正确

  **Must NOT do**:
  - 不测试外部系统

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 集成测试需要完整理解系统
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 15)
  - **Blocks**: [Final Verification]
  - **Blocked By**: [Tasks 5, 10, 11, 12, 13]

  **References**:
  - All previous tasks

  **Acceptance Criteria**:
  - [ ] 完整流程测试通过
  - [ ] 日期功能测试通过
  - [ ] 报表测试通过

  **QA Scenarios**:

  ```
  Scenario: 完整集成测试
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 创建新任务
      2. 验证出现在今日待办
      3. 完成番茄钟
      4. 验证执行记录创建
      5. 延期任务
      6. 验证任务迁移
      7. 查看汇总报表
    Expected Result: 全流程正常
    Evidence: .sisyphus/evidence/task-14-integration.txt
  ```

  **Commit**: YES
  - Message: `test: add integration tests for daily view`
  - Files: `src/__tests__/daily-view-integration.test.ts`

---

- [ ] 15. 边角测试

  **What to do**:
  - 空日期测试：无任务时的显示
  - 跨月任务测试：任务在不同月份显示
  - 时区处理测试
  - 数据一致性测试

  **Must NOT do**:
  - 不测试正常流程

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 边界情况测试
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (with Tasks 12, 13, 14)
  - **Blocks**: [Final Verification]
  - **Blocked By**: [Tasks 8, 9, 12]

  **References**:
  - All boundary conditions

  **Acceptance Criteria**:
  - [ ] 边界测试用例通过

  **QA Scenarios**:

  ```
  Scenario: 边界情况测试
    Tool: playwright
    Preconditions: npm run dev 运行中
    Steps:
      1. 选择无任务日期
      2. 验证显示"暂无任务"
      3. 跨月选择有任务的日期
      4. 验证正确显示
    Expected Result: 边界情况处理正确
    Evidence: .sisyphus/evidence/task-15-edge-cases.txt
  ```

  **Commit**: YES
  - Message: `test: add edge case tests`
  - Files: `src/__tests__/daily-view-edge.test.ts`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `feat(types): add TaskDayExecution interface` — types.ts
- **2**: `feat(types): extend Task with workDates field` — types.ts
- **3**: `feat(storage): add TaskDayExecution CRUD operations` — storage.ts
- **4**: `test: setup vitest framework` — package.json, vitest.config.ts
- **5**: `feat(timer): auto-record task execution on pomodoro complete` — timerStore.ts
- **6**: `feat(store): add DayExecution state management methods` — appStore.ts
- **7**: `feat(ui): create DailyViewPage skeleton` — DailyViewPage.tsx
- **8**: `feat(ui): add Calendar month view component` — Calendar.tsx
- **9**: `feat(ui): add DayTaskList component with sections` — DayTaskList.tsx
- **10**: `feat(ui): add defer task by one day button` — DayTaskList.tsx
- **11**: `feat(ui): add task date editing in TaskForm` — TaskForm.tsx
- **12**: `feat(ui): add daily summary card component` — DailySummaryCard.tsx
- **13**: `feat(routing): add daily view route` — App.tsx
- **14**: `test: add integration tests for daily view` — integration test file
- **15**: `test: add edge case tests` — edge test file

---

## Success Criteria

### Verification Commands
```bash
npm run build              # Expected: success
npm test                  # Expected: all tests pass
npm run dev               # Expected: app runs
```

### Final Checklist
- [ ] 所有 "Must Have" 已实现
- [ ] 所有 "Must NOT Have" 已排除
- [ ] 所有测试通过
- [ ] 日历视图可正常切换日期
- [ ] 待办/已完成正确分区显示
- [ ] 番茄钟自动记录功能正常
- [ ] 延期功能正常
- [ ] 汇总报表数据正确
