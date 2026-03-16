---
name: pomodoro-tasks
description: Manage Pomodoro tasks through CLI. Use this skill to add, list, update, review, and delete tasks in the Pomodoro app. Supports AI task tracking with needs-human-review workflow.
user-invocable: true
allowed-tools: "Bash, Read"
metadata:
  version: "1.0.0"
  author: pomodoro-app
---

# Pomodoro Tasks Skill

Manage Pomodoro app tasks via CLI. This skill provides commands for task CRUD operations and AI task workflow management.

## Prerequisites

Before using this skill, ensure the CLI is built:

```bash
npm run build:cli
```

The CLI will be available at `dist/cli/index.js`.

## CLI Entry Point

```bash
node dist/cli/index.js <command> [options]
```

Or use npm script (if configured):

```bash
npm run cli -- <command> [options]
```

## Global Options

| Option | Description |
|--------|-------------|
| `--project-name <name>` | Project name for task operations |
| `--data-dir <path>` | Custom data directory path |

## Commands

### 1. Add Task

Add a new task to a project.

```bash
node dist/cli/index.js add "<task-title>" [options]
```

**Options:**

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--project <name>` | `-p` | Project name | Default project |
| `--estimated <number>` | `-e` | Estimated pomodoros | 1 |
| `--important` | `-i` | Mark as important | false |
| `--urgent` | `-u` | Mark as urgent | false |
| `--type <type>` | `-t` | Task type (ai, normal) | normal |
| `--status <status>` | `-s` | Task status | active |

**Examples:**

```bash
# Add normal task to default project
node dist/cli/index.js add "Complete feature X"

# Add AI task needing review
node dist/cli/index.js add "AI generated: Implement login flow" -t ai -s needs-human-review

# Add task to specific project
node dist/cli/index.js add "Fix bug #123" -p "My Project" -e 3

# Add important task
node dist/cli/index.js add "Critical security update" -i -u
```

### 2. List Tasks

List tasks with optional filters.

```bash
node dist/cli/index.js list [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--status <status>` | `-s` | Filter by status |
| `--project <name>` | `-p` | Filter by project name |
| `--project-id <id>` | | Filter by project ID |
| `--all` | `-a` | Show all tasks (default: active only) |

**Status values:** `active`, `completed`, `needs-human-review`

**Examples:**

```bash
# List active tasks (default)
node dist/cli/index.js list

# List all tasks including completed
node dist/cli/index.js list --all

# List tasks needing human review
node dist/cli/index.js list --status needs-human-review

# List tasks in specific project
node dist/cli/index.js list -p "My Project"

# List completed tasks
node dist/cli/index.js list --status completed
```

### 3. Review Task

Move a task from `needs-human-review` to `active` status. Used for AI-generated tasks that need human verification.

```bash
node dist/cli/index.js review <task-id>
```

**Examples:**

```bash
# Review a specific task
node dist/cli/index.js review abc123def456
```

### 4. Delete Task

Delete a task by ID.

```bash
node dist/cli/index.js delete <task-id> [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--force` | `-f` | Skip confirmation |

**Examples:**

```bash
# Delete with confirmation
node dist/cli/index.js delete abc123def456

# Delete without confirmation
node dist/cli/index.js delete abc123def456 --force
```

### 5. Task Status

Show detailed status of a specific task.

```bash
node dist/cli/index.js status <task-id>
```

## Project Detection

The CLI automatically detects the project in this order:

1. **Explicit project option**: `--project <name>` or `-p <name>`
2. **Global project option**: `--project-name <name>`
3. **Default project**: First active project, or first project in list

To find available projects:

```bash
# List all tasks with --all to see project names
node dist/cli/index.js list --all
```

## Task Workflows

### AI Task Workflow

For AI-generated tasks that need human review:

```bash
# 1. AI adds task with needs-human-review status
node dist/cli/index.js add "AI: Implement feature X" -t ai -s needs-human-review

# 2. Human reviews the task (verifies it's correct)
node dist/cli/index.js review <task-id>

# 3. Task is now active and can be worked on
```

### Normal Task Workflow

```bash
# Add task
node dist/cli/index.js add "Write documentation"

# Work on task, update status when done
node dist/cli/index.js add "Complete docs" -s completed
```

## Task Properties

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique task ID |
| title | string | Task title |
| projectId | string | Associated project ID |
| estimatedPomodoros | number | Estimated pomodoros |
| completedPomodoros | number | Completed pomodoros |
| status | string | active, completed, needs-human-review |
| taskType | string | ai, normal |
| isImportant | boolean | Important flag |
| isUrgent | boolean | Urgent flag |
| createdAt | string | ISO timestamp |
| workDates | string[] | Dates when worked |
| plannedDates | string[] | Planned work dates |

## Data Location

Default data directory:
- **Windows**: `%APPDATA%/pomodoro-app/`
- **Linux/macOS**: `~/.config/pomodoro-app/`

To use a custom data directory:

```bash
node dist/cli/index.js list --data-dir /path/to/data
```

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| Project not found | Check project name with `list --all` |
| Task not found | Verify task ID from `list` output |
| No projects found | Create a project in the Pomodoro app first |
| Invalid status/type | Use valid values: ai/normal, active/completed/needs-human-review |

## Bash Script Examples

For automation, use the full path:

```bash
# Add AI task
node dist/cli/index.js add "AI: Code review changes" -t ai

# List pending reviews
node dist/cli/index.js list --status needs-human-review

# Batch review (get IDs first)
IDS=$(node dist/cli/index.js list --status needs-human-review | grep -oE '[a-z0-9]{20,}')
for id in $IDS; do node dist/cli/index.js review $id; done
```
