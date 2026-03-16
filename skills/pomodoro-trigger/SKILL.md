---
name: pomodoro-trigger
description: Send trigger emails to control Pomodoro app on remote machines. Uses nodemailer to send command emails that the mail watcher on the target machine processes.
user-invocable: true
allowed-tools: "Bash, Write"
metadata:
  version: "1.0.0"
  author: pomodoro-app
---

# Pomodoro Trigger Skill

Send remote commands to a Pomodoro app via email. The target machine runs a mail watcher that processes incoming emails with `[Pomodoro]` subject prefix.

## Prerequisites

1. Install nodemailer:
```bash
npm install nodemailer
```

2. Configure SMTP settings (see Configuration section)

3. Target machine must have mail watcher configured to listen for emails

## Configuration

SMTP configuration is read from environment variables or a config file.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP port (default: 587) | No |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |
| `SMTP_FROM` | Sender email address | Yes |
| `POMODORO_TARGET_EMAIL` | Target email address | Yes |

### Config File (Optional)

Create `pomodoro-trigger.config.json` in the skill directory:

```json
{
  "smtp": {
    "host": "smtp.example.com",
    "port": 587,
    "user": "your-email@example.com",
    "pass": "your-password",
    "from": "your-email@example.com"
  },
  "targetEmail": "pomodoro@remote-machine.com"
}
```

## Email Format

Commands are sent via email subject line:

```
Subject: [Pomodoro] <command> <args>
```

The body is ignored - all commands are in the subject line.

## Commands

### 1. Add Task

Add a new task to a project on the remote machine.

**Format:**
```
[Pomodoro] add "<task-title>" --project=<project-name>
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--project=<name>` | Project name | default project |
| `--estimated=<n>` | Estimated pomodoros | 1 |
| `--important` | Mark as important | false |
| `--urgent` | Mark as urgent | false |

**Examples:**

```bash
# Add task to default project
pomodoro-trigger add "Implement login feature"

# Add task to specific project
pomodoro-trigger add "Fix bug #123" --project="My Project"

# Add important task
pomodoro-trigger add "Critical security update" --important

# Add task with estimated pomodoros
pomodoro-trigger add "Write documentation" --estimated=3
```

### 2. Review Task

Move a task from `needs-human-review` to `active` status.

**Format:**
```
[Pomodoro] review <task-id>
```

**Examples:**

```bash
pomodoro-trigger review abc123def456
```

### 3. Task Status

Update the status of a specific task.

**Format:**
```
[Pomodoro] status <task-id> <status>
```

**Status values:** `active`, `completed`, `needs-human-review`

**Examples:**

```bash
# Mark task as completed
pomodoro-trigger status abc123def456 completed

# Mark task as needs review
pomodoro-trigger status abc123def456 needs-human-review
```

### 4. List Tasks

List tasks on the remote machine (results returned via email).

**Format:**
```
[Pomodoro] list --status=<status>
```

**Options:**

| Option | Description |
|--------|-------------|
| `--status=<status>` | Filter by status |
| `--project=<name>` | Filter by project |

**Status values:** `active`, `completed`, `needs-human-review`, `all`

**Examples:**

```bash
# List all active tasks
pomodoro-trigger list --status=active

# List tasks needing human review
pomodoro-trigger list --status=needs-human-review

# List all tasks
pomodoro-trigger list --status=all

# List tasks in specific project
pomodoro-trigger list --project="My Project"
```

## Usage Examples

### Bash Script

```bash
#!/bin/bash

# Function to send trigger email
send_trigger() {
  local subject="[Pomodoro] $1"
  # Use nodemailer script here
  echo "Sending: $subject"
}

# Add a task
send_trigger 'add "Review PR #42" --project=Backend'

# Check pending reviews
send_trigger 'list --status=needs-human-review'

# Approve a task
send_trigger 'review abc123def456'

# Complete a task
send_trigger 'status xyz789completed completed'
```

### Node.js Integration

```javascript
const nodemailer = require('nodemailer');

const config = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  targetEmail: process.env.POMODORO_TARGET_EMAIL,
};

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

async function sendCommand(command, args = '') {
  const subject = `[Pomodoro] ${command} ${args}`.trim();
  
  await transporter.sendMail({
    from: config.smtp.user,
    to: config.targetEmail,
    subject: subject,
    text: ' ', // Body ignored
  });
  
  console.log(`Sent: ${subject}`);
}

// Examples
await sendCommand('add', '"New feature" --project=MyProject');
await sendCommand('review', 'abc123def456');
await sendCommand('status', 'abc123def456 completed');
await sendCommand('list', '--status=needs-human-review');
```

## Command Line Tool

Create a CLI script `pomodoro-trigger`:

```bash
#!/usr/bin/env node

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load config
function loadConfig() {
  const env = process.env;
  if (env.SMTP_HOST && env.SMTP_USER && env.POMODORO_TARGET_EMAIL) {
    return {
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.SMTP_FROM || env.SMTP_USER,
      },
      targetEmail: env.POMODORO_TARGET_EMAIL,
    };
  }
  
  const configPath = path.join(__dirname, 'pomodoro-trigger.config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  
  throw new Error('No configuration found. Set environment variables or create config file.');
}

// Parse command line arguments
function parseArgs(args) {
  const command = args[0];
  let rest = args.slice(1).join(' ');
  
  return { command, rest };
}

// Send email
async function send(subject) {
  const config = loadConfig();
  
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  
  await transporter.sendMail({
    from: config.smtp.from,
    to: config.targetEmail,
    subject: subject,
    text: ' ',
  });
  
  console.log(`Sent: ${subject}`);
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pomodoro-trigger <command> [args]');
  console.error('Commands: add, review, status, list');
  process.exit(1);
}

const { command, rest } = parseArgs(args);
const subject = `[Pomodoro] ${command} ${rest}`;

send(subject).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
```

## Mail Watcher Integration

The target machine should run a mail watcher that:

1. Monitors a dedicated email account
2. Filters emails with subject starting with `[Pomodoro]`
3. Parses the command and arguments
4. Executes the corresponding CLI command

Example mail watcher (pseudocode):

```javascript
// Watch for new emails
onNewEmail(email => {
  if (!email.subject.startsWith('[Pomodoro]')) return;
  
  const parts = email.subject.replace('[Pomodoro]', '').trim().split(' ');
  const command = parts[0];
  const args = parts.slice(1).join(' ');
  
  // Execute CLI command
  exec(`node dist/cli/index.js ${command} ${args}`);
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SMTP connection failed | Check SMTP_HOST and SMTP_PORT |
| Authentication failed | Verify SMTP_USER and SMTP_PASS |
| Email not received | Check spam folder, verify target email |
| Command not executed | Check mail watcher logs on target machine |

## Security Notes

- Use app-specific passwords for Gmail/Outlook
- Consider using OAuth2 for production deployments
- Restrict access to the target email account
- Use TLS/SSL for SMTP connections (port 465 or 587 with STARTTLS)
