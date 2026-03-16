# 优化普通任务样式并增加测试工作计划

## TL;DR

> 将普通任务的颜色从灰色改为橙色，并增加 TaskList 组件的测试覆盖

**修改文件**: 2 个 UI 文件
**新增测试**: TaskList 组件测试
**预计工作量**: 小

---

## Context

用户需求：
1. 普通任务颜色改为橙色（更好看）
2. 增加测试覆盖

---

## Work Objectives

### Must Have
- [ ] 修改 TaskForm.tsx - 普通任务按钮改为橙色主题
- [ ] 修改 TaskList.tsx - 普通任务显示橙色标签
- [ ] 新增 TaskList.test.tsx - 任务列表组件测试

### Must NOT Have
- [ ] 不要修改 AI 任务和专注任务的颜色

---

## Execution Strategy

**并行执行**:
- UI 修改（2个文件）- 可以依次进行
- 测试编写 - 独立进行

---

## TODOs

- [ ] 1. 修改 TaskForm.tsx 普通任务按钮颜色

  **What to do**:
  - 修改 `src/renderer/components/TaskForm.tsx`
  - 第224-237行：普通任务按钮从灰色改为橙色主题
  - 边框: `border-orange-500`
  - 背景: `bg-orange-50 dark:bg-orange-900/20`
  - 文字: `text-orange-700 dark:text-orange-300`
  - 图标: `text-orange-500`
  
  **References**:
  - `src/renderer/components/TaskForm.tsx:224-237` - 普通任务按钮位置

- [ ] 2. 修改 TaskList.tsx 普通任务标签颜色

  **What to do**:
  - 修改 `src/renderer/components/TaskList.tsx`
  - 第53-62行：`getTaskTypeInfo` 函数
  - 为 normal 类型添加橙色标签显示
  - 颜色: `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300`
  - 标签文字: '普通'
  - 图标: FileText
  
  **References**:
  - `src/renderer/components/TaskList.tsx:53-62` - 任务类型信息函数

- [ ] 3. 新增 TaskList 组件测试

  **What to do**:
  - 创建 `src/__tests__/components/TaskList.test.tsx`
  - 测试任务列表渲染
  - 测试任务类型筛选（AI任务、普通任务）
  - 测试任务完成功能
  - 测试任务删除功能
  - 测试任务选择功能
  
  **References**:
  - `src/__tests__/components/TaskForm.test.tsx` - 测试结构参考
  - `src/renderer/components/TaskList.tsx` - 待测试组件

---

## Verification Strategy

**测试验证**:
1. 运行 `npm run test` 确认所有测试通过
2. 手动验证 UI 颜色

---

## Success Criteria

- [ ] TaskForm 普通任务按钮显示橙色
- [ ] TaskList 普通任务显示橙色标签
- [ ] TaskList 测试文件创建并通过
- [ ] npm run test 全部通过
