# Task Plan - Pomodoro App 测试计划

## 目标
为 Pomodoro 应用构建全面的测试用例，涵盖所有功能和输入框场景。

## 项目概述

Electron + React + TypeScript 桌面番茄钟应用，支持：
- 番茄钟计时器 (25分钟工作 + 5分钟短休息 + 15分钟长休息)
- 项目与任务管理 (Flowkeeper 风格)
- 多显示器全屏休息窗口 (Stretchly 风格)
- 统计数据与图表
- 任务备注功能

## 测试框架

- **Vitest**: 测试运行器 (v1.1.0)
- **@testing-library/react**: React 组件测试
- **jsdom**: 浏览器环境模拟

## 测试文件结构

```
src/__tests__/
├── types.test.ts          # 类型测试 (已存在)
├── timer/
│   ├── timerStore.test.ts
│   └── timerManager.test.ts
├── stores/
│   ├── appStore.test.ts
│   └── settingsStore.test.ts
├── components/
│   ├── TaskForm.test.tsx
│   ├── ProjectForm.test.tsx
│   ├── SettingsForm.test.tsx
│   └── TimerControls.test.tsx
├── utils/
│   └── format.test.ts
└── integration/
    └── timer-flow.test.ts
```

## 功能模块与测试用例

### 1. 计时器核心功能 (Timer)

#### 1.1 计时器状态管理
- [ ] `useTimerStore` - 初始状态 (idle, 25分钟)
- [ ] `useTimerStore` - 开始计时后状态变为 running
- [ ] `useTimerStore` - 暂停后状态变为 paused
- [ ] `useTimerStore` - 恢复后状态变为 running
- [ ] `useTimerStore` - 停止后状态重置为 idle
- [ ] `useTimerStore` - 阶段切换 (work → short_break → long_break)

#### 1.2 计时器格式化
- [ ] `getFormattedTime` - 正确格式化分:秒 (25:00, 05:30, 00:00)
- [ ] `getProgress` - 正确计算进度百分比

#### 1.3 计时器阶段
- [ ] 工作阶段 (work) - 25分钟 (默认)
- [ ] 短休息阶段 (short_break) - 5分钟 (默认)
- [ ] 长休息阶段 (long_break) - 15分钟 (默认, 每4个番茄钟后)
- [ ] 空闲阶段 (idle)

#### 1.4 计时器控制
- [ ] 开始计时 (start)
- [ ] 暂停计时 (pause)
- [ ] 恢复计时 (resume)
- [ ] 停止计时 (stop)
- [ ] 跳过当前阶段 (skip)
- [ ] 手动完成 (complete)

### 2. 项目管理 (Projects)

