# Pomodoro App - AI Agent 操作指南

本文档为 AI Agent 提供如何操作 Pomodoro 应用中的任务(Task)和任务备注(TaskNote)的完整指南。

## 数据存储位置

所有数据以 JSON 格式存储在用户数据目录：
- Windows: `%APPDATA%/Pomodoro/data.json`
- macOS: `~/Library/Application Support/Pomodoro/data.json`

## 数据模型

### Task (任务)
```typescript
interface Task {
  id: string;                    // 唯一标识符 (格式: "时间戳-随机字符串")
  title: string;                 // 任务标题
  projectId: string;             // 所属项目ID
  estimatedPomodoros: number;    // 预估番茄钟数
  completedPomodoros: number;   // 已完成番茄钟数
  status: 'active' | 'completed'; // 任务状态
  createdAt: string;             // 创建时间 (ISO 8601)
  completedAt?: string;          // 完成时间 (ISO 8601)
  workDates: string[];           // 执行过的日期列表 (YYYY-MM-DD)
  plannedDates: string[];        // 计划执行日期 (YYYY-MM-DD)
  isImportant: boolean;         // 是否重要
  isUrgent: boolean;            // 是否紧急
}
```

### TaskNote (任务备注)
```typescript
interface TaskLink {
  id: string;                    // 链接唯一标识符
  title: string;                 // 链接标题
  url: string;                   // 链接地址
  createdAt: string;             // 创建时间
}

interface TaskNote {
  id: string;                    // 备注唯一标识符
  taskId: string;                // 关联的任务ID
  content: string;              // 备注文本内容
  links: TaskLink[];            // 关联链接列表
  createdAt: string;             // 创建时间
  updatedAt: string;             // 最后更新时间
}
```

### Project (项目)
```typescript
interface Project {
  id: string;
  name: string;
  color: string;                 // 颜色代码 (如: "#ef4444")
  createdAt: string;
}
```

## IPC 通道 (供 AI Agent 使用)

### 任务操作 (Task CRUD)

| 操作 | IPC Channel | 参数 | 返回值 |
|------|------------|------|--------|
| 获取所有任务 | `get-tasks` | 无 | `Task[]` |
| 获取单个任务 | `get-tasks` | 无 (需过滤) | `Task[]` |
| 创建任务 | `create-task` | `Omit<Task, 'id' | 'createdAt'>` | `Task` |
| 更新任务 | `update-task` | `Task` | `Task` |
| 删除任务 | `delete-task` | `taskId: string` | `boolean` |

### 项目操作 (Project CRUD)

| 操作 | IPC Channel | 参数 | 返回值 |
|------|------------|------|--------|
| 获取所有项目 | `get-projects` | 无 | `Project[]` |
| 创建项目 | `create-project` | `Omit<Project, 'id' | 'createdAt'>` | `Project` |
| 更新项目 | `update-project` | `Project` | `Project` |
| 删除项目 | `delete-project` | `projectId: string` | `boolean` |

### 任务备注操作 (TaskNote CRUD)

| 操作 | IPC Channel | 参数 | 返回值 |
|------|------------|------|--------|
| 获取所有备注 | `get-task-notes` | 无 | `TaskNote[]` |
| 按任务获取备注 | `get-task-note-by-task` | `taskId: string` | `TaskNote \| undefined` |
| 创建任务备注 | `create-task-note` | `taskId: string` | `TaskNote` |
| 更新任务备注 | `update-task-note` | `TaskNote` | `TaskNote` |
| 删除任务备注 | `delete-task-note` | `noteId: string` | `boolean` |

### 任务链接操作 (TaskLink CRUD)

| 操作 | IPC Channel | 参数 | 返回值 |
|------|------------|------|--------|
| 添加链接 | `add-task-link` | `noteId: string, Omit<TaskLink, 'id' \| 'createdAt'>` | `TaskLink` |
| 更新链接 | `update-task-link` | `noteId: string, TaskLink` | `TaskLink` |
| 删除链接 | `delete-task-link` | `noteId: string, linkId: string` | `boolean` |

## AI Agent 使用示例

### 通过 Electron IPC 调用

