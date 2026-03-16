---
name: pomodoro-page-reader
description: Read rendered page content from Pomodoro app via IPC. Use to get visible text from the main window for testing, debugging, or automation purposes.
user-invocable: true
allowed-tools: "Bash, Write"
metadata:
  version: "1.0.0"
  author: pomodoro-app
---

# Pomodoro Page Reader Skill

Read rendered page content from the Pomodoro app main window via IPC. This skill allows external scripts and agents to retrieve the visible text content displayed in the Electron renderer process.

## How It Works

1. The main process exposes a `get-page-text` IPC channel
2. The preload script provides `window.electronAPI.getPageText()` to the renderer
3. When invoked, the main process executes JavaScript in the renderer context to extract visible text
4. Text is filtered to exclude hidden elements (display: none, visibility: hidden, opacity: 0)

## Prerequisites

Before using this skill, ensure the Pomodoro app is built:

```bash
npm run build
```

The app must be running (either in development or production mode).

## Usage

### Command Line

```bash
# After building, copy dist to release (for production testing)
powershell -Command "Remove-Item -Path 'release\win-unpacked\resources\app\dist' -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item -Path 'dist' -Destination 'release\win-unpacked\resources\app\' -Recurse -Force"

# Run the exe
Start-Process "release\win-unpacked\Pomodoro App.exe"
```

### Node.js Script

Create a script to read page content:

```javascript
const { spawn } = require('child_process');
const path = require('path');

function getPageText() {
  return new Promise((resolve, reject) => {
    const electron = spawn(
      process.platform === 'win32' 
        ? path.join(__dirname, 'node_modules', '.bin', 'electron.cmd')
        : 'electron',
      [
        '.',
        '--remote-debugging-port=9222',
        '--no-sandbox'
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      }
    );

    let output = '';
    electron.stdout.on('data', (data) => { output += data; });
    electron.stderr.on('data', (data) => { output += data; });

    setTimeout(() => {
      electron.kill();
      resolve(output);
    }, 5000);
  });
}
```

### Direct IPC Invocation

For a running app, use a Node.js script with Electron's CDP (Chrome DevTools Protocol):

```javascript
const CDP = require('chrome-remote-interface');

async function getPageText() {
  const client = await CDP({ port: 9222 });
  const { Runtime } = client;
  
  await Runtime.enable();
  const result = await Runtime.evaluate({
    expression: `
      (function() {
        const getVisibleText = (element) => {
          let text = '';
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return '';
          }
          for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
              const trimmed = node.textContent?.trim() || '';
              if (trimmed) text += trimmed + ' ';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              text += getVisibleText(node) + ' ';
            }
          }
          return text.trim();
        };
        return getVisibleText(document.body);
      })()
    `
  });
  
  await client.close();
  return result.result.value;
}

getPageText().then(console.log);
```

## Available Scripts

### read-page.js

Create a script at project root:

```javascript
#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');

const platform = process.platform;
const isWindows = platform === 'win32';

function findElectron() {
  const electronPath = isWindows 
    ? path.join('node_modules', '.bin', 'electron.cmd')
    : path.join('node_modules', '.bin', 'electron');
  return electronPath;
}

function launchAndRead() {
  console.log('Starting Pomodoro app with remote debugging...');
  
  const electronProcess = spawn(
    findElectron(),
    ['.', '--remote-debugging-port=9222'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    }
  );

  let output = '';
  electronProcess.stdout.on('data', (data) => {
    output += data.toString();
  });
  electronProcess.stderr.on('data', (data) => {
    output += data.toString();
  });

  // Wait for app to start
  setTimeout(() => {
    console.log('\\nApp started. Output so far:');
    console.log(output.substring(0, 1000));
    
    // In practice, you'd use CDP here to connect to port 9222
    console.log('\\nUse Chrome DevTools Protocol on port 9222 to read page content');
    
    electronProcess.kill();
    process.exit(0);
  }, 3000);
}

launchAndRead();
```

## Integration with Agent Testing

For automated testing with agents:

```javascript
const http = require('http');

async function getPomodoroPageText() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const targets = JSON.parse(data);
        const target = targets.find(t => t.title.includes('Pomodoro'));
        if (!target) {
          reject(new Error('Pomodoro window not found'));
          return;
        }
        resolve(target.webSocketDebuggerUrl);
      });
    }).on('error', reject);
  });
}

async function readPage() {
  const wsUrl = await getPomodoroPageText();
  console.log('WebSocket URL:', wsUrl);
  // Connect using chrome-remote-interface or ws library
}
```

## Testing the Implementation

Verify the implementation works:

```bash
# Build the app
npm run build

# Start the app in development mode with debugging
npm run dev

# In another terminal, use a CDP client to test
node -e "
const CDP = require('chrome-remote-interface');
(async () => {
  const client = await CDP({ port: 9222 });
  const { Runtime } = client;
  await Runtime.enable();
  const result = await Runtime.evaluate({
    expression: 'document.body.innerText'
  });
  console.log('Page text:', result.result.value.substring(0, 500));
  await client.close();
})();
"
```

## What Text Is Returned

The implementation filters out:
- Elements with `display: none`
- Elements with `visibility: hidden`  
- Elements with `opacity: 0`
- Whitespace-only text nodes

It returns:
- All visible text content from the page
- Text is trimmed and normalized with single spaces between elements

## Common Use Cases

1. **Automated Testing**: Verify UI displays correct content
2. **Debugging**: Inspect current app state through rendered text
3. **Accessibility Testing**: Verify text is actually visible
4. **Agent Automation**: Allow agents to read app state for decision-making

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 9222 not available | Kill other Electron instances or use different port |
| Empty text returned | App window may not be focused or rendered yet |
| Error: window not available | Main window not created yet - ensure app is fully loaded |
| CDP connection refused | Ensure `--remote-debugging-port` flag is passed to Electron |

## Security Notes

- The `--remote-debugging-port` flag enables Chrome DevTools Protocol
- This should only be used for development/testing
- In production, disable remote debugging
- The IPC channel is protected by contextBridge (no nodeIntegration in renderer)
