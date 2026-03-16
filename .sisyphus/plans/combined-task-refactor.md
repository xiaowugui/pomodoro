# 移除专注任务 + 优化普通任务样式 + 增加测试

## TL;DR

> 移除"专注任务"类型(TaskType = 'ai' | 'normal')，普通任务改为橙色，并增加 TaskList 测试覆盖

**涉及文件**: 5 个文件
**预计工作量**: 中等

---

## Work Objectives

### Must Have
- [ ] 1. 修改 TaskType 定义 - 移除 'focus'
- [ ] 2. 修改 tasks-storage.ts - 清理 focus 相关逻辑
- [ ] 3. 修改 TaskForm.tsx - 移除专注任务按钮 + normal 改为橙色
- [ ] 4. 修改 TaskList.tsx - 移除 focus + normal 加橙色标签
- [ ] 5. 新增 TaskList.test.tsx - 测试覆盖

### Must NOT Have
- [ ] 不要删除已有数据中的 focus 任务

---

## TODOs

### Task 1: 修改 TaskType 类型定义
- **File**: `src/shared/types.ts:30`
- **Change**: `TaskType = 'ai' | 'focus' | 'normal'` → `TaskType = 'ai' | 'normal'`

### Task 2: 修改 tasks-storage.ts 存储层
- **File**: `src/main/storage/tasks-storage.ts`
- **Change**: 保留 getRegularTasks() - 它现在返回 focus + normal，移除后只返回 normal

### Task 3: 修改 TaskForm.tsx
- **File**: `src/renderer/components/TaskForm.tsx`
- **Change 1**: 移除"专注任务"按钮 (focus 选项)
- **Change 2**: 普通任务按钮改为橙色主题
  - 边框: border-orange-500
  - 背景: bg-orange-50 dark:bg-orange-900/20
  - 文字: text-orange-700 dark:text-orange-300
  - 图标: text-orange-500

### Task 4: 修改 TaskList.tsx
- **File**: `src/renderer/components/TaskList.tsx`
- **Change 1**: getTaskTypeInfo 移除 focus 分支
- **Change 2**: getTaskTypeInfo 为 normal 添加橙色标签
  - 颜色: bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300
  - 标签: '普通'
  - 图标: FileText
- **Change 3**: 类型过滤按钮移除 'focus' 选项

### Task 5: 新增 TaskList 测试
- **File**: `src/__tests__/components/TaskList.test.tsx`
- **Content**: 任务列表渲染、类型筛选、完成任务、删除任务、选择任务

---

## Verification

- [ ] npm run build 通过
- [ ] npm run test 通过
- [ ] TaskType 只有 'ai' 和 'normal'
- [ ] TaskForm 只有 AI任务 和 普通任务 两个选项（普通为橙色）
- [ ] TaskList 筛选只有 AI任务 和 普通任务 两个选项（普通显示橙色标签）