```javascript
// 获取所有任务
const tasks = await window.electronAPI.getTasks();

// 获取所有项目
const projects = await window.electronAPI.getProjects();

// 创建新任务
const newTask = await window.electronAPI.createTask({
  title: "学习 TypeScript",
  projectId: "项目ID",
  estimatedPomodoros: 5,
  completedPomodoros: 0,
  status: "active",
  workDates: [],
  plannedDates: [],
  isImportant: true,
  isUrgent: false
});

// 更新任务
const updatedTask = await window.electronAPI.updateTask({
  ...existingTask,
  completedPomodoros: existingTask.completedPomodoros + 1
});

// 删除任务
await window.electronAPI.deleteTask("任务ID");

// 获取任务备注
const note = await window.electronAPI.getTaskNoteByTask("任务ID");

// 创建任务备注 (如果不存在)
if (!note) {
  await window.electronAPI.createTaskNote("任务ID");
}

// 更新备注内容
await window.electronAPI.updateTaskNote({
  id: "备注ID",
  taskId: "任务ID",
  content: "这是任务的详细备注...",
  links: [],
  createdAt: "...",
  updatedAt: new Date().toISOString()
});

// 添加链接
await window.electronAPI.addTaskLink("备注ID", {
  title: "TypeScript 文档",
  url: "https://www.typescriptlang.org/docs/"
});

// 删除链接
await window.electronAPI.deleteTaskLink("备注ID", "链接ID");
```

### 直接修改 JSON 文件

如果需要批量操作或离线处理，可以直接修改 `data.json`:

```json
{
  "projects": [...],
  "tasks": [
    {
      "id": "1700000000000-abc123",
      "title": "新任务",
      "projectId": "项目ID",
      "estimatedPomodoros": 3,
      "completedPomodoros": 0,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "workDates": [],
      "plannedDates": [],
      "isImportant": false,
      "isUrgent": false
    }
  ],
  "taskNotes": [
    {
      "id": "笔记ID",
      "taskId": "任务ID",
      "content": "笔记内容",
      "links": [
        {
          "id": "链接ID",
          "title": "链接标题",
          "url": "https://example.com",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "logs": [],
  "dayExecutions": []
}
```

## 常用操作场景

### 1. 创建完整的任务流程
```javascript
// 1. 创建项目 (如果不存在)
const project = await window.electronAPI.createProject({
  name: "学习项目",
  color: "#3b82f6"
});

// 2. 创建任务
const task = await window.electronAPI.createTask({
  title: "学习 React Hooks",
  projectId: project.id,
  estimatedPomodoros: 4,
  completedPomodoros: 0,
  status: "active",
  workDates: [],
  plannedDates: ["2024-01-15"],
  isImportant: true,
  isUrgent: false
});

// 3. 创建任务备注
const note = await window.electronAPI.createTaskNote(task.id);

// 4. 添加学习资料链接
await window.electronAPI.addTaskLink(note.id, {
  title: "React Hooks 文档",
  url: "https://react.dev/reference/react"
});
```

### 2. 更新任务进度
```javascript
const tasks = await window.electronAPI.getTasks();
const task = tasks.find(t => t.title === "学习 React Hooks");

await window.electronAPI.updateTask({
  ...task,
  completedPomodoros: task.completedPomodoros + 1
});
```

### 3. 完成任务
```javascript
const tasks = await window.electronAPI.getTasks();
const task = tasks.find(t => t.title === "学习 React Hooks");

await window.electronAPI.updateTask({
  ...task,
  status: "completed",
  completedAt: new Date().toISOString()
});
```

### 4. 搜索和筛选
```javascript
// 获取所有进行中的任务
const activeTasks = (await window.electronAPI.getTasks())
  .filter(t => t.status === 'active');

// 获取特定项目的任务
const projectTasks = (await window.electronAPI.getTasks())
  .filter(t => t.projectId === "项目ID");

// 获取重要的任务
const importantTasks = (await window.electronAPI.getTasks())
  .filter(t => t.isImportant);
```

## 注意事项

1. **ID 生成**: 不要手动创建 ID，使用系统生成的格式 (`时间戳-随机字符串`)
2. **时间格式**: 使用 ISO 8601 格式 (`new Date().toISOString()`)
3. **删除级联**: 删除任务时，关联的日志和备注也会被自动删除
4. **数据备份**: 批量操作前建议备份 `data.json`
5. **自动保存**: 所有通过 IPC 的操作会自动保存到文件

## 文件路径

- 主进程代码: `src/main/storage.ts`
- IPC 处理: `src/main/index.ts`
- 类型定义: `src/shared/types.ts`
- 渲染进程调用: `src/main/preload.ts`
