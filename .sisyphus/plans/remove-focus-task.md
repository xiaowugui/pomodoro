# 移除专注任务类型工作计划

## TL;DR

> 移除"专注任务"类型，只保留 AI任务 和 普通任务 两种。同时去掉任务页面的"全部任务"筛选 Tab。

**涉及文件**: 4 个文件
**预计工作量**: 小
**风险**: 低

---

## Context

用户需求：
1. 移除 `focus` 任务类型
2. 任务类型只保留 `ai` 和 `normal` 两种
3. 任务页面去掉"全部任务" Tab

---

## Work Objectives

### Must Have
- [ ] 修改 TaskType 定义，移除 'focus'
- [ ] 修改 tasks-storage.ts 存储层逻辑
- [ ] 修改 TaskForm.tsx 移除专注任务选项按钮
- [ ] 修改 TaskList.tsx 移除类型过滤中的 focus

### Must NOT Have
- [ ] 不要删除已有数据中的 focus 任务（保留但视为普通任务）

---

## Execution Strategy

**顺序执行** - 4 个文件依次修改，无并行依赖

---

## TODOs

- [ ] 1. 修改 TaskType 类型定义

  **What to do**:
  - 修改 `src/shared/types.ts:30`
  - 从 `export type TaskType = 'ai' | 'focus' | 'normal';`
  - 改为 `export type TaskType = 'ai' | 'normal';`
  
  **References**:
  - `src/shared/types.ts:30` - TaskType 定义位置

- [ ] 2. 修改 tasks-storage.ts 存储层

  **What to do**:
  - 修改 `src/main/storage/tasks-storage.ts`
  - 第27行：默认值从 `'normal'` 保持不变（已经是 normal）
  - 第74-80行：移除 `getAiTasks()` 和 `getRegularTasks()` 方法（可选，若不再需要）
  - 第94行：创建任务时默认值保持 `'normal'`
  
  **References**:
  - `src/main/storage/tasks-storage.ts` - 存储层

- [ ] 3. 修改 TaskForm.tsx 任务表单

  **What to do**:
  - 修改 `src/renderer/components/TaskForm.tsx`
  - 移除第196-223行的"专注任务"按钮（focus 选项）
  - 只保留 AI任务 和 普通任务 两个按钮
  
  **References**:
  - `src/renderer/components/TaskForm.tsx:196-223` - 专注任务按钮

- [ ] 4. 修改 TaskList.tsx 任务列表

  **What to do**:
  - 修改 `src/renderer/components/TaskList.tsx`
  - 第53-62行：`getTaskTypeInfo` 函数中移除 focus 分支
  - 第114-126行：类型过滤按钮中移除 'focus' 选项
  
  **References**:
  - `src/renderer/components/TaskList.tsx:53-62` - 任务类型信息
  - `src/renderer/components/TaskList.tsx:114-126` - 过滤按钮

---

## Verification Strategy

**手动验证**:
1. 运行 `npm run build` 确认无编译错误
2. 启动应用 `npm start`
3. 创建新任务，验证只有 AI任务 和 普通任务 两个选项
4. 任务列表筛选，验证只有 AI任务 和 普通任务 两个选项

---

## Success Criteria

- [ ] 编译通过无错误
- [ ] TaskType 类型只有 'ai' 和 'normal'
- [ ] TaskForm 只有两个任务类型选项
- [ ] TaskList 筛选只有两个选项
- [ ] 现有数据中的 focus 任务保留但显示为普通