#### 2.1 创建项目
- [ ] 创建新项目 - 名称必填验证
- [ ] 创建新项目 - 默认颜色 (红色 #ef4444)
- [ ] 创建新项目 - 自定义颜色 (20种预设颜色)
- [ ] 创建新项目 - 状态默认为 active
- [ ] 创建新项目 - 生成唯一 ID
- [ ] 创建新项目 - 记录创建时间

#### 2.2 编辑项目
- [ ] 编辑项目名称
- [ ] 编辑项目颜色

#### 2.3 删除项目
- [ ] 删除项目 - 同时删除关联任务
- [ ] 删除项目 - 从列表中移除

#### 2.4 完成项目
- [ ] 标记项目为 completed
- [ ] 记录完成时间 completedAt

### 3. 任务管理 (Tasks)

#### 3.1 创建任务
- [ ] 创建任务 - 名称必填验证
- [ ] 创建任务 - 项目必选验证
- [ ] 创建任务 - 预估番茄钟数 (默认1)
- [ ] 创建任务 - 四象限优先级选择:
  - [ ] 重要且紧急 (isImportant=true, isUrgent=true)
  - [ ] 重要不紧急 (isImportant=true, isUrgent=false)
  - [ ] 紧急不重要 (isImportant=false, isUrgent=true)
  - [ ] 不重要不紧急 (isImportant=false, isUrgent=false)
- [ ] 创建任务 - 默认状态为 active
- [ ] 创建任务 - 默认 completedPomodoros 为 0
- [ ] 创建任务 - 默认 plannedDates 为空数组
- [ ] 创建任务 - 默认 workDates 为空数组

#### 3.2 编辑任务
- [ ] 编辑任务名称
- [ ] 编辑任务项目
- [ ] 编辑预估番茄钟数
- [ ] 编辑四象限优先级
- [ ] 编辑执行日期:
  - [ ] 添加执行日期
  - [ ] 移除执行日期
  - [ ] 执行日期排序

#### 3.3 删除任务
- [ ] 删除任务 - 从列表中移除
- [ ] 删除任务 - 验证相关日志保留

#### 3.4 完成任务
- [ ] 标记任务为 completed
- [ ] 记录完成时间 completedAt

#### 3.5 任务筛选
- [ ] 按项目筛选 (getTasksByProject)
- [ ] 按状态筛选 (active/completed)
- [ ] 按日期筛选 (getTasksByDate)
- [ ] 今日计划任务 (getTodayPlannedTasks)

### 4. 设置功能 (Settings)

#### 4.1 时长设置
- [ ] 专注时长 - 范围 1-60 分钟, 默认25
- [ ] 短休息时长 - 范围 1-30 分钟, 默认5
- [ ] 长休息时长 - 范围 1-60 分钟, 默认15
- [ ] 长休息间隔 - 范围 1-10 个, 默认4

#### 4.2 行为设置
- [ ] 自动开始番茄钟 (autoStartPomodoros)
- [ ] 开机自动启动 (autoStartEnabled)
- [ ] 严格模式 (strictMode)

#### 4.3 通知设置
- [ ] 启用声音提醒 (soundEnabled)
- [ ] 启用桌面通知 (notificationEnabled)

#### 4.4 外观设置
- [ ] 浅色主题 (theme: 'light')
- [ ] 深色主题 (theme: 'dark')
- [ ] 跟随系统主题 (theme: 'system')
- [ ] 主题色选择 (accentColor: 默认 #ef4444)

#### 4.5 快捷键显示 (只读)
- [ ] 显示开始/暂停快捷键 (默认 CommandOrControl+Shift+P)
- [ ] 显示跳过阶段快捷键 (默认 CommandOrControl+Shift+S)
- [ ] 显示显示窗口快捷键 (默认 CommandOrControl+Shift+O)
- [ ] 显示结束休息快捷键 (默认 CommandOrControl+X)
- [ ] 显示推迟休息快捷键 (默认 CommandOrControl+P)

#### 4.6 休息窗口设置
- [ ] 全屏休息 (fullscreenBreak: 默认 true)
- [ ] 多显示器休息 (allScreensBreak: 默认 true)
- [ ] 休息窗口宽度 (breakWindowWidth: 默认 0.85)
- [ ] 休息窗口高度 (breakWindowHeight: 默认 0.85)
- [ ] 休息窗口透明度 (breakOpacity: 默认 0.95)
- [ ] 透明模式 (transparentMode: 默认 false)
- [ ] 严格模式 (breakStrictMode: 默认 false)
- [ ] 可跳过时间百分比 (skipDelayPercent: 默认 30)
- [ ] 推迟功能开关 (postponeEnabled: 默认 true)
- [ ] 推迟时长 (postponeMinutes: 默认 2)
- [ ] 推迟次数限制 (postponeLimit: 默认 1)
- [ ] 可推迟时间百分比 (postponeDelayPercent: 默认 30)

#### 4.7 设置操作
- [ ] 保存设置
- [ ] 重置为默认设置

### 5. 休息窗口 (Break Window)

#### 5.1 休息倒计时
- [ ] 显示剩余时间 (分:秒格式)
- [ ] 显示进度条
- [ ] 短休息/长休息区分
- [ ] 倒计时归零自动完成

#### 5.2 推迟功能
- [ ] 休息前30%时间可推迟
- [ ] 超过30%时间不可推迟按钮
- [ ] 推迟次数限制 (默认1次)
- [ ] 推迟后恢复倒计时
- [ ] 推迟计时显示

#### 5.3 跳过功能
- [ ] 超过30%时间可跳过
- [ ] 严格模式禁止跳过
- [ ] 跳过快捷键

#### 5.4 严格模式
- [ ] 禁止关闭休息窗口
- [ ] 禁止跳过

### 6. 统计数据 (Stats)

#### 6.1 数据统计计算
- [ ] 总番茄钟数 (从任务计算)
- [ ] 总工作时长 (分钟)
- [ ] 已完成任务数
- [ ] 连续打卡天数计算

#### 6.2 日统计
- [ ] 按日期获取执行记录 (getDayExecutionsByDate)
- [ ] 日番茄钟数汇总
- [ ] 日工作时长汇总

#### 6.3 任务统计
- [ ] 按任务获取执行记录 (getDayExecutionsByTask)
- [ ] 任务番茄钟数追踪

### 7. 任务备注 (Task Notes)

#### 7.1 备注管理
- [ ] 创建任务备注
- [ ] 获取任务备注 (getTaskNoteByTask)
- [ ] 编辑备注内容
- [ ] 删除备注

#### 7.2 链接管理
- [ ] 添加链接 (标题 + URL)
- [ ] 编辑链接
- [ ] 删除链接
- [ ] 链接时间戳

### 8. 表单验证测试

#### 8.1 项目表单 (ProjectForm)
- [ ] 项目名称输入 - 必填
- [ ] 项目名称输入 - 不能为空字符串 (trim后)
- [ ] 颜色选择器 - 默认选中第一个颜色
- [ ] 颜色选择器 - 点击选择其他颜色
- [ ] 预览 - 实时显示项目名称和颜色
- [ ] 取消按钮 - 关闭弹窗
- [ ] 提交按钮 - 禁用状态 (名称为空时)
- [ ] 提交按钮 - 加载状态

#### 8.2 任务表单 (TaskForm)
- [ ] 任务名称输入 - 必填, 自动聚焦
- [ ] 任务名称输入 - 不能为空字符串
- [ ] 项目选择 - 必选
- [ ] 项目选择 - 可创建新项目
- [ ] 预估番茄钟数 - 预设按钮 (1,2,3,4,5,8)
- [ ] 预估番茄钟数 - 递增按钮 (+)
- [ ] 四象限优先级 - 四个选项可点击
- [ ] 执行日期 - 添加日期
- [ ] 执行日期 - 移除日期
- [ ] 取消按钮 - 关闭弹窗
- [ ] 提交按钮 - 禁用状态 (名称或项目为空时)

#### 8.3 设置表单 (SettingsForm)
- [ ] 专注时长输入 - 数字类型, 范围1-60
- [ ] 短休息时长输入 - 数字类型, 范围1-30
- [ ] 长休息时长输入 - 数字类型, 范围1-60
- [ ] 长休息间隔输入 - 数字类型, 范围1-10
- [ ] 复选框 - 自动开始番茄钟
- [ ] 复选框 - 开机自动启动
- [ ] 复选框 - 启用声音提醒
- [ ] 复选框 - 启用桌面通知
- [ ] 主题选择 - 三个选项 (浅色/深色/系统)
- [ ] 快捷键显示 - 只读
- [ ] 保存按钮 - 有更改时启用
- [ ] 保存按钮 - 无更改时禁用
- [ ] 恢复默认按钮 - 确认弹窗

### 9. 边界情况测试

#### 9.1 计时器边界
- [ ] 倒计时到 00:00 时正确触发完成
- [ ] 切换阶段时正确重置时间
- [ ] 番茄钟计数正确递增 (每完成一个work阶段)
- [ ] 长休息间隔正确 (每N个番茄钟)
- [ ] 推迟状态正确重置

#### 9.2 数据边界
- [ ] 空项目列表 - 显示空状态
- [ ] 空任务列表 - 显示空状态
- [ ] 无统计数据时显示0
- [ ] 无今日计划时显示空

#### 9.3 输入边界
- [ ] 超长项目名称处理
- [ ] 超长任务名称处理
- [ ] 日期格式验证 (YYYY-MM-DD)

#### 9.4 状态边界
- [ ] 已完成任务不能再次完成
- [ ] 已完成项目相关任务处理
- [ ] 删除项目时关联任务处理

## 实施计划

### Phase 1: 基础测试环境配置
- [ ] 配置 Vitest
- [ ] 配置 Testing Library
- [ ] 创建测试工具函数 (render, fireEvent 等)
- [ ] 创建测试数据工厂函数

### Phase 2: 类型和工具测试
- [ ] 测试类型定义正确性
- [ ] 测试时间格式化函数

### Phase 3: Store 单元测试
- [ ] 测试 appStore 状态管理
- [ ] 测试 timerStore 状态管理
- [ ] 测试 settingsStore 状态管理

### Phase 4: 组件测试
- [ ] 测试 TaskForm 组件
- [ ] 测试 ProjectForm 组件
- [ ] 测试 SettingsForm 组件
- [ ] 测试 TimerControls 组件

### Phase 5: 集成测试
- [ ] 测试番茄钟完整流程
- [ ] 测试项目-任务关联
- [ ] 测试统计数据计算

### Phase 6: E2E 测试 (可选)
- [ ] 使用 Playwright 测试完整用户流程

## 验收标准

- [ ] 所有测试用例通过
- [ ] 测试覆盖率 > 70%
- [ ] 无测试警告
- [ ] 快速测试执行 (< 30秒)
- [ ] 测试可通过 `npm run test` 运行
